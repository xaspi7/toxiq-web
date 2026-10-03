#pragma once
#include <ArduinoJson.h>
#include <stdint.h>
#include <string.h>
#include <stdlib.h>

constexpr size_t MAX_CONFIG_BYTES = 10 * 1024;
const char* const PROFILE_IDS[] = {"moba", "fps", "creator", "custom"};

inline uint8_t keyUsage(const char* name) {
  if (!name) return 0;
  if (strlen(name) == 1) {
    if (*name >= 'A' && *name <= 'Z') return 4 + *name - 'A';
    if (*name >= '1' && *name <= '9') return 30 + *name - '1';
    if (*name == '0') return 39;
  }
  if (name[0] == 'F') {
    char* end; long n = strtol(name + 1, &end, 10);
    if (*end == 0 && n >= 1 && n <= 24 && name[1] != '0') return n <= 12 ? 57 + n : 104 + n - 13;
  }
  const char* names[] = {"ENTER","SPACE","TAB","ESC","BACKSPACE","DELETE","INSERT","HOME","END","PAGEUP","PAGEDOWN","UP","DOWN","LEFT","RIGHT"};
  const uint8_t codes[] = {40,44,43,41,42,76,73,74,77,75,78,82,81,80,79};
  for (size_t i = 0; i < 15; i++) if (!strcmp(name, names[i])) return codes[i];
  return 0;
}
inline bool hotkeyUsage(const char* value, uint8_t& modifiers, uint8_t& usage) {
  if (!value || strlen(value) >= 64) return false;
  char copy[64]; strcpy(copy, value); modifiers = 0; usage = 0;
  char* part = copy;
  for (;;) {
    char* separator = strchr(part, '+');
    if (!separator) { usage = keyUsage(part); return usage && modifiers; }
    *separator = 0;
    uint8_t bit = !strcmp(part,"CTRL") ? 1 : !strcmp(part,"SHIFT") ? 2 : !strcmp(part,"ALT") ? 4 : !strcmp(part,"META") ? 8 : 0;
    if (!bit || (modifiers & bit)) return false;
    modifiers |= bit; part = separator + 1;
  }
}
inline uint16_t mediaUsage(const char* name) {
  const char* names[] = {"PLAY_PAUSE","VOLUME_MUTE","VOLUME_UP","VOLUME_DOWN","NEXT_TRACK","PREVIOUS_TRACK"};
  const uint16_t codes[] = {0xCD,0xE2,0xE9,0xEA,0xB5,0xB6};
  for (size_t i = 0; i < 6; i++) if (!strcmp(name, names[i])) return codes[i];
  return 0;
}
inline uint8_t mouseAction(const char* name) {
  const char* names[] = {"LEFT_CLICK","RIGHT_CLICK","MIDDLE_CLICK","SCROLL_UP","SCROLL_DOWN"};
  for (size_t i = 0; i < 5; i++) if (!strcmp(name, names[i])) return i + 1;
  return 0;
}
inline bool stringValid(JsonVariantConst value, size_t maxUnits, bool ascii = false) {
  if (!value.is<const char*>()) return false;
  JsonString text = value.as<JsonString>();
  const char* str = text.c_str();
  if (strlen(str) != text.size()) return false; // No embedded NUL.
  size_t units = 0; bool nonWhitespace = false;
  for (const unsigned char* p = (const unsigned char*)str; *p; p++) {
    if (ascii && !(*p >= 32 && *p <= 126) && *p != '\n' && *p != '\t') return false;
    if ((*p & 0xC0) != 0x80) units += *p >= 0xF0 ? 2 : 1;
    if (*p != ' ' && *p != '\t' && *p != '\n' && *p != '\r') nonWhitespace = true;
  }
  return nonWhitespace && units <= maxUnits;
}
inline bool validConfig(JsonVariantConst config) {
  if (!config.is<JsonObjectConst>() || !config["version"].is<int>() || config["version"].as<int>() != 1 ||
      !config["brightness"].is<int>() || config["brightness"].as<int>() < 0 || config["brightness"].as<int>() > 100 ||
      measureJson(config) > MAX_CONFIG_BYTES) return false;
  const char* active = config["activeProfile"] | ""; bool found = false;
  for (const char* id : PROFILE_IDS) if (!strcmp(active,id)) found = true;
  if (!found) return false;
  for (const char* id : PROFILE_IDS) {
    JsonVariantConst profile = config["profiles"][id];
    if (!stringValid(profile["name"], 24) || !profile["keys"].is<JsonArrayConst>() || profile["keys"].size() != 6) return false;
    for (JsonVariantConst action : profile["keys"].as<JsonArrayConst>()) {
      if (!stringValid(action["label"],12) || !action["type"].is<const char*>() || !action["value"].is<const char*>()) return false;
      const char* type = action["type"]; const char* value = action["value"];
      if (!stringValid(action["value"],240)) return false;
      uint8_t modifier, usage;
      if (!strcmp(type,"text")) { if (!stringValid(action["value"],240,true)) return false; }
      else if (!strcmp(type,"key")) { if (!keyUsage(value)) return false; }
      else if (!strcmp(type,"hotkey")) { if (!hotkeyUsage(value,modifier,usage)) return false; }
      else if (!strcmp(type,"media")) { if (!mediaUsage(value)) return false; }
      else if (!strcmp(type,"mouse")) { if (!mouseAction(value)) return false; }
      else return false;
    }
  }
  return true;
}
inline uint32_t crc32(const void* data, size_t size) {
  uint32_t crc = 0xFFFFFFFF;
  const uint8_t* bytes = (const uint8_t*)data;
  for (size_t i = 0; i < size; i++) {
    crc ^= bytes[i];
    for (int bit = 0; bit < 8; bit++) crc = (crc >> 1) ^ ((crc & 1) ? 0xEDB88320 : 0);
  }
  return ~crc;
}
