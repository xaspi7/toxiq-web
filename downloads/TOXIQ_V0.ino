/*
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

#include <Adafruit_TinyUSB.h>
#include <bluefruit.h>
#include <stdint.h>
#include <stddef.h>
#include <string.h>
#include <ArduinoJson.h>
#include <stdlib.h>
#include <Adafruit_LittleFS.h>
#include <InternalFileSystem.h>

struct StorageHeader;
struct TextMapping;
enum TextLayoutId : int;
inline uint32_t storageCrc(const StorageHeader& header, const char* json);
inline bool stringValid(JsonVariantConst value, size_t maxUnits, bool ascii = false);

// Text keyboard layouts
// Generated from Windows ToUnicodeEx by firmware/scripts/windows-layouts.ps1.
// Each character needs one or two HID strokes; the second handles dead keys.
enum TextLayoutId : int { LAYOUT_US, LAYOUT_CZ, LAYOUT_CZ_QWERTY };
struct TextStroke { uint8_t modifier; uint8_t usage; };
struct TextMapping { uint32_t codepoint; TextStroke strokes[2]; };
const TextMapping TEXT_US[] = {
  {0x0009, {{0,43},{0,0}}},
  {0x000A, {{0,40},{0,0}}},
  {0x0020, {{0,44},{0,0}}},
  {0x0021, {{2,30},{0,0}}},
  {0x0022, {{2,52},{0,0}}},
  {0x0023, {{2,32},{0,0}}},
  {0x0024, {{2,33},{0,0}}},
  {0x0025, {{2,34},{0,0}}},
  {0x0026, {{2,36},{0,0}}},
  {0x0027, {{0,52},{0,0}}},
  {0x0028, {{2,38},{0,0}}},
  {0x0029, {{2,39},{0,0}}},
  {0x002A, {{2,37},{0,0}}},
  {0x002B, {{2,46},{0,0}}},
  {0x002C, {{0,54},{0,0}}},
  {0x002D, {{0,45},{0,0}}},
  {0x002E, {{0,55},{0,0}}},
  {0x002F, {{0,56},{0,0}}},
  {0x0030, {{0,39},{0,0}}},
  {0x0031, {{0,30},{0,0}}},
  {0x0032, {{0,31},{0,0}}},
  {0x0033, {{0,32},{0,0}}},
  {0x0034, {{0,33},{0,0}}},
  {0x0035, {{0,34},{0,0}}},
  {0x0036, {{0,35},{0,0}}},
  {0x0037, {{0,36},{0,0}}},
  {0x0038, {{0,37},{0,0}}},
  {0x0039, {{0,38},{0,0}}},
  {0x003A, {{2,51},{0,0}}},
  {0x003B, {{0,51},{0,0}}},
  {0x003C, {{2,54},{0,0}}},
  {0x003D, {{0,46},{0,0}}},
  {0x003E, {{2,55},{0,0}}},
  {0x003F, {{2,56},{0,0}}},
  {0x0040, {{2,31},{0,0}}},
  {0x0041, {{2,4},{0,0}}},
  {0x0042, {{2,5},{0,0}}},
  {0x0043, {{2,6},{0,0}}},
  {0x0044, {{2,7},{0,0}}},
  {0x0045, {{2,8},{0,0}}},
  {0x0046, {{2,9},{0,0}}},
  {0x0047, {{2,10},{0,0}}},
  {0x0048, {{2,11},{0,0}}},
  {0x0049, {{2,12},{0,0}}},
  {0x004A, {{2,13},{0,0}}},
  {0x004B, {{2,14},{0,0}}},
  {0x004C, {{2,15},{0,0}}},
  {0x004D, {{2,16},{0,0}}},
  {0x004E, {{2,17},{0,0}}},
  {0x004F, {{2,18},{0,0}}},
  {0x0050, {{2,19},{0,0}}},
  {0x0051, {{2,20},{0,0}}},
  {0x0052, {{2,21},{0,0}}},
  {0x0053, {{2,22},{0,0}}},
  {0x0054, {{2,23},{0,0}}},
  {0x0055, {{2,24},{0,0}}},
  {0x0056, {{2,25},{0,0}}},
  {0x0057, {{2,26},{0,0}}},
  {0x0058, {{2,27},{0,0}}},
  {0x0059, {{2,28},{0,0}}},
  {0x005A, {{2,29},{0,0}}},
  {0x005B, {{0,47},{0,0}}},
  {0x005C, {{0,49},{0,0}}},
  {0x005D, {{0,48},{0,0}}},
  {0x005E, {{2,35},{0,0}}},
  {0x005F, {{2,45},{0,0}}},
  {0x0060, {{0,53},{0,0}}},
  {0x0061, {{0,4},{0,0}}},
  {0x0062, {{0,5},{0,0}}},
  {0x0063, {{0,6},{0,0}}},
  {0x0064, {{0,7},{0,0}}},
  {0x0065, {{0,8},{0,0}}},
  {0x0066, {{0,9},{0,0}}},
  {0x0067, {{0,10},{0,0}}},
  {0x0068, {{0,11},{0,0}}},
  {0x0069, {{0,12},{0,0}}},
  {0x006A, {{0,13},{0,0}}},
  {0x006B, {{0,14},{0,0}}},
  {0x006C, {{0,15},{0,0}}},
  {0x006D, {{0,16},{0,0}}},
  {0x006E, {{0,17},{0,0}}},
  {0x006F, {{0,18},{0,0}}},
  {0x0070, {{0,19},{0,0}}},
  {0x0071, {{0,20},{0,0}}},
  {0x0072, {{0,21},{0,0}}},
  {0x0073, {{0,22},{0,0}}},
  {0x0074, {{0,23},{0,0}}},
  {0x0075, {{0,24},{0,0}}},
  {0x0076, {{0,25},{0,0}}},
  {0x0077, {{0,26},{0,0}}},
  {0x0078, {{0,27},{0,0}}},
  {0x0079, {{0,28},{0,0}}},
  {0x007A, {{0,29},{0,0}}},
  {0x007B, {{2,47},{0,0}}},
  {0x007C, {{2,49},{0,0}}},
  {0x007D, {{2,48},{0,0}}},
  {0x007E, {{2,53},{0,0}}},
};
const TextMapping TEXT_CZ[] = {
  {0x0009, {{0,43},{0,0}}},
  {0x000A, {{0,40},{0,0}}},
  {0x0020, {{0,44},{0,0}}},
  {0x0021, {{2,52},{0,0}}},
  {0x0022, {{2,51},{0,0}}},
  {0x0023, {{64,27},{0,0}}},
  {0x0024, {{64,51},{0,0}}},
  {0x0025, {{2,45},{0,0}}},
  {0x0026, {{64,6},{0,0}}},
  {0x0027, {{2,49},{0,0}}},
  {0x0028, {{2,48},{0,0}}},
  {0x0029, {{0,48},{0,0}}},
  {0x002A, {{64,56},{0,0}}},
  {0x002B, {{0,30},{0,0}}},
  {0x002C, {{0,54},{0,0}}},
  {0x002D, {{0,56},{0,0}}},
  {0x002E, {{0,55},{0,0}}},
  {0x002F, {{2,47},{0,0}}},
  {0x0030, {{2,39},{0,0}}},
  {0x0031, {{2,30},{0,0}}},
  {0x0032, {{2,31},{0,0}}},
  {0x0033, {{2,32},{0,0}}},
  {0x0034, {{2,33},{0,0}}},
  {0x0035, {{2,34},{0,0}}},
  {0x0036, {{2,35},{0,0}}},
  {0x0037, {{2,36},{0,0}}},
  {0x0038, {{2,37},{0,0}}},
  {0x0039, {{2,38},{0,0}}},
  {0x003A, {{2,55},{0,0}}},
  {0x003B, {{0,53},{0,0}}},
  {0x003C, {{64,54},{0,0}}},
  {0x003D, {{0,45},{0,0}}},
  {0x003E, {{64,55},{0,0}}},
  {0x003F, {{2,54},{0,0}}},
  {0x0040, {{64,25},{0,0}}},
  {0x0041, {{2,4},{0,0}}},
  {0x0042, {{2,5},{0,0}}},
  {0x0043, {{2,6},{0,0}}},
  {0x0044, {{2,7},{0,0}}},
  {0x0045, {{2,8},{0,0}}},
  {0x0046, {{2,9},{0,0}}},
  {0x0047, {{2,10},{0,0}}},
  {0x0048, {{2,11},{0,0}}},
  {0x0049, {{2,12},{0,0}}},
  {0x004A, {{2,13},{0,0}}},
  {0x004B, {{2,14},{0,0}}},
  {0x004C, {{2,15},{0,0}}},
  {0x004D, {{2,16},{0,0}}},
  {0x004E, {{2,17},{0,0}}},
  {0x004F, {{2,18},{0,0}}},
  {0x0050, {{2,19},{0,0}}},
  {0x0051, {{2,20},{0,0}}},
  {0x0052, {{2,21},{0,0}}},
  {0x0053, {{2,22},{0,0}}},
  {0x0054, {{2,23},{0,0}}},
  {0x0055, {{2,24},{0,0}}},
  {0x0056, {{2,25},{0,0}}},
  {0x0057, {{2,26},{0,0}}},
  {0x0058, {{2,27},{0,0}}},
  {0x0059, {{2,29},{0,0}}},
  {0x005A, {{2,28},{0,0}}},
  {0x005B, {{64,9},{0,0}}},
  {0x005C, {{0,100},{0,0}}},
  {0x005D, {{64,10},{0,0}}},
  {0x005E, {{64,32},{0,44}}},
  {0x005F, {{2,56},{0,0}}},
  {0x0060, {{64,36},{0,44}}},
  {0x0061, {{0,4},{0,0}}},
  {0x0062, {{0,5},{0,0}}},
  {0x0063, {{0,6},{0,0}}},
  {0x0064, {{0,7},{0,0}}},
  {0x0065, {{0,8},{0,0}}},
  {0x0066, {{0,9},{0,0}}},
  {0x0067, {{0,10},{0,0}}},
  {0x0068, {{0,11},{0,0}}},
  {0x0069, {{0,12},{0,0}}},
  {0x006A, {{0,13},{0,0}}},
  {0x006B, {{0,14},{0,0}}},
  {0x006C, {{0,15},{0,0}}},
  {0x006D, {{0,16},{0,0}}},
  {0x006E, {{0,17},{0,0}}},
  {0x006F, {{0,18},{0,0}}},
  {0x0070, {{0,19},{0,0}}},
  {0x0071, {{0,20},{0,0}}},
  {0x0072, {{0,21},{0,0}}},
  {0x0073, {{0,22},{0,0}}},
  {0x0074, {{0,23},{0,0}}},
  {0x0075, {{0,24},{0,0}}},
  {0x0076, {{0,25},{0,0}}},
  {0x0077, {{0,26},{0,0}}},
  {0x0078, {{0,27},{0,0}}},
  {0x0079, {{0,29},{0,0}}},
  {0x007A, {{0,28},{0,0}}},
  {0x007B, {{64,5},{0,0}}},
  {0x007C, {{2,100},{0,0}}},
  {0x007D, {{64,17},{0,0}}},
  {0x007E, {{64,30},{0,0}}},
  {0x00C1, {{0,46},{2,4}}},
  {0x00C9, {{0,46},{2,8}}},
  {0x00CD, {{0,46},{2,12}}},
  {0x00D3, {{0,46},{2,18}}},
  {0x00DA, {{0,46},{2,24}}},
  {0x00DD, {{0,46},{2,29}}},
  {0x00E1, {{0,37},{0,0}}},
  {0x00E9, {{0,39},{0,0}}},
  {0x00ED, {{0,38},{0,0}}},
  {0x00F3, {{0,46},{0,18}}},
  {0x00FA, {{0,47},{0,0}}},
  {0x00FD, {{0,36},{0,0}}},
  {0x010C, {{2,46},{2,6}}},
  {0x010D, {{0,33},{0,0}}},
  {0x010E, {{2,46},{2,7}}},
  {0x010F, {{2,46},{0,7}}},
  {0x011A, {{2,46},{2,8}}},
  {0x011B, {{0,31},{0,0}}},
  {0x0147, {{2,46},{2,17}}},
  {0x0148, {{2,46},{0,17}}},
  {0x0158, {{2,46},{2,21}}},
  {0x0159, {{0,34},{0,0}}},
  {0x0160, {{2,46},{2,22}}},
  {0x0161, {{0,32},{0,0}}},
  {0x0164, {{2,46},{2,23}}},
  {0x0165, {{2,46},{0,23}}},
  {0x016E, {{2,53},{2,24}}},
  {0x016F, {{0,51},{0,0}}},
  {0x017D, {{2,46},{2,28}}},
  {0x017E, {{0,35},{0,0}}},
  {0x20AC, {{64,8},{0,0}}},
};
const TextMapping TEXT_CZ_QWERTY[] = {
  {0x0009, {{0,43},{0,0}}},
  {0x000A, {{0,40},{0,0}}},
  {0x0020, {{0,44},{0,0}}},
  {0x0021, {{2,52},{0,0}}},
  {0x0022, {{2,51},{0,0}}},
  {0x0023, {{64,32},{0,0}}},
  {0x0024, {{64,33},{0,0}}},
  {0x0025, {{2,45},{0,0}}},
  {0x0026, {{64,36},{0,0}}},
  {0x0027, {{2,49},{0,0}}},
  {0x0028, {{2,48},{0,0}}},
  {0x0029, {{0,48},{0,0}}},
  {0x002A, {{64,37},{0,0}}},
  {0x002B, {{0,30},{0,0}}},
  {0x002C, {{0,54},{0,0}}},
  {0x002D, {{0,56},{0,0}}},
  {0x002E, {{0,55},{0,0}}},
  {0x002F, {{2,47},{0,0}}},
  {0x0030, {{2,39},{0,0}}},
  {0x0031, {{2,30},{0,0}}},
  {0x0032, {{2,31},{0,0}}},
  {0x0033, {{2,32},{0,0}}},
  {0x0034, {{2,33},{0,0}}},
  {0x0035, {{2,34},{0,0}}},
  {0x0036, {{2,35},{0,0}}},
  {0x0037, {{2,36},{0,0}}},
  {0x0038, {{2,37},{0,0}}},
  {0x0039, {{2,38},{0,0}}},
  {0x003A, {{2,55},{0,0}}},
  {0x003B, {{0,53},{0,0}}},
  {0x003C, {{64,54},{0,0}}},
  {0x003D, {{0,45},{0,0}}},
  {0x003E, {{64,55},{0,0}}},
  {0x003F, {{2,54},{0,0}}},
  {0x0040, {{64,31},{0,0}}},
  {0x0041, {{2,4},{0,0}}},
  {0x0042, {{2,5},{0,0}}},
  {0x0043, {{2,6},{0,0}}},
  {0x0044, {{2,7},{0,0}}},
  {0x0045, {{2,8},{0,0}}},
  {0x0046, {{2,9},{0,0}}},
  {0x0047, {{2,10},{0,0}}},
  {0x0048, {{2,11},{0,0}}},
  {0x0049, {{2,12},{0,0}}},
  {0x004A, {{2,13},{0,0}}},
  {0x004B, {{2,14},{0,0}}},
  {0x004C, {{2,15},{0,0}}},
  {0x004D, {{2,16},{0,0}}},
  {0x004E, {{2,17},{0,0}}},
  {0x004F, {{2,18},{0,0}}},
  {0x0050, {{2,19},{0,0}}},
  {0x0051, {{2,20},{0,0}}},
  {0x0052, {{2,21},{0,0}}},
  {0x0053, {{2,22},{0,0}}},
  {0x0054, {{2,23},{0,0}}},
  {0x0055, {{2,24},{0,0}}},
  {0x0056, {{2,25},{0,0}}},
  {0x0057, {{2,26},{0,0}}},
  {0x0058, {{2,27},{0,0}}},
  {0x0059, {{2,28},{0,0}}},
  {0x005A, {{2,29},{0,0}}},
  {0x005B, {{64,47},{0,0}}},
  {0x005C, {{0,100},{0,0}}},
  {0x005D, {{64,48},{0,0}}},
  {0x005E, {{64,35},{0,0}}},
  {0x005F, {{2,56},{0,0}}},
  {0x0060, {{64,53},{0,0}}},
  {0x0061, {{0,4},{0,0}}},
  {0x0062, {{0,5},{0,0}}},
  {0x0063, {{0,6},{0,0}}},
  {0x0064, {{0,7},{0,0}}},
  {0x0065, {{0,8},{0,0}}},
  {0x0066, {{0,9},{0,0}}},
  {0x0067, {{0,10},{0,0}}},
  {0x0068, {{0,11},{0,0}}},
  {0x0069, {{0,12},{0,0}}},
  {0x006A, {{0,13},{0,0}}},
  {0x006B, {{0,14},{0,0}}},
  {0x006C, {{0,15},{0,0}}},
  {0x006D, {{0,16},{0,0}}},
  {0x006E, {{0,17},{0,0}}},
  {0x006F, {{0,18},{0,0}}},
  {0x0070, {{0,19},{0,0}}},
  {0x0071, {{0,20},{0,0}}},
  {0x0072, {{0,21},{0,0}}},
  {0x0073, {{0,22},{0,0}}},
  {0x0074, {{0,23},{0,0}}},
  {0x0075, {{0,24},{0,0}}},
  {0x0076, {{0,25},{0,0}}},
  {0x0077, {{0,26},{0,0}}},
  {0x0078, {{0,27},{0,0}}},
  {0x0079, {{0,28},{0,0}}},
  {0x007A, {{0,29},{0,0}}},
  {0x007B, {{66,47},{0,0}}},
  {0x007C, {{2,100},{0,0}}},
  {0x007D, {{66,48},{0,0}}},
  {0x007E, {{66,53},{0,0}}},
  {0x00C1, {{0,46},{2,4}}},
  {0x00C9, {{0,46},{2,8}}},
  {0x00CD, {{0,46},{2,12}}},
  {0x00D3, {{0,46},{2,18}}},
  {0x00DA, {{0,46},{2,24}}},
  {0x00DD, {{0,46},{2,28}}},
  {0x00E1, {{0,37},{0,0}}},
  {0x00E9, {{0,39},{0,0}}},
  {0x00ED, {{0,38},{0,0}}},
  {0x00F3, {{0,46},{0,18}}},
  {0x00FA, {{0,47},{0,0}}},
  {0x00FD, {{0,36},{0,0}}},
  {0x010C, {{2,46},{2,6}}},
  {0x010D, {{0,33},{0,0}}},
  {0x010E, {{2,46},{2,7}}},
  {0x010F, {{2,46},{0,7}}},
  {0x011A, {{2,46},{2,8}}},
  {0x011B, {{0,31},{0,0}}},
  {0x0147, {{2,46},{2,17}}},
  {0x0148, {{2,46},{0,17}}},
  {0x0158, {{2,46},{2,21}}},
  {0x0159, {{0,34},{0,0}}},
  {0x0160, {{2,46},{2,22}}},
  {0x0161, {{0,32},{0,0}}},
  {0x0164, {{2,46},{2,23}}},
  {0x0165, {{2,46},{0,23}}},
  {0x016E, {{2,53},{2,24}}},
  {0x016F, {{0,51},{0,0}}},
  {0x017D, {{2,46},{2,29}}},
  {0x017E, {{0,35},{0,0}}},
  {0x20AC, {{64,8},{0,0}}},
};

inline TextLayoutId textLayoutId(const char* name) {
  return !strcmp(name,"CZ") ? LAYOUT_CZ : !strcmp(name,"CZ_QWERTY") ? LAYOUT_CZ_QWERTY : LAYOUT_US;
}
inline bool validTextLayout(const char* name) {
  return !strcmp(name,"US") || !strcmp(name,"CZ") || !strcmp(name,"CZ_QWERTY");
}
inline const TextMapping* textMapping(uint32_t codepoint, TextLayoutId layout) {
  const TextMapping* table = layout == LAYOUT_CZ ? TEXT_CZ : layout == LAYOUT_CZ_QWERTY ? TEXT_CZ_QWERTY : TEXT_US;
  size_t length = layout == LAYOUT_US ? sizeof(TEXT_US)/sizeof(TEXT_US[0]) : sizeof(TEXT_CZ)/sizeof(TEXT_CZ[0]);
  size_t lo=0, hi=length;
  while (lo<hi) { size_t mid=lo+(hi-lo)/2; if (table[mid].codepoint<codepoint) lo=mid+1; else hi=mid; }
  return lo<length && table[lo].codepoint==codepoint ? table+lo : nullptr;
}
inline uint32_t decodeCodepoint(const char* text, size_t& offset) {
  const unsigned char* p=(const unsigned char*)text+offset;
  if (*p<0x80) { offset++; return *p; }
  int length=*p>=0xC2 && *p<=0xDF ? 2 : *p>=0xE0 && *p<=0xEF ? 3 : *p>=0xF0 && *p<=0xF4 ? 4 : 0;
  if (!length) return UINT32_MAX;
  uint32_t codepoint=*p & ((1 << (7-length))-1);
  for (int i=1; i<length; i++) { if (!p[i] || (p[i]&0xC0)!=0x80) return UINT32_MAX; codepoint=(codepoint<<6)|(p[i]&0x3F); }
  if ((length==3 && codepoint<0x800) || (length==4 && codepoint<0x10000) || codepoint>0x10FFFF || (codepoint>=0xD800 && codepoint<=0xDFFF)) return UINT32_MAX;
  offset+=length; return codepoint;
}
inline bool textSupported(const char* text, TextLayoutId layout) {
  size_t offset=0, units=0;
  while (text[offset]) { uint32_t cp=decodeCodepoint(text,offset); if (cp==UINT32_MAX || !textMapping(cp,layout)) return false; units+=cp>0xFFFF ? 2 : 1; }
  return units<=240;
}

// Configuration validation and HID codes
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
inline bool stringValid(JsonVariantConst value, size_t maxUnits, bool ascii) {
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
  if (!config.is<JsonObjectConst>() || !config["version"].is<int>() || (config["version"].as<int>() != 1 && config["version"].as<int>() != 2) ||
      !config["brightness"].is<int>() || config["brightness"].as<int>() < 0 || config["brightness"].as<int>() > 100 ||
      measureJson(config) > MAX_CONFIG_BYTES) return false;
  const char* layout = config["textLayout"] | "US";
  if (config["version"].as<int>() == 2 && (!config["textLayout"].is<const char*>() || !validTextLayout(layout))) return false;
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
      if (!strcmp(type,"text")) { if (!textSupported(value,textLayoutId(layout))) return false; }
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

// Flash storage
using namespace Adafruit_LittleFS_Namespace;

const char* const SLOT_PATHS[] = {"/toxiq-a.bin", "/toxiq-b.bin"};
struct StorageHeader { uint32_t magic; uint32_t revision; uint32_t length; uint32_t crc; };
constexpr uint32_t STORAGE_MAGIC = 0x31515854;
// Two independent slots: never remove the last good version before the next
// version has been closed, reopened and checked. CRC includes revision/length.
inline uint32_t storageCrc(const StorageHeader& header, const char* json) {
  return crc32(json, header.length) ^ crc32(&header.revision, sizeof(uint32_t) * 2);
}
inline bool readSlot(int slot, JsonDocument& output, uint32_t& revision) {
  File file(InternalFS);
  if (!file.open(SLOT_PATHS[slot],FILE_O_READ)) return false;
  StorageHeader header;
  bool good = file.read(&header,sizeof(header)) == sizeof(header) && header.magic == STORAGE_MAGIC &&
    header.length > 0 && header.length <= MAX_CONFIG_BYTES && file.size() == sizeof(header) + header.length;
  if (!good) { file.close(); return false; }
  char* data = (char*)malloc(header.length + 1);
  if (!data) { file.close(); return false; }
  good = file.read(data,header.length) == (int)header.length;
  file.close(); data[header.length] = 0;
  // const input makes ArduinoJson own its strings after data is freed.
  if (good) good = storageCrc(header,data) == header.crc && !deserializeJson(output,(const char*)data) && validConfig(output.as<JsonVariantConst>());
  free(data);
  if (good) revision = header.revision;
  return good;
}
inline bool writeSlot(int slot, JsonVariantConst config, uint32_t revision) {
  String data; if (serializeJson(config,data) == 0 || data.length() > MAX_CONFIG_BYTES) return false;
  StorageHeader header = { STORAGE_MAGIC, revision, (uint32_t)data.length(), 0 };
  header.crc = storageCrc(header,data.c_str());
  // Removing only the older/inactive slot also avoids FILE_O_WRITE append mode.
  if (InternalFS.exists(SLOT_PATHS[slot]) && !InternalFS.remove(SLOT_PATHS[slot])) return false;
  File file(InternalFS);
  if (!file.open(SLOT_PATHS[slot],FILE_O_WRITE)) return false;
  bool good = file.write((const uint8_t*)&header,sizeof(header)) == sizeof(header) && file.write(data.c_str(),data.length()) == data.length();
  file.flush(); file.close();
  DynamicJsonDocument check(20 * 1024); uint32_t storedRevision;
  if (!good || !readSlot(slot,check,storedRevision) || storedRevision != revision) return false;
  String stored; serializeJson(check,stored);
  return stored == data;
}

// Default profiles
// Matches the app defaults; checked by the firmware tests.
const char DEFAULT_CONFIG[] = R"json({"version":2,"textLayout":"US","activeProfile":"moba","brightness":40,"profiles":{"moba":{"name":"MOBA","keys":[{"label":"BARON","type":"text","value":"BARON NOW"},{"label":"DRAKE","type":"text","value":"DRAKE IN 30"},{"label":"PUSH","type":"text","value":"PUSH MID"},{"label":"BACK","type":"text","value":"RESET AND BACK"},{"label":"PING","type":"text","value":"ON MY WAY"},{"label":"GG","type":"text","value":"GG WP"}]},"fps":{"name":"FPS","keys":[{"label":"MIC","type":"hotkey","value":"CTRL+SHIFT+M"},{"label":"CLIP","type":"hotkey","value":"ALT+F10"},{"label":"MAP","type":"key","value":"M"},{"label":"TEAM","type":"text","value":"GROUP UP"},{"label":"MEDIA","type":"media","value":"PLAY_PAUSE"},{"label":"GG","type":"text","value":"GG"}]},"creator":{"name":"CREATOR","keys":[{"label":"CUT","type":"hotkey","value":"CTRL+K"},{"label":"UNDO","type":"hotkey","value":"CTRL+Z"},{"label":"MARK","type":"key","value":"M"},{"label":"PLAY","type":"key","value":"SPACE"},{"label":"MUTE","type":"media","value":"VOLUME_MUTE"},{"label":"SAVE","type":"hotkey","value":"CTRL+S"}]},"custom":{"name":"CUSTOM","keys":[{"label":"KEY 1","type":"key","value":"1"},{"label":"KEY 2","type":"key","value":"2"},{"label":"KEY 3","type":"key","value":"3"},{"label":"KEY 4","type":"key","value":"4"},{"label":"KEY 5","type":"key","value":"5"},{"label":"KEY 6","type":"key","value":"6"}]}}})json";

// USB, BLE and buttons
// Current V0: each normally-open switch connects D0/D1 to GND.
constexpr uint8_t BUTTON_PINS[] = {D0, D1};
constexpr size_t BUTTON_COUNT = sizeof(BUTTON_PINS) / sizeof(BUTTON_PINS[0]);
constexpr uint8_t REPORT_KEYBOARD = 1, REPORT_MEDIA = 2, REPORT_MOUSE = 3;
uint8_t const HID_DESCRIPTOR[] = {
  TUD_HID_REPORT_DESC_KEYBOARD(HID_REPORT_ID(REPORT_KEYBOARD)),
  TUD_HID_REPORT_DESC_CONSUMER(HID_REPORT_ID(REPORT_MEDIA)),
  TUD_HID_REPORT_DESC_MOUSE(HID_REPORT_ID(REPORT_MOUSE))
};
Adafruit_USBD_HID usbHid;
BLEDis bleDis;
BLEHidAdafruit bleHid;
DynamicJsonDocument configuration(20 * 1024);
uint32_t revision = 0;
int activeSlot = -1;
bool storageReady = false;
char serialNumber[17];
char serialFrame[16 * 1024 + 1];
size_t frameLength = 0;
bool frameOverflow = false;
uint32_t lastSerialByte = 0;

void sendError(uint32_t id, const char* error) {
  StaticJsonDocument<192> response;
  response["protocol"] = 1; response["id"] = id; response["ok"] = false; response["error"] = error;
  serializeJson(response,Serial); Serial.println();
}
void sendState(uint32_t id, bool includeConfig) {
  // Stream the large config directly; never allocate another response document.
  Serial.print("{\"protocol\":1,\"id\":"); Serial.print(id);
  Serial.print(",\"ok\":true,\"revision\":"); Serial.print(revision);
  if (includeConfig) { Serial.print(",\"config\":"); serializeJson(configuration,Serial); }
  Serial.println("}");
}
void processFrame(const char* data) {
  DynamicJsonDocument request(22 * 1024);
  if (deserializeJson(request,data,DeserializationOption::NestingLimit(12))) { sendError(0,"invalid_json"); return; }
  if (!request["id"].is<uint32_t>()) { sendError(0,"invalid_request"); return; }
  uint32_t id = request["id"];
  if (!request["protocol"].is<int>() || request["protocol"].as<int>() != 1) { sendError(id,"protocol"); return; }
  const char* op = request["op"] | "";
  if (!strcmp(op,"hello")) {
    StaticJsonDocument<768> response;
    response["protocol"] = 1; response["id"] = id; response["ok"] = true;
    JsonObject device = response.createNestedObject("device");
    device["product"] = "TOXIQ"; device["protocol"] = 1; device["configVersion"] = 2;
    device["firmware"] = "0.5.0"; device["model"] = "XIAO nRF52840 Plus V0"; device["serial"] = serialNumber;
    device["physicalKeys"] = BUTTON_COUNT; device["slots"] = 6; device["brightness"] = false;
    device["storage"] = storageReady; JsonArray layouts = device.createNestedArray("textLayouts"); layouts.add("US"); layouts.add("CZ"); layouts.add("CZ_QWERTY");
    serializeJson(response,Serial); Serial.println();
  } else if (!strcmp(op,"get")) sendState(id,true);
  else if (!strcmp(op,"set")) {
    if (!request["expectedRevision"].is<uint32_t>() || request["expectedRevision"].as<uint32_t>() != revision) { sendError(id,"conflict"); return; }
    JsonVariantConst incoming = request["config"].as<JsonVariantConst>();
    if (incoming["version"].as<int>() != 2 || !validConfig(incoming)) { sendError(id,"invalid_config"); return; }
    if (!storageReady || revision == UINT32_MAX) { sendError(id,"storage"); return; }
    String oldJson, newJson; serializeJson(configuration,oldJson); serializeJson(incoming,newJson);
    if (oldJson == newJson) { sendState(id,false); return; } // No needless flash wear.
    int targetSlot = activeSlot == 0 ? 1 : 0;
    if (!writeSlot(targetSlot,incoming,revision + 1)) { sendError(id,"storage"); return; }
    // Own the incoming strings before request is destroyed.
    configuration.set(incoming);
    activeSlot = targetSlot; revision++;
    sendState(id,false);
  } else sendError(id,"unknown_op");
}
void serviceSerial() {
  if (frameLength && (uint32_t)(millis() - lastSerialByte) > 2000) { frameLength = 0; frameOverflow = false; }
  while (Serial.available()) {
    char ch = (char)Serial.read(); lastSerialByte = millis();
    if (ch == '\n') {
      serialFrame[frameLength] = 0;
      if (frameOverflow) sendError(0,"too_large");
      else if (frameLength) processFrame((const char*)serialFrame);
      frameLength = 0; frameOverflow = false;
    } else if (!frameOverflow) {
      if (frameLength >= sizeof(serialFrame) - 1) frameOverflow = true;
      else serialFrame[frameLength++] = ch;
    }
  }
}

enum JobType { JOB_KEY, JOB_TEXT, JOB_MEDIA, JOB_MOUSE };
struct Job { JobType type; uint8_t modifier; uint16_t usage; TextLayoutId layout; char text[721]; };
Job queue[8], current;
uint8_t queueHead = 0, queueLength = 0;
bool running = false, releasePhase = false, jobUsb = false;
size_t textPosition = 0;
uint32_t nextReport = 0, reportWait = 0;
const TextMapping* currentMapping = nullptr;
uint8_t textStroke = 0;
bool prepareTextCharacter() {
  uint32_t cp=decodeCodepoint(current.text,textPosition);
  currentMapping=textMapping(cp,current.layout); textStroke=0;
  return currentMapping != nullptr;
}

bool sendJobReport(bool release) {
  if (jobUsb) { if (!TinyUSBDevice.mounted() || !usbHid.ready()) return false; }
  else if (!Bluefruit.connected()) return false;
  if (current.type == JOB_KEY || current.type == JOB_TEXT) {
    uint8_t modifier = current.modifier, usage = current.usage;
    if (current.type == JOB_TEXT && !release) {
      modifier = currentMapping->strokes[textStroke].modifier; usage = currentMapping->strokes[textStroke].usage;
    }
    uint8_t keys[6] = { (uint8_t)(release ? 0 : usage),0,0,0,0,0 };
    return jobUsb ? usbHid.keyboardReport(REPORT_KEYBOARD,release ? 0 : modifier,keys) : bleHid.keyboardReport(release ? 0 : modifier,keys);
  }
  if (current.type == JOB_MEDIA) return jobUsb ? usbHid.sendReport16(REPORT_MEDIA,release ? 0 : current.usage) : bleHid.consumerReport(release ? 0 : current.usage);
  uint8_t buttons = !release && current.usage <= 3 ? 1 << (current.usage - 1) : 0;
  int8_t wheel = !release && current.usage >= 4 ? (current.usage == 4 ? 1 : -1) : 0;
  return jobUsb ? usbHid.mouseReport(REPORT_MOUSE,buttons,0,0,wheel,0) : bleHid.mouseReport(buttons,0,0,wheel,0);
}
void enqueueButton(size_t index) {
  if (queueLength >= 8) return;
  JsonVariantConst key = configuration["profiles"][configuration["activeProfile"].as<const char*>()]["keys"][index];
  const char* type = key["type"]; const char* value = key["value"];
  Job& job = queue[(queueHead + queueLength) % 8];
  job.modifier = 0; job.usage = 0; job.text[0] = 0; job.layout = textLayoutId(configuration["textLayout"] | "US");
  if (!strcmp(type,"text")) { job.type = JOB_TEXT; strncpy(job.text,value,720); job.text[720] = 0; }
  else if (!strcmp(type,"key")) { job.type = JOB_KEY; job.usage = keyUsage(value); }
  else if (!strcmp(type,"hotkey")) { job.type = JOB_KEY; uint8_t usage; hotkeyUsage(value,job.modifier,usage); job.usage = usage; }
  else if (!strcmp(type,"media")) { job.type = JOB_MEDIA; job.usage = mediaUsage(value); }
  else { job.type = JOB_MOUSE; job.usage = mouseAction(value); }
  queueLength++;
}
void serviceJobs() {
  if (!running && queueLength) {
    current = queue[queueHead]; queueHead = (queueHead + 1) % 8; queueLength--;
    jobUsb = TinyUSBDevice.mounted();
    if (!jobUsb && !Bluefruit.connected()) return;
    running = true; releasePhase = false; textPosition = 0; nextReport = millis(); reportWait = millis();
    if (current.type == JOB_TEXT && !prepareTextCharacter()) { running = false; return; }
  }
  if (!running || (int32_t)(millis() - nextReport) < 0) return;
  if (!sendJobReport(releasePhase)) {
    if ((uint32_t)(millis() - reportWait) > 500) {
      // A lost transport cancels the macro. Release the BLE connection as well
      // so no modifier from a previous report can remain held after fallback.
      bleHid.keyRelease(); bleHid.consumerKeyRelease(); bleHid.mouseButtonRelease();
      if (usbHid.ready()) { usbHid.keyboardRelease(REPORT_KEYBOARD); }
      running = false; queueLength = 0;
    }
    return;
  }
  nextReport = millis() + 12; reportWait = millis();
  if (!releasePhase) releasePhase = true;
  else {
    releasePhase = false;
    if (current.type != JOB_TEXT) running = false;
    else if (textStroke == 0 && currentMapping->strokes[1].usage) textStroke = 1;
    else if (current.text[textPosition] == 0 || !prepareTextCharacter()) running = false;
  }
}
struct ButtonState { bool raw; bool stable; uint32_t changed; };
ButtonState buttons[BUTTON_COUNT];
void serviceButtons() {
  for (size_t i = 0; i < BUTTON_COUNT; i++) {
    bool pressed = digitalRead(BUTTON_PINS[i]) == LOW;
    if (pressed != buttons[i].raw) { buttons[i].raw = pressed; buttons[i].changed = millis(); }
    if (pressed != buttons[i].stable && (uint32_t)(millis() - buttons[i].changed) >= 25) {
      buttons[i].stable = pressed;
      if (Serial) {
        Serial.print("{\"protocol\":1,\"event\":\"button\",\"key\":"); Serial.print(i);
        Serial.print(",\"pressed\":"); Serial.print(pressed ? "true" : "false"); Serial.println("}");
      }
      if (pressed) enqueueButton(i);
    }
  }
}
void setup() {
  for (size_t i = 0; i < BUTTON_COUNT; i++) { pinMode(BUTTON_PINS[i],INPUT_PULLUP); bool pressed = digitalRead(BUTTON_PINS[i]) == LOW; buttons[i] = {pressed,pressed,0}; }
  snprintf(serialNumber,sizeof(serialNumber),"%08lX%08lX",(unsigned long)NRF_FICR->DEVICEID[0],(unsigned long)NRF_FICR->DEVICEID[1]);
  usbHid.setPollInterval(2);
  usbHid.setReportDescriptor(HID_DESCRIPTOR,sizeof(HID_DESCRIPTOR));
  usbHid.begin();
  Serial.begin(115200);
  if (TinyUSBDevice.mounted()) { TinyUSBDevice.detach(); delay(250); TinyUSBDevice.attach(); }
  Bluefruit.begin(); Bluefruit.setName("TOXIQ V0"); Bluefruit.setTxPower(4); Bluefruit.autoConnLed(false);
  bleDis.setManufacturer("TOXIQ"); bleDis.setModel("V0 Configurable"); bleDis.begin(); bleHid.begin();
  storageReady = InternalFS.begin();
  deserializeJson(configuration,DEFAULT_CONFIG);
  if (storageReady) {
    DynamicJsonDocument stored(20 * 1024); uint32_t candidateRevision;
    for (int slot = 0; slot < 2; slot++) {
      if (readSlot(slot,stored,candidateRevision) && (activeSlot < 0 || candidateRevision > revision)) {
        configuration.set(stored.as<JsonVariantConst>()); revision = candidateRevision; activeSlot = slot;
      }
    }
  }
  // Migrate older stored profiles in memory without erasing either flash slot.
  if (configuration["version"].as<int>() == 1) { configuration["version"] = 2; configuration["textLayout"] = "US"; }
  Bluefruit.Advertising.addFlags(BLE_GAP_ADV_FLAGS_LE_ONLY_GENERAL_DISC_MODE);
  Bluefruit.Advertising.addTxPower(); Bluefruit.Advertising.addAppearance(BLE_APPEARANCE_HID_KEYBOARD);
  Bluefruit.Advertising.addService(bleHid); Bluefruit.ScanResponse.addName();
  Bluefruit.Advertising.restartOnDisconnect(true); Bluefruit.Advertising.setInterval(32,244);
  Bluefruit.Advertising.setFastTimeout(30); Bluefruit.Advertising.start(0);
}
void loop() {
  #ifdef TINYUSB_NEED_POLLING_TASK
  TinyUSBDevice.task();
  #endif
  serviceSerial(); serviceButtons(); serviceJobs();
  delay(1);
}
