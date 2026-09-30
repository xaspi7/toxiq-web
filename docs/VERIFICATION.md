# Ověření / 2026-09-30

## Provedeno

- `npm run check`: syntaxe aplikačního JS, lokálního serveru a buildu prošla.
- `npm run build`: statický distribuční web se sestavil.
- Všechny odkazy na lokální soubory a navigační anchors mají existující cíl. HTML nemá duplicitní ID.
- Všechny SVG assets se validně parsují jako XML.
- Návrh vychází ze schváleného Brand Manualu v0.2; originál a interní koncept nejsou součástí veřejné větve.
- Samostatný HTML náhled obsahuje embedded SVG, CSS a JS včetně přepínání obou colorways.
- Produktové příklady se vkládají pomocí `textContent`. Profily jsou read-only; původní editor, simulace stisku, export a reset jsou odstraněné. Ukládání barevné preference má fallback při nedostupném `localStorage`.

## Zbývá

Browser runtime nebyl dostupný; automatické stažení testovacího prohlížeče selhalo. Původní verze proto neměla dokončenou vizuální QA; nové produktové příklady jsou určené pro kontrolu přímo v publikovaném webu.

Po zpřístupnění browser runtime ověřit viewporty 1440×1000, 768×1024 a 375×812 v obou colorways, žádný horizontální overflow, čitelnost při 200% zoomu, přepínání všech tří profilů, šest read-only příkladů, odkazy z Themes, obě colorways, keyboard navigation a error console.

Repozitář `https://github.com/xaspi7/toxiq-web` založil Adam. GitHub přístup k němu je ověřen; úvodní projekt se ukládá do hlavní větve `main`. Automatická kontrola v `.github/workflows/check.yml` ověří syntax a vytvoří statický build, ale web veřejně nepublikuje.
