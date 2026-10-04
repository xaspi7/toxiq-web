# Verification — Configurator 0.5.0

## Local checks · 2026-10-04

- `npm run check`, `npm test` (18 tests) and `npm run build` passed.
- App Chromium QA passed: English default, EN/CZ persistence, new layout detection, all five action editors, hotkey capture, retained action drafts, Czech save, two physical V0 keys/four future slots, no V0 backlight control, valid/invalid import, export and demo connect/save. Both palettes and 390–1120 px layouts were checked without horizontal overflow or app errors.
- Site Chromium QA passed: English default, persistent EN/CZ switch, three product profiles, both palettes, decoded images, download URLs, standalone sketch, first-time setup, reduced motion and 320–1440 px layouts. The desktop and narrow layouts were inspected visually.
- Node tests include version 1 migration, Czech character validation, split UTF-8 USB transport, flash acknowledgement plus independent readback, conflicts, disconnects and signed Windows layout handles.
- Host C++ tests include ASCII/Czech mapping, Y/Z, shifted Czech digits, uppercase dead-key accents, 240-character UTF-8 limits, invalid UTF-8, CRC32 and preserved legacy flash profiles.
- Keyboard mappings were generated on Windows with native `ToUnicodeEx` for layouts 00000409, 00000405 and 00010405. CI verifies the checked-in data against those Windows layouts.
- `downloads/TOXIQ_V0.ino` is generated from the firmware sources. It has no local header dependencies. The firmware CI compiles this exact single-file export for the XIAO nRF52840 Plus.

## Release checks

The release workflow requires the web, native Windows and firmware jobs to pass before publishing. The Windows job builds the x64 installer and starts the packaged app to verify its renderer, preload bridge, native SerialPort enumeration and integrated window controls. The firmware job uses Seeed nRF52 Boards 1.1.13 and ArduinoJson 6.21.5, then packages the UF2 and standalone sketch.

## Hardware boundary

The physical XIAO connected to Adam's computer is unavailable in this environment. Browser bridges and transport fixtures simulate the device; they do not prove physical USB/BLE behavior. Follow the hardware check in `firmware/README.md`: flash 0.5.0, verify Czech text with the matching Windows layout, test both switches, save/readback, power-cycle persistence and USB/BLE HID actions. The installer is currently unsigned.

## Previous evidence

Version 0.4 passed [GitHub Actions run 37135098196](https://github.com/xaspi7/toxiq-web/actions/runs/37135098196): web checks, XIAO firmware compilation and packaged Windows startup. Its native Linux SerialPort binding also passed a PTY handshake/write/readback test against simulated firmware. Those results describe 0.4; they do not substitute for the 0.5 release checks.
