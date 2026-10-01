# Ověření / 2026-09-30

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
