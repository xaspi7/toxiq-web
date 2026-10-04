# TOXIQ V0 firmware 0.5.0

For **Seeed XIAO nRF52840 Plus**, **Seeed nRF52 Boards 1.1.13** (Adafruit core). Button 1 connects **D0 to GND**, button 2 connects **D1 to GND**, using normally-open switches and `INPUT_PULLUP`.

USB CDC configuration at 115200 baud. USB/BLE HID supports keys, shortcuts, text, media and mouse actions. USB has priority when a computer is attached. Configuration uses USB; saved macros work with the Configurator closed.

## Upload the ready-made firmware

1. Export your existing profiles from the app.
2. Connect the XIAO Plus with a USB data cable. Double-press RESET to open **NRF52BOOT**.
3. Copy **TOXIQ-V0-0.5.0.uf2** from the firmware ZIP to that drive. The board restarts as a keyboard, mouse and COM port.
4. Close Arduino Serial Monitor. Open Configurator 0.5 and select **Connect device**. Your local draft is preserved. Use **More options → Load from device** to read existing device settings.
5. Choose **Typing layout** to match the active Windows input layout: **English US**, **Czech QWERTZ**, or **Czech QWERTY**. The app detects a supported Windows layout for new or upgraded drafts. The selected layout is stored on the pad when you click **Save to device**.

This application-only UF2 requires the Seeed bootloader and S140 SoftDevice 7.3.0 used by the pinned core. It does not overwrite the bootloader, SoftDevice or profile storage. Version 1 profiles already in flash migrate in memory to version 2 with their previous US typing behaviour; both original flash slots remain intact until an explicit save.

## Upload the single Arduino sketch

- Board Manager URL: `https://files.seeedstudio.com/arduino/package_seeeduino_boards_index.json`.
- Install **Seeed nRF52 Boards 1.1.13**, then select **Seeed XIAO nRF52840 Plus** and its Port.
- Library Manager: **ArduinoJson 6.21.5**. TinyUSB, Bluefruit, LittleFS and InternalFileSystem are bundled with the board core.
- Open **TOXIQ_V0.ino**. Accept creation of the matching sketch folder if Arduino IDE asks. Click Upload. No other local `.h` or `.cpp` files are needed.

## Text and typing layouts

- Text macros are stored as UTF-8, up to **240 characters**. English US supports printable ASCII, newline and tab.
- Both Czech layouts support printable ASCII, newline, tab, **ěščřžýáíéúůďťňó**, their uppercase forms and **€**. Czech QWERTZ maps Y/Z and number-row symbols correctly; composed uppercase accents use dead-key sequences.
- The mappings were generated from the actual Windows layouts using `ToUnicodeEx`, then checked against Windows again in CI. Match the selected layout to the target computer. A USB/BLE keyboard cannot determine the host's active layout after the app closes.
- Unsupported characters are rejected before writing. Newlines send Enter; text macros do not add Enter automatically. Keyboard KEY/HOTKEY actions retain physical HID key semantics.
- The UI language (English/Czech) is independent of the typing layout and never translates your macro text.

## First physical check

1. Select CUSTOM. Map button 1 to TEXT `Příliš žluťoučký kůň. YZ yz 0123456789!` and button 2 to HOTKEY `CTRL+A`. Choose the matching Czech Windows layout and Save to device.
2. Open Notepad with the same active Windows layout. Press D0 and compare the full text, numbers, punctuation and Y/Z. D1 uses the physical shortcut configured in the app.
3. Close the Configurator, unplug and reconnect the pad, then repeat. Load from device in the app and confirm the profile, text and typing layout survived.
4. Test KEY F13, MEDIA VOLUME_MUTE and MOUSE SCROLL_DOWN in an appropriate app. Game support depends on the game.
5. For BLE, pair the keyboard with a Bluetooth host and disconnect USB from the computer. Remove the old TOXIQ V0 pairing if its HID services are cached.

V0 has two physical buttons and no backlight. Four profiles retain six saved slots each; only slots 1 and 2 run on this prototype. Flash uses two independent revision/CRC slots and verifies a new slot before acknowledging a write. The Configurator independently reads it back before reporting success. Physical testing on the prototype remains separate from compilation and simulated transport tests.

## Reproducible build

```sh
arduino-cli core update-index --additional-urls https://files.seeedstudio.com/arduino/package_seeeduino_boards_index.json
arduino-cli core install Seeeduino:nrf52@1.1.13 --additional-urls https://files.seeedstudio.com/arduino/package_seeeduino_boards_index.json
arduino-cli lib install ArduinoJson@6.21.5
python -m pip install adafruit-nrfutil==0.5.3.post16 'setuptools<81'
python firmware/scripts/test.py <ArduinoJson>/src
python firmware/scripts/single_sketch.py
arduino-cli compile --fqbn Seeeduino:nrf52:xiaonRF52840Plus --output-dir firmware/build firmware/build/TOXIQ_V0
python firmware/scripts/package.py --core <Seeeduino/nrf52/1.1.13>
```

CI compiles the same single sketch shipped to users and verifies that the UF2 contains only application addresses. Source modules are kept for maintenance and host tests; the exporter combines them for Arduino IDE.
