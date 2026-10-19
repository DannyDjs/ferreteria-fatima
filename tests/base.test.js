// Publicación en una subcarpeta (GitHub Pages): todas las rutas internas deben llevar el prefijo.
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, rm, mkdtemp } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { build, conBase } from '../scripts/build.js';

let dist;
after(async () => { if (dist) await rm(dist, { recursive: true, force: true }); });

test('conBase antepone la subcarpeta solo a rutas internas', () => {
  const html = '<a href="/productos/"></a><a href="https://x.com/"></a><a href="//cdn"></a><img src="/a.webp" srcset="/a.webp 1x, /b.webp 2x"><form action="/productos/">';
  assert.equal(conBase(html, '/ff'), '<a href="/ff/productos/"></a><a href="https://x.com/"></a><a href="//cdn"></a><img src="/ff/a.webp" srcset="/ff/a.webp 1x, /ff/b.webp 2x"><form action="/ff/productos/">');
  assert.equal(conBase(html, ''), html);
});

test('la compilación con BASE_PATH y SITE_URL no deja rutas sin prefijo', async () => {
  dist = await mkdtemp(join(tmpdir(), 'ff-base-'));
  process.env.BASE_PATH = '/ferreteria-fatima';
  process.env.SITE_URL = 'https://ejemplo.github.io/ferreteria-fatima';
  try {
    await build({ silencioso: true, salida: dist });
  } finally {
    delete process.env.BASE_PATH;
    delete process.env.SITE_URL;
  }
  for (const pagina of ['index.html', 'productos/index.html', 'cotizar/index.html', '404.html']) {
    const h = await readFile(join(dist, pagina), 'utf8');
    assert.doesNotMatch(h, /\s(href|src|action)="\/(?!ferreteria-fatima\/|\/)/, `${pagina}: ruta sin subcarpeta`);
    assert.match(h, /<meta http-equiv="Content-Security-Policy"/);
  }
  assert.match(await readFile(join(dist, 'index.html'), 'utf8'), /rel="canonical" href="https:\/\/ejemplo\.github\.io\/ferreteria-fatima\/"/);
  assert.match(await readFile(join(dist, 'assets/css/site.css'), 'utf8'), /url\('\/ferreteria-fatima\/assets\/fonts\//);
  assert.match(await readFile(join(dist, 'sitemap.xml'), 'utf8'), /<loc>https:\/\/ejemplo\.github\.io\/ferreteria-fatima\/productos\/<\/loc>/);
});
