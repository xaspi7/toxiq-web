# TOXIQ — produktový web

První funkční koncept produktového webu TOXIQ podle schváleného Brand Manualu v0.2. Český obsah, anglické gamer headlines, editorial layout bez informačních kartiček, barevných pásů a generických šedých ploch.

## Spuštění

Potřebuješ Node.js 22.18 nebo novější. Produktová stránka zůstává bez závislostí; konfigurátor používá React, TypeScript a Vite.

```sh
npm ci
npm run build
npm run dev
```

Otevři `http://localhost:3000`. Web lze také otevřít přímo přes `index.html`; pro spolehlivé ukládání barevné preference doporučujeme lokální server.

Konfigurátor otevři na `http://localhost:3000/configurator/`. Při vývoji aplikace použij `npm run dev:app` a adresu vypsanou Vite (obvykle `http://localhost:5173`). Pro desktopový Electron shell spusť `npm run desktop`. První `npm ci` stáhne i Electron runtime; nejde zatím o Windows instalátor.

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
| `configurator/` | React/TypeScript konfigurátor a Electron shell |

## TOXIQ Configurator v0.2

Samostatná pracovní aplikace podle stejné identity. Produktové profily na landing page zůstávají read-only; editor je na vlastní stránce.

- Šest interaktivních kláves v 3×2, MOBA/FPS/CREATOR/CUSTOM a KEY/HOTKEY/TEXT/MEDIA/MOUSE.
- Záznam klávesových zkratek, editace názvů a textů, jas underglow.
- Lokální rozpracované nastavení přežije refresh. Při nedostupném úložišti aplikace doporučí export; poškozená původní data nepřepíše automaticky.
- Import/export kompletní konfigurace v JSON, kontrola verze, počtu kláves a platných akcí. Neplatný import ponechá aktuální nastavení beze změny.
- Převzetí nastavení uloženého předchozím v0.1 prototypem na stejném originu.
- Black/Lime a White/Violet se stejnými SVG logy, signature Q a lokálním Interem jako web.
- Oddělené rozhraní `ToxiqDevice` a `MockDevice`. Demo připojení a ukládání jsou označeny jako demo; nic se neposílá do skutečného XIAO.
- Electron shell používá sandbox a izolovaný renderer bez Node integration.

V0 prototyp má dvě fyzická tlačítka; aplikace připravuje všech šest budoucích přiřazení. USB/BLE testovací firmware zatím nemá konfigurační protokol. Reálný přenos, flash storage, BLE konfigurace a instalátor nejsou součástí v0.2.

## Limity konceptu

Původní brand manuál a interní dokument s konceptem nejsou součástí veřejného repozitáře. Jejich případné zveřejnění vyžaduje samostatný souhlas vlastníka.

Žádné objednávky, platby ani komunikace s hardwarem. Nákresy jsou stylizovaný vizuální směr, nikoli výrobní CAD nebo fotografie hotového produktu. Wired a Wireless jsou plánované směry, finální parametry a cena nejsou potvrzené.

## Další vývoj

1. Posoudit webový koncept a upravit copy, kompozici a pořadí sekcí.
2. Nahradit produktové nákresy fotografiemi nebo rendery skutečného prototypu.
3. Doplnit konfigurační protokol ve firmwaru a skutečný USB adapter pro konfigurátor.
4. Cenu, nákup a hosting doplnit po potvrzení obchodní nabídky.

Zdrojový kód a grafická identita jsou pracovní materiál TOXIQ. Zveřejnění repozitáře samo o sobě neuděluje licenci k dalšímu užití. Font Inter od Rasmuse Anderssona používá SIL Open Font License 1.1; původní licence je součástí repozitáře.
