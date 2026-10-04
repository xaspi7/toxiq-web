#pragma once
#include <Adafruit_LittleFS.h>
#include <InternalFileSystem.h>
#include "Config.h"
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
