# Ověření / 2026-10-03

## Konfigurátor v0.4 / USB a firmware

- `npm run check`, `npm test` (13 testů) a `npm run build` prošly. USB testy ověřují handshake, čtení po zápisu, odmítnutí chybného readbacku, revizní konflikt, výpadek úložiště, odpojení a timeout, rozdělené UTF-8 rámce, tlačítkové události a limit velikosti. V testech firmware simuluje transport; nejsou to výsledky fyzického XIAO.
- Skutečný nativní SerialPort binding na Linuxu prošel přes PTY handshake/zápisem/nezávislým readbackem vůči simulovanému firmwaru. Ověřuje transport; nedokazuje fyzické USB/BLE chování.
- Firmware se zkompiloval pro `Seeeduino:nrf52:xiaonRF52840Plus` / core 1.1.13 s ArduinoJson 6.21.5, TinyUSB 1.7.0 a Bluefruit 0.21.0. Program 171620 B / 811008 B, globals 32796 B / 237568 B; další JSON dokumenty/flash používají runtime heap. C++ test ověřil validaci akcí, F13–F24/hotkey mapování a CRC32. UF2 kontrola potvrdila rodinu 0xADA52840, pouze aplikační adresy 0x27000–0xED000 a validní bloky.
- GitHub Actions run [37135098196](https://github.com/xaspi7/toxiq-web/actions/runs/37135098196), commit `11cf39b`: web/testy, firmware a Windows job success. Windows job sestavil instalátor a spustil `win-unpacked/TOXIQ Configurator.exe --smoke-test`; ověřil šest kláves, USB režim rendereru, úzký preload/IPC bridge a nativní enumeraci portů. Certifikát pro podepisování zatím není nastavený.
- Původní Chromium QA editoru v obou paletách prošla: všech pět akcí, capture, lokální ukládání, import/export, demo snapshot, šipky/Home/End, narrow layouts a 200% text. Výsledky nativního Windows spuštění a simulace protokolu jsou oddělené od fyzického testu.
- Chromium QA USB režimu se simulovaným preload bridge ověřila zachování draftu při připojení, explicitní načtení se zálohou, editaci během načítání, zápis, tlačítkové události, odpojení, dvě fyzické pozice/čtyři budoucí a zakázané podsvícení. Sekce Downloady má správný kontrast obou palet a šířky 320/390/940 px bez overflow.
- Potřebný fyzický test je v `firmware/README.md`: nahrát na Adamovo XIAO Plus, D0 text a D1 hotkey, flash po power cycle, KEY/MEDIA/MOUSE, opětovné párování BLE. XIAO připojené k Adamovu počítači není dostupné v tomto prostředí.

Starší záznamy níže popisují tehdejší demo verze.

## Konfigurátor v0.3 / desktopová kompozice / 2026-10-01

- Nová app kompozice bez webových slogans nebo odkazů: profilový sidebar, grafický 3×2 pad a samostatný inspector. Funkční ikony, rámečky polí, plné aktivní stavy a přepínač demo zařízení. Zachovaná Black/Lime a White/Violet identita bez nových neutrálních výplní.
- Chromium QA prošla při 1240 × 780 px. Kompletní základní textový editor se vejde do inspectoru bez vnitřního scrollování; tlačítko uložení je stále viditelné. Pět šířek 320–1440 px a 200% text na úzké obrazovce nemají horizontální overflow.
- Ověřeny šipky v 3×2 mřížce a Home, shoda výběru s inspectorem, zachování textu při přepnutí typu akce a zrušení záznamu zkratky. Původní testy editace, ukládání, import/export, neplatného importu a obnovy draftu nadále prošly. Aplikace ani CSP nehlásí chyby konzole.
- Vizuálně zkontrolovány oba desktopové vzhledy. Přepnutí palety mění výplně ihned; krátký pohyb klávesy, změna profilu a recording odezva respektují reduced motion.
- HTML v0.3 náhled funguje samostatně přes `file://` se všemi assets. Electron minimum je 940 × 640; shell není v tomto prostředí nativně spuštěný. Reálný USB adapter stále čeká na firmware protokol.

Následující záznamy popisují předchozí v0.2 a produktovou verzi.

## Konfigurátor v0.2 / 2026-10-01 / větev `work/configurator`

- `npm run check`, `npm test` (6 testů) a `npm run build` prošly. Konfigurátor se sestavuje do `dist/configurator/`; produktová stránka zůstává samostatná a její příklady read-only.
- Automatizovaná kontrola skutečného Chromium rendereru: editace názvu i hodnoty, všech pět typů akcí, záznam CTRL+SHIFT+M, přepnutí profilu bez ztráty změn, zachování draftu po reloadu.
- Ověřen demo connect/disconnect, uložení snapshotu, zákaz uložení neplatné konfigurace, export souboru a zpětný import. Neplatný JSON/profil nepřepíše aktuální nastavení. Test odpojení a opětovného připojení během zápisu nedovolí falešně úspěšné uložení.
- Black/Lime i White/Violet, stejné SVG logo a signature Q jako web, načtený lokální Inter. Bez chyb aplikace nebo CSP v konzoli.
- Šířky 1440, 1024, 768, 390 a 320 px bez horizontálního overflow; stav demo zařízení zůstává viditelný. Při 200% textu na 390 px se profily zalomí a nic nepřetéká.
- Vizuálně zkontrolován desktopový Black/Lime a mobilní White/Violet náhled. Produktové colorway/profile přepínače a odkaz na aplikaci fungují.
- Samostatný HTML náhled byl otevřen přes `file://`, vykreslí všech šest kláves, logo i font bez externích assets.
- Electron shell má syntaktickou kontrolu a používá renderer sandbox/context isolation. Nativní okno Electronu ani Windows instalátor v tomto prostředí nebyly ověřeny; desktopový runtime není v testovacím prostředí stažený.
- USB/BLE hardware komunikace zůstává neimplementovaná. Firmware V0 posílá testovací texty a zatím neposkytuje konfigurační protokol.

Změny této větve nejsou nasazené do veřejného webu. Níže uvedené záznamy se týkají předchozí produktové verze na `main`.

## Sestavení a soubory

- `npm run check` a `npm run build` prošly.
- HTML nemá duplicitní ID; navigační anchors i odkazy na lokální assets mají existující cíl.
- SVG se parsují jako XML a všechny jejich odkazy na definice mají cíl. Produktové SVG mají průhledné okolí a neobsahují exportní rámeček ani texty z manuálu.
- Inter Variable je lokální WOFF2 s přiloženou licencí OFL. Build přidává hash obsahu do URL obrázků, fontu, CSS a JS.
- Originál Brand Manualu, interní koncepty a pracovní screenshoty nejsou součástí veřejného repozitáře.

## Živý web v prohlížeči

Ověřeno na GitHub Pages při desktopovém viewportu přibližně 1363 × 936:

- Obě barevné varianty: všech pět viditelných obrázků odpovídá zvolené paletě a všechny párové obrázky se načetly.
- Rychlé přepnutí White → Black → White zachová poslední volbu. Přepnutí čeká na načtení a dekódování cílových obrázků; nedochází k asynchronní výměně `src` na novém pozadí.
- MOBA, FPS a Creator zobrazují šest akcí; popisky schématu a seznam příkladů se shodují. Aktivace profilu klávesou Enter funguje.
- Produktová navigace vede do správné sekce. Profily jsou jen produktové příklady, bez editoru a simulace psaní.
- Inter je v prohlížeči načtený. Desktop nemá horizontální overflow. Zachycené chyby konzole pocházely z browser extension, nikoli z aplikace.

## Meze ověření

CSS pro úzké obrazovky je zkontrolované: hlavní sekce přecházejí do jednoho sloupce, nadpisy a přepínače se zmenšují, obrázek detailu má ořez a při šířce do 380 px se ovládání barvy řadí pod popisek produktu. Vizuální kontrola skutečného mobilního viewportu a 200% zoomu ještě není dokončená; dostupný browser runtime neposkytuje nastavení velikosti viewportu.

E-mailový kontakt čeká na konkrétní veřejnou adresu. Závěrečná výzva mezitím odkazuje na existující GitHub projektu; web neobsahuje nefunkční formulář.

## Publikace

Hlavní větev `main` spouští kontrolu webu a automatické nasazení na GitHub Pages. Aktuální produktové úpravy byly na živém webu ověřeny; stav konkrétního nasazení je dostupný v GitHub Actions.
