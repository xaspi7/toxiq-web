import test from 'node:test';
import assert from 'node:assert/strict';
import { makeDefaultConfig, parseConfig, captureHotkey } from '../src/config.ts';
import { MockDevice } from '../src/device/device.ts';

test('import only accepts complete, valid six-key profiles', () => {
  const good = makeDefaultConfig();
  assert.deepEqual(parseConfig(good), good);
  const wrongCount = structuredClone(good);
  wrongCount.profiles.moba.keys.pop();
  assert.throws(() => parseConfig(wrongCount), /šest kláves/);
  const badAction = structuredClone(good);
  badAction.profiles.fps.keys[0].value = 'CTRL+CTRL+M';
  assert.throws(() => parseConfig(badAction), /zkratku/);
  const future = { ...good, version: 99 };
  assert.throws(() => parseConfig(future), /verze 1/);
  assert.throws(() => parseConfig({ ...good, brightness: 101 }), /Jas/);
});

test('recover an unfinished draft without allowing it as an imported profile', () => {
  const draft = makeDefaultConfig();
  draft.profiles.moba.keys[0].value = '';
  assert.throws(() => parseConfig(draft), /Doplň text/);
  assert.equal(parseConfig(draft, { allowDraft: true }).profiles.moba.keys[0].value, '');
});

test('v0.1 migration preserves user mappings and brightness', () => {
  const { version: _version, activeProfile: _active, ...legacy } = makeDefaultConfig();
  legacy.profiles.moba.keys[0].value = 'MY ORIGINAL CALL';
  legacy.brightness = 73;
  const migrated = parseConfig(legacy, { legacy: true });
  assert.equal(migrated.brightness, 73);
  assert.equal(migrated.profiles.moba.keys[0].value, 'MY ORIGINAL CALL');
  assert.equal(migrated.version, 1);
});

test('keyboard capture uses physical code, including Czech layout digit keys', () => {
  assert.equal(captureHotkey({ code: 'KeyM', ctrlKey: true, shiftKey: true, altKey: false, metaKey: false }), 'CTRL+SHIFT+M');
  assert.equal(captureHotkey({ code: 'Digit1', ctrlKey: false, shiftKey: true, altKey: false, metaKey: false }), 'SHIFT+1');
  assert.equal(captureHotkey({ code: 'ShiftLeft', ctrlKey: false, shiftKey: true, altKey: false, metaKey: false }), null);
});

test('save takes a snapshot, not a mutable reference to later edits', async () => {
  const device = new MockDevice();
  await device.connect();
  const config = makeDefaultConfig();
  const promise = device.saveConfig(config);
  config.profiles.moba.keys[0].value = 'CHANGED WHILE SAVING';
  await promise;
  assert.equal(device.getSavedConfig().profiles.moba.keys[0].value, 'BARON NOW');
});

test('disconnect and reconnect during a write cannot report success', async () => {
  const device = new MockDevice();
  await device.connect();
  const saving = device.saveConfig(makeDefaultConfig());
  device.disconnect();
  await device.connect();
  await assert.rejects(saving, /odpojilo/);
  assert.equal(device.getSavedConfig(), null);
});
