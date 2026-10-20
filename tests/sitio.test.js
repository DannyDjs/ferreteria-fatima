// Pruebas de integridad del sitio generado: compila en una carpeta temporal y revisa
// enlaces, SEO, accesibilidad básica, compatibilidad con la CSP y ausencia de datos sensibles.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir, rm, mkdtemp } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { tmpdir } from 'node:os';
import { build, validarCatalogo } from '../scripts/build.js';

const empresa = JSON.parse(readFileSync(new URL('../src/data/empresa.json', import.meta.url), 'utf8'));
const servicios = JSON.parse(readFileSync(new URL('../src/data/servicios.json', import.meta.url), 'utf8'));

let dist;
let catalogo; // productos y categorías tal como los cargó la compilación (desde la hoja)
const paginas = new Map(); // ruta pública -> html

async function listar(dir) {
  const salida = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const r = join(dir, e.name);
    if (e.isDirectory()) salida.push(...await listar(r)); else salida.push(r);
  }
  return salida;
}

before(async () => {
  dist = await mkdtemp(join(tmpdir(), 'ff-dist-'));
  ({ catalogo } = await build({ silencioso: true, salida: dist }));
  for (const archivo of (await listar(dist)).filter((f) => f.endsWith('.html'))) {
    const rel = relative(dist, archivo).split(sep).join('/');
    const ruta = rel === '404.html' ? '/404.html' : '/' + rel.replace(/index\.html$/, '');
    paginas.set(ruta, await readFile(archivo, 'utf8'));
  }
});

after(async () => { if (dist) await rm(dist, { recursive: true, force: true }); });

const todas = (re, texto) => [...texto.matchAll(re)].map((m) => m[1]);

function resolver(url) {
  const limpio = url.split('#')[0].split('?')[0];
  if (!limpio) return true;
  const ruta = join(dist, ...decodeURIComponent(limpio).split('/').filter(Boolean));
  return limpio.endsWith('/') ? existsSync(join(ruta, 'index.html')) : existsSync(ruta);
}

test('el catálogo de datos es coherente', () => {
  assert.deepEqual(validarCatalogo(catalogo, servicios), []);
});

test('se generan todas las páginas esperadas', () => {
  for (const r of ['/', '/nosotros/', '/productos/', '/servicios/', '/cotizar/', '/contacto/', '/preguntas-frecuentes/', '/politica-de-privacidad/', '/404.html']) {
    assert.ok(paginas.has(r), `Falta la página ${r}`);
  }
  for (const c of catalogo.categorias) assert.ok(paginas.has(`/productos/${c.slug}/`), `Falta la categoría ${c.slug}`);
  for (const p of catalogo.productos) assert.ok(paginas.has(`/productos/${p.categoria}/${p.id}/`), `Falta la ficha ${p.id}`);
});

test('cada página tiene idioma, un único h1, título y descripción únicos y canonical correcto', () => {
  const titulos = new Set();
  const descripciones = new Set();
  for (const [ruta, h] of paginas) {
    assert.match(h, /<html lang="es-CO">/, ruta);
    assert.equal((h.match(/<h1[\s>]/g) || []).length, 1, `${ruta}: debe tener exactamente un <h1>`);
    const titulo = h.match(/<title>([^<]+)<\/title>/)?.[1];
    const desc = h.match(/<meta name="description" content="([^"]+)"/)?.[1];
    assert.ok(titulo, `${ruta}: sin <title>`);
    assert.ok(desc && desc.length >= 50, `${ruta}: descripción ausente o muy corta`);
    assert.ok(!titulos.has(titulo), `${ruta}: título repetido "${titulo}"`);
    assert.ok(!descripciones.has(desc), `${ruta}: descripción repetida`);
    titulos.add(titulo); descripciones.add(desc);
    if (ruta === '/404.html') {
      assert.match(h, /<meta name="robots" content="noindex">/);
    } else {
      assert.ok(h.includes(`<link rel="canonical" href="${empresa.sitioUrl}${ruta}">`), `${ruta}: canonical incorrecto`);
    }
  }
});

test('todos los enlaces y recursos internos existen', () => {
  const rotos = [];
  for (const [ruta, h] of paginas) {
    const urls = [
      ...todas(/\shref="(\/[^"]*)"/g, h),
      ...todas(/\ssrc="(\/[^"]*)"/g, h),
      ...todas(/\ssrcset="([^"]+)"/g, h).flatMap((s) => s.split(',').map((x) => x.trim().split(' ')[0])),
      ...todas(/\simagesrcset="([^"]+)"/g, h).flatMap((s) => s.split(',').map((x) => x.trim().split(' ')[0])),
    ].filter((u) => u.startsWith('/') && !u.startsWith('//'));
    for (const u of urls) if (!resolver(u)) rotos.push(`${ruta} → ${u}`);
  }
  assert.deepEqual(rotos, []);
});

