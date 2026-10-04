# TOXIQ — produktový web

První funkční koncept produktového webu TOXIQ podle schváleného Brand Manualu v0.2. Angličtina jako výchozí jazyk s přepnutím EN/CZ, anglické gamer headlines, editorial layout bez informačních kartiček, barevných pásů a generických šedých ploch.

## Spuštění

Potřebuješ Node.js 22.18 nebo novější. Produktová stránka zůstává bez závislostí; konfigurátor používá React, TypeScript a Vite.

```sh
npm ci
npm run build
npm run dev
```

Otevři `http://localhost:3000`. Web lze také otevřít přímo přes `index.html`; pro spolehlivé ukládání barevné preference doporučujeme lokální server.

Konfigurátor otevři na `http://localhost:3000/configurator/`. Při vývoji aplikace použij `npm run dev:app` a adresu vypsanou Vite (obvykle `http://localhost:5173`). Pro desktopový Electron shell spusť `npm run desktop`. První `npm ci` stáhne i Electron runtime. `npm run package:win` na Windows sestaví x64 instalátor do `configurator/release/`.

Po buildu vytvoří `npm run preview:file` samostatný offline náhled `qa/TOXIQ_Configurator_preview.html` se všemi SVG, fontem a skripty vloženými do jednoho souboru.

```sh
npm run check
npm test
npm run build
npm run preview
```

`dist/` obsahuje kompletní statický web připravený pro hosting. GitHub Pages publikuje hlavní větev `main`; CI navíc ověří syntax a připraví artifact. Build verzováním CSS, JS, obrázků a fontu zajistí obnovu cache po změnách.

## Co funguje

- Responzivní landing page s přepínáním Black/Lime a White/Violet.
- Wordmark, signature Q a produktové nákresy převzaté přímo ze schváleného manuálu.
- Přepínatelné MOBA, FPS a Creator profily se šesti příklady akcí; read-only produktová ukázka.
- Zobrazené názvy kláves, textová makra a klávesové zkratky bez editoru nebo simulace stisku.
- Volitelně uložená barevná preference, fallback při nedostupném úložišti.
- Obě varianty obrázků zůstávají načtené v DOM. Přepnutí palety čeká na dekódování cílových obrázků a respektuje poslední volbu při rychlém přepínání.
- Jedna sekce použití se schématem šesti kláves, nové příklady hraní a střihu, stručný postup používání.
- Lokálně hostovaný variabilní font Inter s podporou češtiny; licence v `assets/fonts/OFL.txt`.
- Ovládání klávesnicí, focus states, přístupné přepínače, reduced-motion a lokální assets bez trackerů.

## Struktura

| Soubor | Účel |
| --- | --- |
| `index.html` | Obsah a přístupná struktura webu |
| `styles.css` | Brand tokens, editorial layout a responsive pravidla |
| `app.js` | Barevné varianty a produktové příklady profilů |
| `assets/` | SVG logo, transparentní produktové nákresy a Inter |
| `docs/` | Poznámky k ověření |
| `scripts/` | Lokální server a statický build |
| `AGENTS.md` | Závazná pravidla pro další úpravy |
| `configurator/` | React/TypeScript konfigurátor, Electron shell a USB CDC adapter |
| `firmware/` | Arduino firmware, USB protokol a postup ověření V0 |

## TOXIQ Configurator v0.5

Windows desktopová aplikace se skutečným USB CDC spojením a odpovídajícím firmwarem pro XIAO nRF52840 Plus V0. Zachovaná desktopová kompozice: profily vlevo, 3×2 klávesy uprostřed, inspector a ukládání vpravo. Web na `/configurator/` nabízí jasně označené demo; USB je dostupné v desktopové aplikaci.

