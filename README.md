# TOXIQ — web concept v0.1

První funkční koncept produktového webu TOXIQ podle schváleného Brand Manualu v0.2. Český obsah, anglické gamer headlines, editorial layout bez informačních kartiček, barevných pásů a generických šedých ploch.

## Spuštění

Potřebuješ Node.js 22 nebo novější. Projekt nemá žádné externí závislosti.

```sh
npm run dev
```

Otevři `http://localhost:3000`. Web lze také otevřít přímo přes `index.html`; pro spolehlivé ukládání nastavení doporučujeme lokální server.

```sh
npm run check
npm run build
npm run preview
```

`dist/` obsahuje kompletní statický web připravený pro hosting, včetně GitHub Pages. CI build pouze ověří a připraví artifact; web automaticky veřejně nepublikuje.

## Co funguje

- Responzivní landing page s přepínáním Black/Lime a White/Violet.
- Wordmark, signature Q a produktové nákresy převzaté přímo ze schváleného manuálu.
- Šest editovatelných kláves, textová makra a zkratky; demo simuluje stisk na stránce.
- Samostatné MOBA, FPS a Creator profily, ukládání do `localStorage`, reset aktuálního profilu a export JSON.
- Validace uložených dat, bezpečné vykreslení uživatelského textu, fallback při nedostupném úložišti.
- Ovládání klávesnicí, focus states, live feedback, reduced-motion a lokální assets bez trackerů.

## Struktura

| Soubor | Účel |
| --- | --- |
| `index.html` | Obsah a přístupná struktura webu |
| `styles.css` | Brand tokens, editorial layout a responsive pravidla |
| `app.js` | Barevné varianty, profily a demo maker |
| `assets/` | Schválené SVG logo a produktové nákresy |
| `docs/` | Poznámky k ověření |
| `scripts/` | Lokální server a statický build |
| `AGENTS.md` | Závazná pravidla pro další úpravy |

## Limity konceptu

Původní brand manuál a interní dokument s konceptem nejsou součástí veřejného repozitáře. Jejich případné zveřejnění vyžaduje samostatný souhlas vlastníka.

Žádné objednávky, platby ani komunikace s hardwarem. Nákresy jsou stylizovaný vizuální směr, nikoli výrobní CAD nebo fotografie hotového produktu. Wired a Wireless jsou plánované směry, finální parametry a cena nejsou potvrzené. Exportované JSON je formát tohoto demo webu, nikoli garantovaný formát budoucího firmware.

## Další vývoj

1. Posoudit webový koncept a upravit copy, kompozici a pořadí sekcí.
2. Nahradit produktové nákresy fotografiemi nebo rendery skutečného prototypu.
3. Napojení na finální konfigurátor řešit podle skutečného USB/BLE protokolu.
4. Cenu, nákup a hosting doplnit po potvrzení obchodní nabídky.

Zdrojový kód a grafická identita jsou pracovní materiál TOXIQ. Zveřejnění repozitáře samo o sobě neuděluje licenci k dalšímu užití; licence nebyla udělena.
