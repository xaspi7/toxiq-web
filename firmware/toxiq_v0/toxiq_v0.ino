#include <Adafruit_TinyUSB.h>
#include <bluefruit.h>
#include "Config.h"
#include "Storage.h"
#include "Defaults.h"

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
