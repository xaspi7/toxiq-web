import { cp, mkdir, rm, readFile, writeFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const root = new URL('../', import.meta.url);
const output = new URL('dist/', root);
const pages = ['index.html', 'pad.html', 'app.html'];
const documents = new Map(await Promise.all(pages.map(async page => [page, await readFile(new URL(page, root), 'utf8')])));
let css = await readFile(new URL('styles.css', root), 'utf8');
const escape = text => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const images = (await readdir(new URL('assets/', root))).filter(name => name.endsWith('.svg')).map(name => `assets/${name}`);
for (const asset of [...images, 'assets/fonts/InterVariable.woff2', 'assets/configurator-dark.webp', 'assets/configurator-light.webp']) {
  const hash = createHash('sha256').update(await readFile(new URL(asset, root))).digest('hex').slice(0, 12);
  const pattern = new RegExp(`(["'])${escape(asset)}(?:\\?v=[^"']*)?\\1`, 'g');
  for (const [page, html] of documents) documents.set(page, html.replace(pattern, (_, quote) => `${quote}${asset}?v=${hash}${quote}`));
  css = css.replace(pattern, (_, quote) => `${quote}${asset}?v=${hash}${quote}`);
}
await writeFile(new URL('styles.css', root), css);
for (const asset of ['styles.css', 'app.js']) {
  const hash = createHash('sha256').update(await readFile(new URL(asset, root))).digest('hex').slice(0, 12);
  const pattern = new RegExp(`"${asset.replace('.', '\\.')}\\?(?:v=[^"]*)"|"${asset.replace('.', '\\.')}"`, 'g');
  for (const [page, html] of documents) documents.set(page, html.replace(pattern, `"${asset}?v=${hash}"`));
}
for (const [page, html] of documents) await writeFile(new URL(page, root), html);
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
for (const file of [...pages, 'styles.css', 'app.js', 'assets']) {
  await cp(new URL(file, root), new URL(file, output), { recursive: true });
}
await mkdir(new URL('downloads/', output), { recursive: true });
// Installers are added to the Pages artifact; development firmware stays private to the product site.
for (const file of (await readdir(new URL('downloads/', root))).filter(name => name.endsWith('.exe'))) {
  await cp(new URL(`downloads/${file}`, root), new URL(`downloads/${file}`, output));
}
await writeFile(new URL('.nojekyll', output), '');
await cp(new URL('configurator/dist/', root), new URL('configurator/', output), { recursive: true });
console.log('Built static website in dist/');
