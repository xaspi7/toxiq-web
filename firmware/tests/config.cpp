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
  deserializeJson(config,DEFAULT_CONFIG); config["version"] = 99;
  assert(!validConfig(config.as<JsonVariantConst>()));
  deserializeJson(config,DEFAULT_CONFIG); config["brightness"] = 101;
  assert(!validConfig(config.as<JsonVariantConst>()));
  deserializeJson(config,DEFAULT_CONFIG); config["activeProfile"] = "other";
  assert(!validConfig(config.as<JsonVariantConst>()));
  deserializeJson(config,DEFAULT_CONFIG); config["profiles"]["fps"]["keys"].as<JsonArray>().remove(5);
  assert(!validConfig(config.as<JsonVariantConst>()));
  deserializeJson(config,DEFAULT_CONFIG); config["textLayout"] = "CZ";
  config["profiles"]["moba"]["keys"][0]["value"] = "Příliš žluťoučký kůň úpěl ďábelské ódy. YZ yz 0123456789!";
  assert(validConfig(config.as<JsonVariantConst>()));
  assert(textMapping('y',LAYOUT_CZ)->strokes[0].usage == keyUsage("Z"));
  assert(textMapping('z',LAYOUT_CZ)->strokes[0].usage == keyUsage("Y"));
  assert(textMapping('y',LAYOUT_CZ_QWERTY)->strokes[0].usage == keyUsage("Y"));
  assert(textMapping('1',LAYOUT_CZ)->strokes[0].modifier == 2);
  assert(textMapping(0x010C,LAYOUT_CZ)->strokes[1].usage != 0); // Č needs a dead key.
  for (TextLayoutId layout : {LAYOUT_CZ,LAYOUT_CZ_QWERTY}) {
    assert(textSupported("ěščřžýáíéúůďťňóĚŠČŘŽÝÁÍÉÚŮĎŤŇÓ€",layout));
    assert(!textSupported("😀",layout));
    assert(!textSupported("\xC0\xAF",layout));
    assert(!textSupported("\xED\xA0\x80",layout));
  }
  std::string longCzech; for (int i=0;i<240;i++) longCzech += "ů";
  assert(textSupported(longCzech.c_str(),LAYOUT_CZ));
  longCzech += "ů"; assert(!textSupported(longCzech.c_str(),LAYOUT_CZ));
  deserializeJson(config,DEFAULT_CONFIG); config["version"]=1; config.remove("textLayout");
  assert(validConfig(config.as<JsonVariantConst>())); // Existing flash survives the upgrade.
  std::cout << "Firmware config validation, HID mappings and CRC passed\n";
}
