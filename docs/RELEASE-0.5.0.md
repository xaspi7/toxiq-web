# TOXIQ Configurator 0.5.0 · V0 development build

A compact desktop editor with an integrated Windows title bar, profile tabs, a single action selector and one Save to device control. English is the default; EN/CZ and Black/Lime or White/Violet choices are remembered.

Text macros now support Windows Czech QWERTZ and QWERTY, including Y/Z, digits, punctuation and Czech accents. A supported Windows input layout is detected for new or upgraded drafts; the selected typing layout is saved to the device. The UI language is independent of macro text.

Install the new Configurator and update the XIAO nRF52840 Plus firmware to 0.5.0. Use the ready-made UF2 in the firmware ZIP, or upload the standalone **TOXIQ_V0.ino** with Seeed nRF52 Boards 1.1.13 and ArduinoJson 6.21.5. Export profiles before updating. Existing version 1 profiles migrate without erasing flash.

V0 uses D0/D1 and has no backlight. Text mappings support the three listed Windows layouts; arbitrary Unicode and other host layouts are not included. KEY/HOTKEY actions use physical HID keys. The installer is currently unsigned. A physical check on the prototype is still needed; compilation, Windows startup and simulated transport checks are recorded separately.
