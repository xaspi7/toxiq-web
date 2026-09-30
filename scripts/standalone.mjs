import { readFile, writeFile } from 'node:fs/promises';
const root = new URL('../', import.meta.url);
let html = await readFile(new URL('index.html', root), 'utf8');
let css = await readFile(new URL('styles.css', root), 'utf8');
const js = await readFile(new URL('app.js', root), 'utf8');
const escape = text => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
for (const name of ['wordmark-black', 'wordmark-white', 'product-black', 'product-white', 'signature-q', 'signature-q-white']) {
  const path = `assets/${name}.svg`;
  const data = `data:image/svg+xml;base64,${(await readFile(new URL(path, root))).toString('base64')}`;
  html = html.replace(new RegExp(`(["'])${escape(path)}(?:\\?v=[^"']*)?\\1`, 'g'), (_, quote) => `${quote}${data}${quote}`);
}
const fontPath = 'assets/fonts/InterVariable.woff2';
const font = `data:font/woff2;base64,${(await readFile(new URL(fontPath, root))).toString('base64')}`;
const fontPattern = new RegExp(`(["'])${escape(fontPath)}(?:\\?v=[^"']*)?\\1`, 'g');
html = html.replace(fontPattern, (_, quote) => `${quote}${font}${quote}`);
css = css.replace(fontPattern, (_, quote) => `${quote}${font}${quote}`);
html = html.replace(/<link rel="stylesheet" href="styles\.css(?:\?v=[^"]*)?">/, `<style>${css}</style>`)
  .replace(/  <script src="app\.js(?:\?v=[^"]*)?" defer><\/script>\n/, '')
  .replace('</body>', `<script>${js}</script>\n</body>`);
await writeFile(new URL('qa/standalone.html', root), html);
console.log('Created qa/standalone.html with embedded images and font.');
