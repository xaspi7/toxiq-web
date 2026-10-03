# TOXIQ USB protocol 1

Transport: the board's USB CDC port, 115200 baud, DTR on, RTS off. The OS also sees HID keyboard/consumer/mouse independently. Keep the board's assigned Seeed VID/PID: Plus application `2886:8064` (bootloader `2886:0064` is excluded). Firmware accepts no host commands over BLE.

UTF-8 NDJSON, one JSON frame per LF, maximum **16384 bytes excluding LF**. Config maximum **10240 bytes** when serialized. No unsolicited debug text. Arduino Serial Monitor must release the COM port before the app opens it. Incomplete input is discarded after 2 seconds; oversized input is discarded through the next LF.

Every request has `protocol: 1`, a positive integer `id`, and `op`. Every response repeats the protocol and ID, plus `ok`. A host must not treat an OS port opening as a connected TOXIQ: it must complete `hello` and `get`, validate the protocol/schema/capabilities and configuration. One outstanding request per connection. A timeout closes the connection, since the write may have committed even if its acknowledgement was lost.

| Operation | Request fields | Successful response |
| --- | --- | --- |
| `hello` | none | `device`: product `TOXIQ`, protocol 1, configVersion 1, firmware, model, serial, physicalKeys 2, slots 6, brightness false, storage true/false, textLayout `US` |
| `get` | none | `config`, `revision` |
| `set` | `config`, `expectedRevision` | `revision`, only after persistent write and flash readback |

Example:

```json
{"protocol":1,"id":42,"op":"get"}
```

The config is the app's version-1 JSON: `version`, `activeProfile`, `brightness`, and `profiles` containing `moba`, `fps`, `creator`, `custom`, each with `name` and exactly six `keys`. Each key has `label`, `type`, `value`. Types: `key`, `hotkey`, `text`, `media`, `mouse`. Profile names use the app's fixed names. Labels max. 12 UTF-16 units, text max. 240 ASCII characters (plus LF/TAB). Supported key/media/mouse values are defined in `configurator/src/config.ts` and `firmware/toxiq_v0/Config.h`. Hotkeys contain unique CTRL/SHIFT/ALT/META modifiers and exactly one key. Brightness is integer 0–100 and stored even when the capability is absent; absent capability must disable the physical preview/control.

`set` rejects invalid configuration before changing the device. `expectedRevision` implements optimistic concurrency. Repeating identical serialized settings does not write flash or increment revision. Persistence alternates two CRC-protected files and leaves the previous slot intact until the new slot is committed; boot selects the highest valid revision. Revision is an unsigned 32-bit integer; exhaustion fails safely. The app independently issues `get` after `set` and compares configuration and revision before reporting success.

Error response: `ok: false`, `error` in `protocol`, `invalid_request`, `invalid_json`, `unknown_op`, `invalid_config`, `conflict`, `storage`, `too_large`. An unreadable/oversized request without a trustworthy ID replies with ID 0; the host times out and disconnects. A storage error may leave a newer persistent slot after an interrupted acknowledgement: reconnect/read before retrying, and never discard the local draft.

Button event, emitted on debounced changes while the CDC port is open:

```json
{"protocol":1,"event":"button","key":0,"pressed":true}
```

Key indices are zero-based physical positions. Events have no request ID and must not complete pending requests. The UI animates these separately from the selected editor key. The firmware queues up to eight actions, executes press/release reports without blocking the serial loop, and never sends a macro merely because the editor selects a key. Changes to active profile and bindings reach hardware only on `set`; the saved config works after the app closes or the board restarts.
