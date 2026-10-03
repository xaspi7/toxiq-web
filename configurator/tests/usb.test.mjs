import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { createRequire } from 'node:module';
import { makeDefaultConfig } from '../src/config.ts';
const require = createRequire(import.meta.url);
const { ProtocolSession, deviceConfig } = require('../electron/protocol.cjs');
const { isCandidate } = require('../electron/usb.cjs');
const info = { product: 'TOXIQ', protocol: 1, configVersion: 1, firmware: '0.4.0', serial: '123456789ABCDEF0', model: 'XIAO nRF52840 Plus V0', physicalKeys: 2, slots: 6, brightness: false, storage: true, textLayout: 'US' };

class FirmwareTransport extends EventEmitter {
  isOpen = true;
  config = makeDefaultConfig();
  revision = 0;
  writes = [];
  respond = true;
  corruptReadback = false;
  rejectStorage = false;
  write(data, callback) {
    const request = JSON.parse(data); this.writes.push(request); callback(null);
    if (!this.respond) return;
    setImmediate(() => {
      let reply = { protocol: 1, id: request.id, ok: true };
      if (request.op === 'hello') reply.device = info;
      if (request.op === 'get') { reply.config = structuredClone(this.config); reply.revision = this.revision; if (this.corruptReadback && this.revision) reply.config.brightness = 99; }
      if (request.op === 'set') {
        if (this.rejectStorage) reply = { ...reply, ok: false, error: 'storage' };
        else if (request.expectedRevision !== this.revision) reply = { ...reply, ok: false, error: 'conflict' };
        else { this.config = structuredClone(request.config); this.revision++; reply.revision = this.revision; }
      }
      const bytes = Buffer.from(JSON.stringify(reply) + '\n');
      // Real USB reads can split UTF-8 characters and combine lines arbitrarily.
      for (let i = 0; i < bytes.length; i += 13) this.emit('data', bytes.subarray(i, i + 13));
    });
  }
  close(callback) { this.isOpen = false; this.emit('close'); callback?.(); }
}

test('only Seeed nRF52840 application ports, including Plus, are candidates', () => {
  assert.equal(isCandidate({ vendorId: '2886', productId: '8064' }), true);
  assert.equal(isCandidate({ vendorId: '2886', productId: '0064' }), false); // Bootloader.
  assert.equal(isCandidate({ vendorId: '1234', productId: '8064' }), false);
  assert.equal(isCandidate({ path: 'COM1' }), false);
});
test('handshake, split UTF-8 read, write and independent readback', async () => {
  const port = new FirmwareTransport(); port.config.profiles.moba.keys[0].label = 'ŽLUŤOUČKÝ';
  const session = new ProtocolSession(port); const initial = await session.connect();
  assert.equal(initial.info.physicalKeys, 2); assert.equal(initial.config.profiles.moba.keys[0].label, 'ŽLUŤOUČKÝ');
  const next = makeDefaultConfig(); next.profiles.custom.keys[1] = { label: 'CLIP', type: 'hotkey', value: 'ALT+F24' }; next.activeProfile = 'custom';
  const saved = await session.save(next); assert.deepEqual(saved.config, next); assert.equal(saved.revision, 1);
  assert.deepEqual(port.writes.map(frame => frame.op), ['hello', 'get', 'set', 'get']);
  session.close();
});
test('failure or readback mismatch cannot report a successful save', async () => {
  const port = new FirmwareTransport(); const session = new ProtocolSession(port); await session.connect();
  const draft = makeDefaultConfig(); draft.brightness = 65;
  port.rejectStorage = true; await assert.rejects(session.save(draft), /paměti/); assert.equal(port.revision, 0); assert.equal(draft.brightness, 65);
  port.rejectStorage = false; port.corruptReadback = true; await assert.rejects(session.save(draft), /nesouhlasí/);
  session.close();
});
test('revision conflict preserves another writer’s configuration', async () => {
  const port = new FirmwareTransport(); const session = new ProtocolSession(port); await session.connect();
  port.revision++; port.config.brightness = 72;
  await assert.rejects(session.save(makeDefaultConfig()), /mezitím změnilo/); assert.equal(port.config.brightness, 72);
  session.close();
});
test('timeout invalidates connection; unplug rejects pending work immediately', async () => {
  const port = new FirmwareTransport(); const session = new ProtocolSession(port, { timeout: 30, writeTimeout: 30 }); await session.connect();
  port.respond = false;
  await assert.rejects(session.save(makeDefaultConfig()), /neodpovědělo/); assert.equal(session.closed, true);
  await assert.rejects(session.read(), /připoj/);
  const other = new FirmwareTransport(); const connected = new ProtocolSession(other); await connected.connect(); other.respond = false;
  const write = connected.save(makeDefaultConfig()); other.close(); await assert.rejects(write, /odpojilo/);
});
test('button events do not consume responses; oversize frames close the session', async () => {
  const port = new FirmwareTransport(); const session = new ProtocolSession(port); await session.connect();
  const events = []; session.on('button', event => events.push(event));
  port.emit('data', Buffer.from('{"protocol":1,"event":"button","key":1,"pressed":true}\n'));
  port.emit('data', Buffer.from('{"protocol":1,"event":"button","key":5,"pressed":true}\n'));
  assert.deepEqual(events, [{ key: 1, pressed: true }]);
  port.emit('data', Buffer.alloc(17 * 1024, 65)); assert.equal(session.closed, true);
});
test('unsupported text is rejected before any hardware write', () => {
  const config = makeDefaultConfig(); config.profiles.moba.keys[0].value = 'Příliš';
  assert.throws(() => deviceConfig(config), /diakritiky/);
  config.profiles.moba.keys[0].value = 'HELLO\nWORLD\t!'; assert.deepEqual(deviceConfig(config), config);
});
