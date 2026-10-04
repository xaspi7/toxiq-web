import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { actionError, CZECH_CHARACTERS, makeDefaultConfig, parseConfig } from '../src/config.ts';
import { errorText, translate } from '../src/i18n.ts';
const require = createRequire(import.meta.url);
const { layoutFromHandle } = require('../electron/keyboard.cjs');
const maps = JSON.parse(readFileSync(new URL('../../firmware/layouts/windows.json', import.meta.url)));

test('Czech typing accepts every mapped accent, numbers, punctuation, newline and tab', () => {
  for (const layout of ['CZ', 'CZ_QWERTY']) {
    const config = makeDefaultConfig(); config.textLayout = layout;
    config.profiles.moba.keys[0].value = 'Příliš žluťoučký kůň úpěl ďábelské ódy. YZ yz 0123456789!\n\t' + CZECH_CHARACTERS;
    assert.deepEqual(parseConfig(config), config);
    const supported = new Set(maps[layout].map(row => String.fromCodePoint(row[0])));
    for (const character of config.profiles.moba.keys[0].value) assert(supported.has(character));
    config.profiles.moba.keys[0].value = '🙂';
    assert.equal(actionError(config.profiles.moba.keys[0], layout), 'text_characters');
  }
});
test('version 1 import migrates safely and retains the previous US typing behaviour', () => {
  const config = makeDefaultConfig(); delete config.textLayout; config.version = 1;
  config.profiles.moba.keys[0].value = 'MY ORIGINAL MESSAGE';
  const migrated = parseConfig(config);
  assert.equal(migrated.version, 2); assert.equal(migrated.textLayout, 'US');
  assert.equal(migrated.profiles.moba.keys[0].value, 'MY ORIGINAL MESSAGE');
  assert.throws(() => parseConfig({ ...migrated, textLayout: 'unknown' }), /layout_invalid/);
});
test('layout detection distinguishes Windows Czech QWERTZ and QWERTY', () => {
  assert.equal(layoutFromHandle('04050405'), 'CZ');
  assert.equal(layoutFromHandle('F0010405'), 'CZ_QWERTY');
  assert.equal(layoutFromHandle('FFFFFFFFF0010405'), 'CZ_QWERTY');
  assert.equal(layoutFromHandle('04090409'), 'US');
  assert.equal(layoutFromHandle('04070407'), null);
  assert.equal(layoutFromHandle('F0020409'), null); // US International has dead keys.
  assert.equal(layoutFromHandle('invalid'), null);
});
test('English and Czech translate validation and USB errors without touching macro text', () => {
  assert.equal(translate('save', 'en'), 'Save to device');
  assert.equal(translate('save', 'cs'), 'Uložit do zařízení');
  assert.match(errorText('MOBA / 2 / text_required', 'en'), /Key 2: Enter/);
  assert.match(errorText('MOBA / 2 / text_required', 'cs'), /Klávesa 2: Doplň/);
  assert.match(errorText('usb_failed', 'en'), /USB connection failed/);
});
