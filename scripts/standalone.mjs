import { readFile, writeFile } from 'node:fs/promises';
const root = new URL('../', import.meta.url);
const assets = {};
for (const name of ['wordmark-black', 'wordmark-white', 'product-black', 'product-white', 'signature-q', 'signature-q-white']) {
  assets[`assets/${name}.svg`] = `data:image/svg+xml;base64,${(await readFile(new URL(`assets/${name}.svg`, root))).toString('base64')}`;
}
let html = await readFile(new URL('index.html', root), 'utf8');
const css = await readFile(new URL('styles.css', root), 'utf8');
let js = await readFile(new URL('app.js', root), 'utf8');
js = js.replace('img.src = `assets/wordmark-${colorway}.svg`', 'img.src = standaloneAssets[`assets/wordmark-${colorway}.svg`]')
  .replace("colorway === 'black' ? 'assets/signature-q.svg' : 'assets/signature-q-white.svg'", "standaloneAssets[colorway === 'black' ? 'assets/signature-q.svg' : 'assets/signature-q-white.svg']")
  .replace('product.src = `assets/product-${colorway}.svg`', 'product.src = standaloneAssets[`assets/product-${colorway}.svg`]');
for (const [path, data] of Object.entries(assets)) html = html.replaceAll(`"${path}"`, `"${data}"`);
html = html.replace(/<link rel="stylesheet" href="styles\.css(?:\?v=[^"]*)?">/, `<style>${css}</style>`)
  .replace(/  <script src="app\.js(?:\?v=[^"]*)?" defer><\/script>\n/, '')
  .replace('</body>', `<script>const standaloneAssets = ${JSON.stringify(assets)};\n${js}</script>\n</body>`);
await writeFile(new URL('../TOXIQ-preview.html', root), html);
console.log('Created TOXIQ-preview.html with all assets embedded.');
