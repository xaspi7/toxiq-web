# Ověření / 2026-09-29

## Provedeno

- `npm run check`: syntaxe aplikačního JS, lokálního serveru a buildu prošla.
- `npm run build`: statický distribuční web se sestavil.
- Všechny odkazy na lokální soubory a navigační anchors mají existující cíl. HTML nemá duplicitní ID.
- Všechny SVG assets se validně parsují jako XML.
- Návrh vychází ze schváleného Brand Manualu v0.2; originál a interní koncept nejsou součástí veřejné větve.
- Samostatný HTML náhled obsahuje embedded SVG, CSS a JS včetně přepínání obou colorways.
- Ruční kontrola kódu: uživatelské hodnoty se vkládají pomocí `textContent`, uložená data se validují a selhání `localStorage` má fallback.

## Zbývá

Browser runtime nebyl dostupný; automatické stažení testovacího prohlížeče selhalo. Mobilní a desktopová vizuální QA ani browser end-to-end ověření nejsou označena za hotová.

Po zpřístupnění browser runtime ověřit viewporty 1440×1000, 768×1024 a 375×812 v obou colorways, žádný horizontální overflow, čitelnost při 200% zoomu, editing, reload persistence, profilový reset, JSON export, keyboard navigation a error console. Ověřit také bezpečné zobrazení vstupu obsahujícího HTML.

Repozitář `https://github.com/xaspi7/toxiq-web` založil Adam. GitHub přístup k němu je ověřen; úvodní projekt se ukládá do hlavní větve `main`. Automatická kontrola v `.github/workflows/check.yml` ověří syntax a vytvoří statický build, ale web veřejně nepublikuje.
