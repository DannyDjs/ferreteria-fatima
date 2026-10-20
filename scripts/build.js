// Genera el sitio estático en dist/ a partir de src/.
// Uso: node scripts/build.js [--dev]
import { readFile, writeFile, mkdir, rm, cp, readdir } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { NOMBRES_ICONOS } from '../src/templates/icons.js';
import { cargarCatalogo, descargarImagenes } from './catalogo.js';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(RAIZ, 'src');
const DIST_PREDETERMINADA = join(RAIZ, 'dist');

// Orden de concatenación de la hoja de estilos final.
const CSS = ['base.css', 'layout.css', 'components.css', 'pages.css'];
const PAGINAS = ['inicio', 'nosotros', 'productos', 'servicios', 'cotizar', 'contacto', 'otras'];

export function cargarEnv() {
  const archivo = join(RAIZ, '.env');
  if (!existsSync(archivo)) return;
  for (const linea of readFileSync(archivo, 'utf8').split(/\r?\n/)) {
    const m = linea.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

async function leerJson(nombre) {
  return JSON.parse(await readFile(join(SRC, 'data', nombre), 'utf8'));
}

/** Valida la coherencia del catálogo; detiene la compilación si hay errores. */
export function validarCatalogo(catalogo, servicios) {
  const errores = [];
  const slugs = new Set();
  for (const c of catalogo.categorias) {
    if (slugs.has(c.slug)) errores.push(`Categoría duplicada: ${c.slug}`);
    slugs.add(c.slug);
    if (!NOMBRES_ICONOS.includes(c.icono)) errores.push(`Icono inexistente en categoría ${c.slug}: ${c.icono}`);
  }
  const ids = new Set();
  for (const p of catalogo.productos) {
    if (!/^[a-z0-9-]+$/.test(p.id)) errores.push(`ID inválido (solo minúsculas, números y guiones): ${p.id}`);
    if (ids.has(p.id)) errores.push(`Producto duplicado: ${p.id}`);
    ids.add(p.id);
    const cat = catalogo.categorias.find((c) => c.slug === p.categoria);
    if (!cat) { errores.push(`Producto ${p.id}: categoría inexistente ${p.categoria}`); continue; }
    if (!cat.subcategorias.some((s) => s.slug === p.subcategoria)) errores.push(`Producto ${p.id}: subcategoría inexistente ${p.subcategoria}`);
    if (!p.nombre || !p.descripcion) errores.push(`Producto ${p.id}: falta nombre o descripción`);
    if (p.servicio && !servicios.servicios.some((s) => s.slug === p.servicio)) errores.push(`Producto ${p.id}: servicio inexistente ${p.servicio}`);
    if (p.verCategoria && !slugs.has(p.verCategoria)) errores.push(`Producto ${p.id}: verCategoria inexistente ${p.verCategoria}`);
  }
  for (const c of catalogo.categorias) {
    for (const s of c.subcategorias) {
      if (!catalogo.productos.some((p) => p.categoria === c.slug && p.subcategoria === s.slug)) {
        errores.push(`Subcategoría sin productos (quedaría vacía): ${c.slug}/${s.slug}`);
      }
    }
  }
  return errores;
}

/** Minificación conservadora: quita comentarios y espacios sobrantes (sin tocar cadenas ni url()). */
export function minificarCss(css) {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*([{};,>])\s*/g, '$1')
    .replace(/;}/g, '}')
    .trim();
}