test('los enlaces a anclas apuntan a elementos existentes y no hay enlaces vacíos "#"', () => {
  const problemas = [];
  for (const [ruta, h] of paginas) {
    if (/href="#"/.test(h)) problemas.push(`${ruta}: enlace "#" vacío`);
    for (const ancla of todas(/href="#([^"]+)"/g, h)) {
      if (!h.includes(`id="${ancla}"`)) problemas.push(`${ruta}: #${ancla} no existe`);
    }
    for (const [destino, ancla] of [...h.matchAll(/href="(\/[^"#]*)#([^"]+)"/g)].map((m) => [m[1], m[2]])) {
      const otra = paginas.get(destino);
      if (!otra || !otra.includes(`id="${ancla}"`)) problemas.push(`${ruta}: ${destino}#${ancla} no existe`);
    }
  }
  assert.deepEqual(problemas, []);
});

test('el menú principal enlaza páginas reales y marca la sección activa', () => {
  const h = paginas.get('/productos/');
  for (const href of ['/', '/nosotros/', '/productos/', '/servicios/', '/contacto/', '/cotizar/']) {
    assert.ok(h.includes(`href="${href}"`), `Menú sin enlace a ${href}`);
  }
  assert.match(h, /href="\/productos\/" class="nav__link" aria-current="page"/);
});

test('imágenes con texto alternativo y dimensiones (evita saltos de diseño)', () => {
  const problemas = [];
  for (const [ruta, h] of paginas) {
    for (const img of h.match(/<img\b[^>]*>/g) || []) {
      if (!/\salt="[^"]+"/.test(img)) problemas.push(`${ruta}: imagen sin alt`);
      if (!/\swidth="\d+"/.test(img) || !/\sheight="\d+"/.test(img)) problemas.push(`${ruta}: imagen sin width/height`);
    }
  }
  assert.deepEqual(problemas, []);
});

test('todos los campos de formulario tienen etiqueta', () => {
  const problemas = [];
  for (const [ruta, h] of paginas) {
    const sinPlantillas = h.replace(/<template[\s\S]*?<\/template>/g, '');
    for (const campo of sinPlantillas.match(/<(input|select|textarea)\b[^>]*>/g) || []) {
      if (/type="hidden"/.test(campo)) continue;
      const id = campo.match(/\sid="([^"]+)"/)?.[1];
      if (!id || !sinPlantillas.includes(`for="${id}"`)) problemas.push(`${ruta}: campo sin etiqueta ${campo.slice(0, 60)}`);
    }
  }
  assert.deepEqual(problemas, []);
});

test('compatible con la CSP: sin scripts ni estilos en línea', () => {
  const problemas = [];
  for (const [ruta, h] of paginas) {
    for (const s of h.match(/<script\b[^>]*>/g) || []) {
      if (!/\ssrc="/.test(s) && !/type="application\/(ld\+)?json"/.test(s)) problemas.push(`${ruta}: script en línea`);
    }
    if (/\sstyle="/.test(h)) problemas.push(`${ruta}: atributo style en línea`);
    if (/\son[a-z]+="/.test(h)) problemas.push(`${ruta}: manejador de evento en línea`);
  }
  assert.deepEqual(problemas, []);
});

test('los datos estructurados son JSON válido y no inventan datos', () => {
  for (const [ruta, h] of paginas) {
    for (const bloque of todas(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g, h)) {
      const datos = JSON.parse(bloque);
      assert.equal(datos['@context'], 'https://schema.org', ruta);
      if (datos['@type'] === 'HardwareStore') {
        assert.equal(datos.telephone, empresa.telefonos.celular.e164);
        assert.ok(!('aggregateRating' in datos) && !('review' in datos), 'No se deben publicar calificaciones inventadas');
        assert.ok(!('email' in datos) || empresa.correo, 'No publicar correo sin confirmar');
      }
    }
  }
});

test('la versión de producción no muestra avisos de desarrollo', () => {
  for (const [ruta, h] of paginas) {
    assert.ok(!h.includes('Pendiente de confirmar'), `${ruta}: aviso de pendiente visible en producción`);
    assert.ok(!h.includes('dev-banner'), `${ruta}: banner de desarrollo en producción`);
  }
});

test('no se publican precios, secretos ni archivos privados', async () => {
  const archivos = await listar(dist);
  const textos = archivos.filter((f) => /\.(html|js|css|json|txt|xml|webmanifest)$/.test(f) || f.endsWith('_headers'));
  for (const f of textos) {
    const t = await readFile(f, 'utf8');
    assert.doesNotMatch(t, /sk_live_|AIza[0-9A-Za-z_-]{20}|-----BEGIN|api[_-]?key\s*[:=]/i, `Posible secreto en ${f}`);
    if (f.endsWith('.html')) assert.doesNotMatch(t, /\$\s?\d{1,3}(\.\d{3})+/, `Precio publicado en ${f}`);
  }
  assert.ok(!archivos.some((f) => f.includes('originales')), 'Los originales de marca no deben publicarse');
  assert.ok(!archivos.some((f) => f.endsWith('.env')), 'No se debe publicar .env');
});

test('sitemap y robots', async () => {
  const sitemap = await readFile(join(dist, 'sitemap.xml'), 'utf8');
  const robots = await readFile(join(dist, 'robots.txt'), 'utf8');
  for (const ruta of paginas.keys()) {
    if (ruta === '/404.html') assert.ok(!sitemap.includes('404'), '404 no debe estar en el sitemap');
    else assert.ok(sitemap.includes(`<loc>${empresa.sitioUrl}${ruta}</loc>`), `Sitemap sin ${ruta}`);
  }
  assert.match(robots, new RegExp(`Sitemap: ${empresa.sitioUrl}/sitemap.xml`));
});

test('WhatsApp usa el número comercial configurado', () => {
  for (const [ruta, h] of paginas) {
    for (const numero of todas(/https:\/\/wa\.me\/(\d+)/g, h)) {
      assert.equal(numero, empresa.whatsapp.numero, `${ruta}: número de WhatsApp distinto`);
    }
  }
});
