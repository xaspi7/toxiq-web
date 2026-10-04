"""Export the tested firmware as one Arduino IDE sketch, without local headers."""

import argparse
import pathlib


def export_sketch(output: pathlib.Path) -> None:
    root = pathlib.Path(__file__).resolve().parents[1]
    sources = ["TextLayout.h", "Config.h", "Storage.h", "Defaults.h", "toxiq_v0.ino"]
    includes = [line for line in (root / "toxiq_v0/toxiq_v0.ino").read_text().splitlines() if line.startswith("#include <")]
    sections = []
    for name in sources:
        lines = []
        for line in (root / "toxiq_v0" / name).read_text().splitlines():
            if line == "#pragma once":
                continue
            if line.startswith("#include "):
                if line.startswith('#include "'):
                    if line.split('"')[1] not in sources:
                        raise ValueError(f"Unexpected local dependency: {line}")
                elif line not in includes:
                    includes.append(line)
                continue
            lines.append(line)
        sections.append("\n".join(lines).strip())

    # The Arduino IDE inserts function prototypes before the first function.
    # Declare the storage type there and give the default argument only once.
    sections[1] = sections[1].replace("bool ascii = false) {", "bool ascii) {")
    header = """/*
 * TOXIQ V0 firmware 0.5.0 - single Arduino IDE sketch
 *
 * Board: Seeed XIAO nRF52840 Plus.
 * Board Manager: Seeed nRF52 Boards 1.1.13 (Adafruit core).
 * URL: https://files.seeedstudio.com/arduino/package_seeeduino_boards_index.json
 * Library Manager: ArduinoJson 6.21.5.
 * TinyUSB, Bluefruit and LittleFS are bundled with this board core.
 * Button 1: D0 -> switch -> GND. Button 2: D1 -> switch -> GND.
 *
 * Open TOXIQ_V0.ino. Accept the matching sketch folder if Arduino IDE asks.
 * Select the board and Port, then Upload. Close Serial Monitor before connecting.
 * No other local .h or .cpp file is needed.
 * USB configuration + USB/BLE HID. Select US or Czech QWERTZ/QWERTY in the app.
 */

"""
    prototypes = """
struct StorageHeader;
struct TextMapping;
enum TextLayoutId : int;
inline uint32_t storageCrc(const StorageHeader& header, const char* json);
inline bool stringValid(JsonVariantConst value, size_t maxUnits, bool ascii = false);

"""
    code = header + "\n".join(includes) + "\n" + prototypes
    labels = ["Text keyboard layouts", "Configuration validation and HID codes", "Flash storage", "Default profiles", "USB, BLE and buttons"]
    code += "\n\n".join(f"// {label}\n{section}" for label, section in zip(labels, sections)) + "\n"
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(code, encoding="utf-8")
    print(f"Exported single-file sketch: {output}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=pathlib.Path, default=pathlib.Path(__file__).resolve().parents[1] / "build/TOXIQ_V0/TOXIQ_V0.ino")
    export_sketch(parser.parse_args().output)
