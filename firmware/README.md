# TOXIQ V0 firmware 0.4.0

Pro **Seeed XIAO nRF52840 Plus**, Seeed nRF52 Boards **1.1.13** (Adafruit core, nikoli mbed). Současný prototyp: tlačítko 1 mezi **D0 a GND**, tlačítko 2 mezi **D1 a GND**, obě `INPUT_PULLUP`. Další piny se nepoužívají.

USB konfigurace přes CDC při 115200 baud; USB/BLE HID výstup KEY, HOTKEY, TEXT, MEDIA a MOUSE. USB má přednost při připojení k hostiteli. BLE slouží jako klávesnice/myš pro spárovaný hostitel, konfigurace probíhá pouze přes USB. Nový HID descriptor může vyžadovat odstranění starého párování „TOXIQ V0“ a nové spárování.

## Nahrání hotového firmwaru

1. Exportuj si případné profily z aplikace.
2. Připoj XIAO Plus datovým USB kabelem. Dvakrát krátce stiskni RESET; objeví se jednotka `NRF52BOOT`.
3. Zkopíruj **TOXIQ-V0-0.4.0.uf2** na tuto jednotku. Deska se restartuje a objeví se jako klávesnice, myš a COM port.
4. Zavři Arduino Serial Monitor, spusť **TOXIQ Configurator 0.4**, klikni **Připojit USB zařízení**. První připojení zachová lokální draft; tlačítkem **Načíst ze zařízení** převezmeš jeho nastavení.
5. Nastav první dvě klávesy, vyber profil a klikni **Uložit do zařízení**. Úspěch se ukáže až po ověřeném čtení nastavení z flash.

UF2 je pouze aplikace pro Plus s již nahraným Seeed bootloaderem a SoftDevice S140 **7.3.0**, který používá uvedený core. Nemění bootloader ani SoftDevice. Pro jiný board/core použij zdrojový sketch a příslušný upload v Arduino IDE.

## Nahrání přes Arduino IDE

- Board Manager URL: `https://files.seeedstudio.com/arduino/package_seeeduino_boards_index.json`.
- Instaluj **Seeed nRF52 Boards 1.1.13**, vyber **Seeed XIAO nRF52840 Plus** a správný Port.
- Library Manager: **ArduinoJson 6.21.5**. TinyUSB, Bluefruit, LittleFS a InternalFileSystem jsou součástí core; neinstaluj jiné verze navíc.
- Otevři **`TOXIQ_V0/TOXIQ_V0.ino`** z nového balíčku. Stačí tento jediný soubor; žádné další lokální `.h` ani `.cpp` nepotřebuješ. Pokud Arduino IDE nabídne vytvoření stejnojmenné složky, potvrď ji. Klikni Upload.
- Starší release ZIP v0.4.0 má ještě rozdělené zdroje. Z aktuální větve si jediný `.ino` vytvoříš příkazem `python firmware/scripts/single_sketch.py`; výsledný soubor je `firmware/build/TOXIQ_V0/TOXIQ_V0.ino`.

## První ověření na prototypu

1. Vyber CUSTOM. Klávesa 1: TEXT `TOXIQ ONE`; klávesa 2: HOTKEY `CTRL+A`. Ulož.
2. Ve Windows přepni rozložení na **US** a otevři Poznámkový blok. D0 vypíše text, D1 ho označí. Text makra nepřidávají Enter automaticky; vlož nový řádek jen pokud ho chceš skutečně odeslat.
3. Zavři aplikaci, odpoj a znovu připoj USB. Tlačítka musí stále vykonávat stejné akce. V aplikaci po připojení klikni Načíst ze zařízení a ověř profil i hodnoty.
4. Zkus KEY `F13`, MEDIA `VOLUME_MUTE` a MOUSE `SCROLL_DOWN` v odpovídající aplikaci. U her záleží na jejich podpoře HID vstupu.
5. Vyzkoušej BLE na mobilu/hostiteli s Bluetooth; při USB odpojeném od PC se makra směrují do BLE. Po změně HID služeb se případně znovu spáruj.

## Rozsah této verze

- Dvě fyzická tlačítka, čtyři profily, šest uložených pozic na profil. V0 používá jen pozice 1 a 2. Vybraný profil se aktivuje v zařízení při explicitním uložení.
- Text: tisknutelné ASCII, tabulátor a nový řádek, max. 240 znaků; bez diakritiky. HID text předpokládá rozložení **US** u hostitele. KEY/HOTKEY používají fyzické HID kódy.
- Jas se uchovává jako nastavení pro budoucí hardware. V0 nemá zapojené podsvícení; aplikace ho při připojení vypne a ovladač jasu zakáže.
- Interní flash: dvě nezávislé verze s revizí a CRC, ověření po uzavření souboru. Při přerušeném zápisu se při startu použije nejnovější platná verze. Změny v editoru neopotřebovávají flash; zapisuje až tlačítko Uložit.
- Žádný cloud, účet, automatický updater ani konfigurace přes BLE.

Kompilace a automatické testy nejsou náhradou tohoto fyzického ověření. Firmware je vývojový build pro prototyp V0.

## Reprodukovatelný build

```sh
arduino-cli core update-index --additional-urls https://files.seeedstudio.com/arduino/package_seeeduino_boards_index.json
arduino-cli core install Seeeduino:nrf52@1.1.13 --additional-urls https://files.seeedstudio.com/arduino/package_seeeduino_boards_index.json
arduino-cli lib install ArduinoJson@6.21.5
python -m pip install adafruit-nrfutil==0.5.3.post16 'setuptools<81'
python firmware/scripts/single_sketch.py
arduino-cli compile --fqbn Seeeduino:nrf52:xiaonRF52840Plus --output-dir firmware/build firmware/build/TOXIQ_V0
python firmware/scripts/package.py --core <cesta-ke-core-1.1.13>
```

CI sestavuje přímo exportovaný jediný `.ino` pro Plus, ověřuje host C++ testy konfigurace, HID kódů a CRC a kontroluje adresy UF2, aby nezahrnovalo bootloader ani uložené profily. Zdrojové moduly v repozitáři zůstávají kvůli údržbě a testům; generátor je sloučí beze změny funkcí do souboru pro Arduino IDE.
