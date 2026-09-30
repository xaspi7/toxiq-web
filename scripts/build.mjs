import { cp, mkdir, rm, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const root = new URL('../', import.meta.url);
const output = new URL('dist/', root);
const index = new URL('index.html', root);
let html = await readFile(index, 'utf8');
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
console.log('Built static website in dist/');
