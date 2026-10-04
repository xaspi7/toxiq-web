const { EventEmitter } = require('node:events');
const { SerialPort } = require('serialport');
const { ProtocolSession } = require('./protocol.cjs');

// Keep Seeed's assigned VID/PID. TOXIQ is identified by the protocol handshake,
// not by claiming a made-up USB identity or probing unrelated serial hardware.
const isCandidate = port => port.vendorId?.toLowerCase() === '2886' && ['8044', '8045', '8064', '8065'].includes(port.productId?.toLowerCase());
class UsbController extends EventEmitter {
  constructor() { super(); this.session = null; this.busy = false; }
  async list() {
    return (await SerialPort.list()).filter(isCandidate).map(port => ({ path: port.path, label: `${port.path} · ${port.serialNumber || 'XIAO nRF52840'}` }));
  }
  async connect(path) {
    if (this.busy || this.session) throw new Error('device_busy');
    if (typeof path !== 'string' || !(await this.list()).some(port => port.path === path)) throw new Error('no_device');
    this.busy = true;
    const port = new SerialPort({ path, baudRate: 115200, autoOpen: false, lock: true });
    const session = new ProtocolSession(port);
    this.session = session;
    session.on('button', event => this.emit('event', { type: 'button', ...event }));
    session.on('disconnected', message => { if (this.session === session) { this.session = null; this.emit('event', { type: 'disconnected', message }); } });
    try {
      await new Promise((resolve, reject) => port.open(error => error ? reject(new Error('usb_failed')) : resolve()));
      await new Promise((resolve, reject) => port.set({ dtr: true, rts: false }, error => error ? reject(new Error('usb_failed')) : resolve()));
      return await session.connect();
    } catch (error) { session.close(); throw error; }
    finally { this.busy = false; }
  }
  disconnect() { this.session?.close(); }
  async read() { if (!this.session) throw new Error('connect_first'); return this.session.read(); }
  async save(config) { if (!this.session) throw new Error('connect_first'); return this.session.save(config); }
}
module.exports = { UsbController, isCandidate };
