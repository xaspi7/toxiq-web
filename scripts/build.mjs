import { cp, mkdir, rm, readFile, writeFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const root = new URL('../', import.meta.url);
const output = new URL('dist/', root);
const index = new URL('index.html', root);
let html = await readFile(index, 'utf8');
let css = await readFile(new URL('styles.css', root), 'utf8');
const escape = text => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const images = (await readdir(new URL('assets/', root))).filter(name => name.endsWith('.svg')).map(name => `assets/${name}`);
for (const asset of [...images, 'assets/fonts/InterVariable.woff2']) {
  const hash = createHash('sha256').update(await readFile(new URL(asset, root))).digest('hex').slice(0, 12);
  const pattern = new RegExp(`(["'])${escape(asset)}(?:\\?v=[^"']*)?\\1`, 'g');
  html = html.replace(pattern, (_, quote) => `${quote}${asset}?v=${hash}${quote}`);
  css = css.replace(pattern, (_, quote) => `${quote}${asset}?v=${hash}${quote}`);
}
await writeFile(new URL('styles.css', root), css);
for (const asset of ['styles.css', 'app.js']) {
  const hash = createHash('sha256').update(await readFile(new URL(asset, root))).digest('hex').slice(0, 12);
  const pattern = new RegExp(`"${asset.replace('.', '\\.')}\\?(?:v=[^"]*)"|"${asset.replace('.', '\\.')}"`, 'g');
  html = html.replace(pattern, `"${asset}?v=${hash}"`);
}
await writeFile(index, html);
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
for (const file of ['index.html', 'styles.css', 'app.js', 'assets']) {
  await cp(new URL(file, root), new URL(file, output), { recursive: true });
}
await cp(new URL('configurator/dist/', root), new URL('configurator/', output), { recursive: true });
console.log('Built static website in dist/');