/** Antepone la subcarpeta de publicación (p. ej. GitHub Pages: /ferreteria-fatima) a las rutas absolutas internas. */
export function conBase(html, base) {
  if (!base) return html;
  return html
    .replace(/(\s(?:href|src|action)=")\/(?!\/)/g, `$1${base}/`)
    .replace(/(\s(?:srcset|imagesrcset)=")([^"]+)"/g, (_, attr, valor) => attr + valor.replace(/(^|,\s*)\/(?!\/)/g, `$1${base}/`) + '"');
}

/** CSP de public/_headers como <meta> (hostings sin cabeceras, como GitHub Pages). frame-ancestors no se admite en <meta>; upgrade-insecure-requests rompería el servidor local http. */
function cspMeta() {
  const linea = readFileSync(join(RAIZ, 'public', '_headers'), 'utf8').match(/Content-Security-Policy:\s*(.+)/);
  return linea ? linea[1].split(';').map((d) => d.trim()).filter((d) => d && !d.startsWith('frame-ancestors') && d !== 'upgrade-insecure-requests').join('; ') : '';
}

async function hashArchivos(rutas) {
  const h = createHash('sha256');
  for (const r of rutas) h.update(await readFile(r));
  return h.digest('hex').slice(0, 10);
}

async function listarRecursivo(dir) {
  const salida = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const ruta = join(dir, e.name);
    if (e.isDirectory()) salida.push(...await listarRecursivo(ruta));
    else salida.push(ruta);
  }
  return salida;
}

export async function build({ dev = false, silencioso = false, salida = DIST_PREDETERMINADA } = {}) {
  const DIST = salida;
  const inicio = Date.now();
  cargarEnv();
  const [empresa, categoriasJson, servicios] = await Promise.all([leerJson('empresa.json'), leerJson('catalogo.json'), leerJson('servicios.json')]);
  // Productos desde la hoja de cálculo (Google Sheets publicada o copia local).
  const { categorias, productos, avisos, origen: origenCatalogo } = await cargarCatalogo(categoriasJson.categorias, { archivoLocal: join(SRC, 'data', 'catalogo.csv') });
  const catalogo = { categorias, productos };

  const errores = validarCatalogo(catalogo, servicios);
  if (errores.length) throw new Error('Catálogo con errores:\n - ' + errores.join('\n - '));

  const formEndpoint = process.env.FORM_ENDPOINT || empresa.formularios.endpoint;
  const base = (process.env.BASE_PATH || '').replace(/\/+$/, '');
  if (base && !/^\/[\w-]+$/.test(base)) throw new Error('BASE_PATH debe tener la forma /nombre-carpeta');
  if (process.env.SITE_URL) empresa.sitioUrl = process.env.SITE_URL.replace(/\/+$/, '');
  if (!/^https:\/\//.test(formEndpoint)) throw new Error('FORM_ENDPOINT debe ser una URL https://');

  const cssRutas = CSS.map((f) => join(SRC, 'assets', 'css', f));
  const jsRutas = await listarRecursivo(join(SRC, 'assets', 'js'));
  const version = await hashArchivos([...cssRutas, ...jsRutas]);

  const ctx = { empresa, catalogo, servicios, dev, version, formEndpoint, csp: cspMeta(), anio: new Date().getFullYear() };

  await rm(DIST, { recursive: true, force: true });
  await mkdir(join(DIST, 'assets', 'css'), { recursive: true });

  // Recursos estáticos (sin los originales de marca, que no se publican).
  await cp(join(RAIZ, 'public'), DIST, { recursive: true });
  await cp(join(SRC, 'assets', 'fonts'), join(DIST, 'assets', 'fonts'), { recursive: true });
  await cp(join(SRC, 'assets', 'js'), join(DIST, 'assets', 'js'), { recursive: true });
  await cp(join(SRC, 'assets', 'img'), join(DIST, 'assets', 'img'), {
    recursive: true,
    filter: (origen) => !origen.includes('originales'),
  });
  await descargarImagenes(catalogo.productos, DIST, avisos);
  const css = minificarCss((await Promise.all(cssRutas.map((r) => readFile(r, 'utf8')))).join('\n')).replace(/url\('\//g, `url('${base}/`);
  await writeFile(join(DIST, 'assets', 'css', 'site.css'), css);

  // Páginas
  const { layout } = await import(pathToFileURL(join(SRC, 'templates', 'layout.js')).href);
  const paginas = [];
  for (const nombre of PAGINAS) {
    const mod = await import(pathToFileURL(join(SRC, 'pages', `${nombre}.js`)).href + `?t=${Date.now()}`);
    paginas.push(...mod.default(ctx));
  }
  const vistas = new Set();
  for (const p of paginas) {
    if (vistas.has(p.ruta)) throw new Error(`Ruta duplicada: ${p.ruta}`);
    vistas.add(p.ruta);
    const archivo = p.archivo ? join(DIST, p.archivo) : join(DIST, ...p.ruta.split('/').filter(Boolean), 'index.html');
    await mkdir(dirname(archivo), { recursive: true });
    await writeFile(archivo, conBase(layout(ctx, p, p.cuerpo), base));
  }

  // SEO: sitemap y robots
  const hoy = new Date().toISOString().slice(0, 10);
  const urls = paginas.filter((p) => !p.noIndex).map((p) => {
    const prioridad = p.ruta === '/' ? '1.0' : p.ruta.split('/').filter(Boolean).length > 2 ? '0.5' : '0.8';
    return `  <url><loc>${empresa.sitioUrl}${p.ruta}</loc><lastmod>${hoy}</lastmod><priority>${prioridad}</priority></url>`;
  });
  await writeFile(join(DIST, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`);
  await writeFile(join(DIST, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${empresa.sitioUrl}/sitemap.xml\n`);
  await writeFile(join(DIST, 'site.webmanifest'), JSON.stringify({
    name: empresa.nombre, short_name: 'F. Fátima', start_url: `${base}/`, display: 'browser',
    background_color: '#ffffff', theme_color: '#001a35',
    icons: [{ src: `${base}/icon-192.png`, sizes: '192x192', type: 'image/png' }, { src: `${base}/icon-512.png`, sizes: '512x512', type: 'image/png' }],
  }, null, 2));

  if (!silencioso) {
    console.log(`✔ ${paginas.length} páginas generadas en dist/ (${dev ? 'desarrollo' : 'producción'}) en ${Date.now() - inicio} ms`);
    console.log(`  Formularios → ${formEndpoint}`);
    console.log(`  Catálogo → ${catalogo.productos.length} productos en ${catalogo.categorias.length} categorías (${origenCatalogo})`);
    if (avisos.length) {
      console.log(`
⚠ ${avisos.length} avisos del catálogo (las filas con problemas no se publican):`);
      for (const a of avisos) console.log(`  - ${a}`);
    }
    if (empresa.pendientes?.length) {
      console.log(`\n⚠ ${empresa.pendientes.length} datos comerciales pendientes de confirmar (src/data/empresa.json → "pendientes"):`);
      for (const p of empresa.pendientes) console.log(`  - ${p}`);
    }
  }
  return { paginas: paginas.map((p) => p.ruta), version, catalogo, avisos };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  build({ dev: process.argv.includes('--dev') }).catch((err) => {
    console.error('✖ Error de compilación:\n' + err.message);
    process.exit(1);
  });
}
