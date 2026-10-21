#!/usr/bin/env node
// Builds dist/bpre-force-builder.html: the whole app in one file you can share or open offline.
// Usage: node tools/build-single.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(root, p), 'utf8');

let html = read('index.html');
const guard = (s) => s.replace(/<\/script/gi, '<\\/script');
html = html.replace('<link rel="stylesheet" href="css/style.css">', () => `<style>\n${read('css/style.css')}\n</style>`);
html = html.replace('<script src="data/data.js"></script>', () => `<script>\n${guard(read('data/data.js'))}\n</script>`);
html = html.replace('<script src="data/reference.js"></script>', () => `<script>\n${guard(read('data/reference.js'))}\n</script>`);
html = html.replace('<script src="js/app.js"></script>', () => `<script>\n${guard(read('js/app.js'))}\n</script>`);
// Inline images so the single file works offline.
html = html.replace(/assets\/[\w\-\/]+\.(jpg|jpeg|png|webp)/g, (p, ext) => {
  const mime = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
  return `data:${mime};base64,` + readFileSync(join(root, p)).toString('base64');
});

mkdirSync(join(root, 'dist'), { recursive: true });
writeFileSync(join(root, 'dist', 'bpre-force-builder.html'), html);
console.log('Wrote dist/bpre-force-builder.html (' + Math.round(html.length / 1024) + ' KB)');
