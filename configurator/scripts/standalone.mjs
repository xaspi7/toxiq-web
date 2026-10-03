import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
const root = new URL('../dist/', import.meta.url);
const assets = new URL('assets/', root);
const files = await readdir(assets);
const cssFile = files.find(name => name.endsWith('.css'));
const jsFile = files.find(name => name.endsWith('.js'));
let html = await readFile(new URL('index.html', root), 'utf8');
let css = await readFile(new URL(cssFile, assets), 'utf8');
let js = await readFile(new URL(jsFile, assets), 'utf8');
const dataUrls = new Map();
for (const name of files.filter(name => /\.(svg|woff2)$/.test(name))) {
  const mime = name.endsWith('.svg') ? 'image/svg+xml' : 'font/woff2';
  const data = `data:${mime};base64,${(await readFile(new URL(name, assets))).toString('base64')}`;
  dataUrls.set(name, data);
  css = css.replaceAll(`./${name}`, data).replaceAll(name, data);
}
js = js.replace(/new URL\(([`"'])([^`"']+)\1,import\.meta\.url\)\.href/g, (match, _quote, name) => dataUrls.has(name) ? JSON.stringify(dataUrls.get(name)) : match);
if (js.includes('new URL(') && js.includes('import.meta.url')) throw new Error('Standalone still has unresolved assets.');
html = html.replace(/<meta http-equiv="Content-Security-Policy"[^>]+>/, '<meta http-equiv="Content-Security-Policy" content="default-src \'self\'; script-src \'unsafe-inline\'; style-src \'unsafe-inline\'; img-src data:; font-src data:; object-src \'none\'">');
html = html.replace(/<script type="module"[^>]+><\/script>/, () => `<script type="module">${js.replaceAll('</script', '<\\/script')}</script>`);
html = html.replace(/<link rel="stylesheet"[^>]+>/, () => `<style>${css}</style>`);
const output = resolve(process.argv[2] || 'qa/TOXIQ_Configurator_preview.html');
await mkdir(dirname(output), { recursive: true });
await writeFile(output, html);
console.log(`Created ${output}`);
