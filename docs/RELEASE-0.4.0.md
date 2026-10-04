TOXIQ Configurator 0.4.0 je první desktopový vývojový build se skutečným USB protokolem pro XIAO nRF52840 Plus V0.

- **TOXIQ-Configurator-0.4.0-Setup.exe** — Windows x64, instalace pro aktuálního uživatele, bez účtu a cloudu. Instalátor zatím není podepsaný certifikátem.
- **TOXIQ-V0-0.4.0-Firmware.zip** — odpovídající UF2, Arduino sketch a postup nahrání/ověření. Dvě tlačítka: D0/GND a D1/GND. Pro Seeed nRF52 Boards 1.1.13, XIAO Plus, SoftDevice S140 7.3.0.
- **SHA256SUMS.txt** — kontrolní součty těchto balíčků.

Aplikace ověří firmware, načte profily a po uložení nezávisle přečte konfiguraci. Firmware uchovává dvě verze s revizí a CRC. Makra fungují bez otevřené aplikace, USB má přednost před BLE. Aktivní profil se změní v zařízení po explicitním uložení.

V0 má dvě fyzická tlačítka a žádné podsvícení. Další čtyři uložené pozice a jas jsou připravené pro budoucí hardware. Text podporuje ASCII bez diakritiky a předpokládá rozložení US na hostiteli; aplikace nepřidává Enter sama. Webový konfigurátor je stále označené demo bez USB.

Ověřeno automaticky: syntax/types/build, testy USB protokolu a chybových stavů, C++ validace/mapping/CRC, kompilace firmwaru pro Plus, kontrola aplikačních adres UF2 a spuštění zabalené aplikace na Windows včetně rendereru, preloadu a sériového ovladače. Fyzické chování USB/BLE a přežití odpojení napájení je potřeba ověřit na Adamově prototypu podle [návodu](https://github.com/xaspi7/toxiq-web/blob/v0.4.0/firmware/README.md).
