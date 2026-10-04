"""Export the tested firmware as one Arduino IDE sketch, without local headers."""

import argparse
import pathlib


def export_sketch(output: pathlib.Path) -> None:
    root = pathlib.Path(__file__).resolve().parents[1]
    sources = ["Config.h", "Storage.h", "Defaults.h", "toxiq_v0.ino"]
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
    sections[0] = sections[0].replace("bool ascii = false) {", "bool ascii) {")
    header = """/*
 * TOXIQ V0 firmware 0.4.0 - jeden soubor pro Arduino IDE
 *
 * Deska: Seeed XIAO nRF52840 Plus.
 * Board Manager: Seeed nRF52 Boards 1.1.13 (nikoli mbed).
 * URL: https://files.seeedstudio.com/arduino/package_seeeduino_boards_index.json
 * Library Manager: ArduinoJson 6.21.5.
 * TinyUSB, Bluefruit a LittleFS jsou soucasti uvedeneho board core.
 * Tlacitko 1: D0 -> spinac -> GND. Tlacitko 2: D1 -> spinac -> GND.
 *
 * Otevri TOXIQ_V0.ino. Pokud IDE nabidne stejnojmennou slozku, potvrd ji.
 * Vyber desku a Port, pak Nahraj. Pro pripojeni v aplikaci zavri Serial Monitor.
 * Zadny dalsi lokalni .h nebo .cpp soubor neni potreba.
 * USB konfigurace + USB/BLE klavesnice/mys; textova makra pouzivaji US layout.
 */

"""
    prototypes = """
struct StorageHeader;
inline uint32_t storageCrc(const StorageHeader& header, const char* json);
inline bool stringValid(JsonVariantConst value, size_t maxUnits, bool ascii = false);

"""
    code = header + "\n".join(includes) + "\n" + prototypes
    labels = ["Validace konfigurace a HID kody", "Ukladani do flash", "Vychozi profily", "USB, BLE a tlacitka"]
    code += "\n\n".join(f"// {label}\n{section}" for label, section in zip(labels, sections)) + "\n"
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(code, encoding="utf-8")
    print(f"Exported single-file sketch: {output}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=pathlib.Path, default=pathlib.Path(__file__).resolve().parents[1] / "build/TOXIQ_V0/TOXIQ_V0.ino")
    export_sketch(parser.parse_args().output)
