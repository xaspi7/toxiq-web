const { EventEmitter } = require('node:events');
const { randomInt } = require('node:crypto');
const { parseConfig, TEXT_LAYOUTS } = require('./generated/config.cjs');

const MAX_FRAME_BYTES = 16 * 1024;
const MAX_CONFIG_BYTES = 10 * 1024;

function deviceConfig(input) {
  const config = parseConfig(input);
  if (Buffer.byteLength(JSON.stringify(config)) > MAX_CONFIG_BYTES) throw new Error('config_large');
  return config;
}
function deviceInfo(value) {
  if (!value || value.product !== 'TOXIQ' || value.protocol !== 1 || value.configVersion !== 2 ||
      typeof value.firmware !== 'string' || typeof value.serial !== 'string' || typeof value.model !== 'string' ||
      !Number.isInteger(value.physicalKeys) || value.physicalKeys < 1 || value.physicalKeys > 6 || value.slots !== 6 ||
      typeof value.brightness !== 'boolean' || typeof value.storage !== 'boolean' || !Array.isArray(value.textLayouts) || !TEXT_LAYOUTS.every(layout => value.textLayouts.includes(layout))) {
    throw new Error('firmware_required');
  }
  if (!value.storage) throw new Error('storage_unavailable');
  return { product: value.product, protocol: 1, configVersion: 2, firmware: value.firmware, serial: value.serial,
    model: value.model, physicalKeys: value.physicalKeys, slots: 6, brightness: value.brightness, storage: true, textLayouts: [...TEXT_LAYOUTS] };
}
const errors = Object.fromEntries(['conflict', 'storage', 'invalid_config', 'protocol', 'too_large'].map(code => [code, code]));

// One request at a time. A timeout invalidates the session: a late acknowledgement
// must never be mistaken for a successful retry or a write to another device.
class ProtocolSession extends EventEmitter {
  constructor(port, { timeout = 5000, writeTimeout = 10000 } = {}) {
    super(); this.port = port; this.timeout = timeout; this.writeTimeout = writeTimeout;
    this.buffer = Buffer.alloc(0); this.nextId = randomInt(1, 1000000); this.pending = null;
    this.closed = false; this.info = null; this.revision = null;
    this.onData = chunk => this.receive(chunk);
    this.onClose = () => this.fail(new Error('usb_disconnected'));
    this.onError = () => this.fail(new Error('usb_failed'));
    port.on('data', this.onData); port.on('close', this.onClose); port.on('error', this.onError);
  }
  fail(error) {
    if (this.closed) return;
    this.closed = true;
    if (this.pending) { clearTimeout(this.pending.timer); this.pending.reject(error); this.pending = null; }
    this.emit('disconnected', error.message);
    if (this.port.isOpen) this.port.close(() => {});
  }
  close() { this.fail(new Error('usb_closed')); }
  receive(chunk) {
    if (this.closed) return;
    this.buffer = Buffer.concat([this.buffer, chunk]);
    let end;
    while ((end = this.buffer.indexOf(10)) !== -1) {
      const line = this.buffer.subarray(0, end); this.buffer = this.buffer.subarray(end + 1);
      if (line.length > MAX_FRAME_BYTES) { this.fail(new Error('response_large')); return; }
      let frame;
      try { frame = JSON.parse(line.toString('utf8')); } catch { continue; }
      if (frame.event === 'button' && frame.protocol === 1 && Number.isInteger(frame.key) && frame.key >= 0 && frame.key < (this.info?.physicalKeys ?? 0) && typeof frame.pressed === 'boolean') {
        this.emit('button', { key: frame.key, pressed: frame.pressed }); continue;
      }
      const pending = this.pending;
      if (!pending || frame.id !== pending.id) continue;
      clearTimeout(pending.timer); this.pending = null;
      if (frame.protocol !== 1 || typeof frame.ok !== 'boolean') {
        const error = new Error('response_invalid'); pending.reject(error); this.fail(error); return;
      }
      if (!frame.ok) pending.reject(new Error(errors[frame.error] || 'request_rejected'));
      else pending.resolve(frame);
    }
    if (this.buffer.length > MAX_FRAME_BYTES) this.fail(new Error('response_large'));
  }
  request(op, payload = {}) {
    if (this.closed) return Promise.reject(new Error('connect_first'));
    if (this.pending) return Promise.reject(new Error('device_busy'));
    const id = this.nextId++;
    const data = JSON.stringify({ protocol: 1, id, op, ...payload }) + '\n';
    if (Buffer.byteLength(data) > MAX_FRAME_BYTES) return Promise.reject(new Error('request_large'));
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => this.fail(new Error('timeout')), op === 'set' ? this.writeTimeout : this.timeout);
      this.pending = { id, resolve, reject, timer };
      this.port.write(data, error => { if (error) this.fail(new Error('send_failed')); });
    });
  }
  async connect() {
    const hello = await this.request('hello');
    this.info = deviceInfo(hello.device);
    const result = await this.read();
    return { info: this.info, ...result };
  }
  async read() {
    const reply = await this.request('get');
    if (!Number.isSafeInteger(reply.revision) || reply.revision < 0) throw new Error('revision_invalid');
    const config = deviceConfig(reply.config);
    this.revision = reply.revision;
    return { config, revision: reply.revision };
  }
  async save(input) {
    if (!this.info || this.revision === null) throw new Error('session_unverified');
    const config = deviceConfig(input);
    const reply = await this.request('set', { config, expectedRevision: this.revision });
    if (!Number.isSafeInteger(reply.revision) || reply.revision < this.revision) throw new Error('revision_unconfirmed');
    // Firmware only acknowledges after flash readback. Independently GET and
    // compare the actual stored configuration before showing success in the UI.
    const stored = await this.read();
    if (stored.revision !== reply.revision || JSON.stringify(stored.config) !== JSON.stringify(config)) throw new Error('readback_failed');
    return stored;
  }
}
module.exports = { ProtocolSession, deviceConfig, MAX_FRAME_BYTES };
