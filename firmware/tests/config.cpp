#include <cassert>
#include <iostream>
#include <string>
#include "Config.h"
#include "Defaults.h"

int main() {
  DynamicJsonDocument config(24 * 1024);
  assert(!deserializeJson(config,DEFAULT_CONFIG));
  assert(validConfig(config.as<JsonVariantConst>()));
  assert(crc32("123456789",9) == 0xCBF43926);
  uint8_t modifier, usage;
  assert(hotkeyUsage("CTRL+SHIFT+M",modifier,usage) && modifier == 3 && usage == 16);
  assert(hotkeyUsage("ALT+F24",modifier,usage) && modifier == 4 && usage == 115);
  assert(!hotkeyUsage("CTRL+CTRL+M",modifier,usage));
  assert(!hotkeyUsage("CTRL++M",modifier,usage));
  assert(keyUsage("F13") == 104 && keyUsage("F24") == 115 && keyUsage("F25") == 0);
  const char* types[] = {"key","hotkey","text","media","mouse"};
  const char* good[] = {"ENTER","META+ALT+DELETE","HELLO\nWORLD\t!","PREVIOUS_TRACK","MIDDLE_CLICK"};
  for (int i = 0; i < 5; i++) {
    config["profiles"]["moba"]["keys"][0]["type"] = types[i];
    config["profiles"]["moba"]["keys"][0]["value"] = good[i];
    assert(validConfig(config.as<JsonVariantConst>()));
    config["profiles"]["moba"]["keys"][0]["value"] = "INVALID";
    if (i != 2) assert(!validConfig(config.as<JsonVariantConst>()));
  }
  for (const char* value : {"Příliš", "\r", "   ", "\x01"}) {
    config["profiles"]["moba"]["keys"][0]["type"] = "text";
    config["profiles"]["moba"]["keys"][0]["value"] = value;
    assert(!validConfig(config.as<JsonVariantConst>()));
  }
  config["profiles"]["moba"]["keys"][0]["value"] = std::string(240,'A');
  assert(validConfig(config.as<JsonVariantConst>()));
  config["profiles"]["moba"]["keys"][0]["value"] = std::string(241,'A');
  assert(!validConfig(config.as<JsonVariantConst>()));
  deserializeJson(config,DEFAULT_CONFIG); config["version"] = 2;
  assert(!validConfig(config.as<JsonVariantConst>()));
  deserializeJson(config,DEFAULT_CONFIG); config["brightness"] = 101;
  assert(!validConfig(config.as<JsonVariantConst>()));
  deserializeJson(config,DEFAULT_CONFIG); config["activeProfile"] = "other";
  assert(!validConfig(config.as<JsonVariantConst>()));
  deserializeJson(config,DEFAULT_CONFIG); config["profiles"]["fps"]["keys"].as<JsonArray>().remove(5);
  assert(!validConfig(config.as<JsonVariantConst>()));
  std::cout << "Firmware config validation, HID mappings and CRC passed\n";
}