- KEY/HOTKEY/TEXT/MEDIA/MOUSE, čtyři profily, šest uložených pozic na profil. D0 a D1 současného V0 používají pozice 1 a 2.
- Připojení vyžaduje protokolový handshake a validní čtení nastavení. Kliknutí „Načíst ze zařízení“ převezme jeho profily a zálohuje předchozí lokální draft. Samotné připojení ho nenahradí.
- „Uložit do zařízení“ zapisuje celý snapshot včetně aktivního profilu. Úspěch vyžaduje potvrzený zápis flash a nezávislé čtení se shodnou revizí i hodnotami. Odpojení, timeout a konflikt zachovají draft; timeout ukončí relaci, protože zápis mohl proběhnout bez doručeného potvrzení.
- Firmware používá dvě CRC chráněné verze v interní flash; poslední platné nastavení přežije restart a funguje bez otevřené aplikace. Stisk tlačítka přes USB se zobrazí na odpovídající klávese.
- USB HID má přednost před BLE HID. Konfigurace probíhá jen přes USB; na jednom COM portu nesmí současně běžet Arduino Serial Monitor.
- V0 nemá podsvícení, takže po připojení je ovladač jasu zakázaný a náhled nesvítí. Další čtyři klávesy mají přerušovaný rámeček jako budoucí pozice.
- Textová makra: ASCII bez diakritiky, LF/TAB, max. 240 znaků, rozložení US u hostitele. Enter se nepřidává automaticky. KEY/HOTKEY používají fyzické HID kódy.
- Lokální ukládání, import/export a zachování neplatného rozpracovaného draftu z v0.3 fungují dál. Black/Lime a White/Violet, lokální Inter, funkční ikony, focus states, reduced motion a ovládání klávesnicí.
- Izolovaný a sandboxovaný renderer má pouze úzký preload bridge. SerialPort žije v main procesu; IPC ověřuje hlavní frame a jeho místní URL. Aplikace nepotřebuje účet, cloud ani automatický updater.

### Downloady a první spuštění

[Build 0.5.0](https://github.com/xaspi7/toxiq-web/releases/tag/v0.5.0) obsahuje Windows instalátor, firmware ZIP s UF2 a jediným `.ino`, samostatný `.ino` a kontrolní součty. Instalátor zatím není podepsaný. Sekce Downloady v produktové stránce odkazuje na tyto skutečné soubory; web se zveřejňuje z `main` po ověření a vydání souborů.

Nejdřív nahraj odpovídající firmware; starý USB/BLE testovací sketch nemá tento protokol. [Postup nahrání a fyzického ověření](firmware/README.md) popisuje board/core, D0/D1, kopírování UF2 a test maker i restartu. Fyzický test na Adamově V0 nelze nahradit CI a je stále potřeba dokončit na zařízení.

CI sestavuje web, Windows instalátor a firmware pro Plus. Na Windows spustí zabalenou aplikaci a ověří renderer, preload a sériový ovladač. Public prerelease vznikne jen z explicitního `release:` commitu a až po úspěchu všech tří buildů; běžná změna ani PR nic nevydá. GitHub Pages nadále používá `main`.

## Limity konceptu

Původní brand manuál a interní dokument s konceptem nejsou součástí veřejného repozitáře. Jejich případné zveřejnění vyžaduje samostatný souhlas vlastníka.

Produktová stránka nemá objednávky ani platby. Desktopový konfigurátor komunikuje s V0 přes USB; výrobní parametry produktu zůstávají koncept. Nákresy jsou stylizovaný vizuální směr, nikoli výrobní CAD nebo fotografie hotového produktu. Wired a Wireless jsou plánované směry, finální parametry a cena nejsou potvrzené.

## Další vývoj

1. Posoudit webový koncept a upravit copy, kompozici a pořadí sekcí.
2. Nahradit produktové nákresy fotografiemi nebo rendery skutečného prototypu.
3. Ověřit USB/BLE makra a flash persistence na fyzickém V0, pak rozšířit firmware podle finálního zapojení.
4. Cenu, nákup a hosting doplnit po potvrzení obchodní nabídky.

Zdrojový kód a grafická identita jsou pracovní materiál TOXIQ. Zveřejnění repozitáře samo o sobě neuděluje licenci k dalšímu užití. Font Inter od Rasmuse Anderssona používá SIL Open Font License 1.1; původní licence je součástí repozitáře.

## Configurator 0.5

Integrated Windows title bar with native window controls. A compact pad editor, profile tabs, a single action selector and an overflow menu for import/export and device reads. EN/CZ and appearance preferences persist independently of profiles. Windows Czech QWERTZ/QWERTY text is encoded in firmware, including accents, Y/Z, numbers and punctuation; mappings were derived and verified using native Windows APIs. Config schema 2 stores the selected typing layout and migrates version 1 imports and flash profiles safely. A connected device needs firmware 0.5.
