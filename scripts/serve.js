// Servidor local sin dependencias que imita el hosting de producción:
// URLs limpias con barra final, 404 personalizado y cabeceras de public/_headers.
// Uso: node scripts/serve.js [--port 5050] [--watch]   (con --watch recompila en modo desarrollo al guardar)
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { readFileSync, watch } from 'node:fs';
import { spawn } from 'node:child_process';
import { gzipSync } from 'node:zlib';
import { join, extname, normalize, dirname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { cargarEnv } from './build.js';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(RAIZ, 'dist');
cargarEnv();
const args = process.argv.slice(2);
const PUERTO = Number(args[args.indexOf('--port') + 1]) || Number(process.env.PORT) || 5050;
const WATCH = args.includes('--watch');

const TIPOS = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json', '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.webp': 'image/webp', '.ico': 'image/x-icon', '.woff2': 'font/woff2',
};

/** Lee las cabeceras globales (bloque "/*") de public/_headers. HSTS y upgrade-insecure-requests se omiten en local. */
function cabecerasGlobales() {
  const lineas = readFileSync(join(RAIZ, 'public', '_headers'), 'utf8').split(/\r?\n/);
  const cab = {};
  let enBloque = false;
  for (const l of lineas) {
    if (/^\S/.test(l)) { enBloque = l.trim() === '/*'; continue; }
    const m = enBloque && l.match(/^\s+([^:]+):\s*(.+)$/);
    if (m) cab[m[1].trim()] = m[2].trim();
  }
  delete cab['Strict-Transport-Security'];
  if (cab['Content-Security-Policy']) cab['Content-Security-Policy'] = cab['Content-Security-Policy'].replace(/;\s*upgrade-insecure-requests/, '');
  return cab;
}

async function existeArchivo(ruta) {
  try { return (await stat(ruta)).isFile(); } catch { return false; }
}

async function responder(req, res) {
  const url = new URL(req.url, 'http://localhost');
  let ruta;
  try { ruta = decodeURIComponent(url.pathname); } catch { ruta = '/'; }
  const fisica = normalize(join(DIST, ruta));
  if (!fisica.startsWith(DIST)) { res.writeHead(400).end(); return; }

  const cab = cabecerasGlobales();
  let archivo = null;
  if (await existeArchivo(fisica)) archivo = fisica;
  else if (await existeArchivo(join(fisica, 'index.html'))) {
    if (!ruta.endsWith('/')) { res.writeHead(308, { Location: ruta + '/' + url.search }).end(); return; }
    archivo = join(fisica, 'index.html');
  } else if (await existeArchivo(fisica + '.html') && !ruta.endsWith('/')) {
    archivo = fisica + '.html';
  }

  if (!archivo) {
    res.writeHead(404, { ...cab, 'Content-Type': TIPOS['.html'] });
    res.end(await readFile(join(DIST, '404.html')));
    console.log(`404 ${ruta}`);
    return;
  }
  const tipo = TIPOS[extname(archivo)] || 'application/octet-stream';
  // HTML siempre fresco (recompilación); fuentes, imágenes, CSS y JS en caché para no repetir la descarga en cada página.
  cab['Cache-Control'] = extname(archivo) === '.html' ? 'no-store' : 'max-age=3600';
  let cuerpo = await readFile(archivo);
  // Compresión como en producción (Cloudflare comprime automáticamente).
  if (/text|javascript|json|xml|svg/.test(tipo) && /gzip/.test(req.headers['accept-encoding'] || '')) {
    cuerpo = gzipSync(cuerpo);
    cab['Content-Encoding'] = 'gzip';
    cab.Vary = 'Accept-Encoding';
  }
  res.writeHead(200, { ...cab, 'Content-Type': tipo });
  res.end(cuerpo);
}

function compilar() {
  return new Promise((ok) => {
    const p = spawn(process.execPath, [join(RAIZ, 'scripts', 'build.js'), '--dev'], { stdio: ['ignore', 'pipe', 'inherit'] });
    p.stdout.on('data', (d) => { const l = String(d).split('\n')[0]; if (l.startsWith('✔')) console.log(l); });
    p.on('close', ok);
  });
}

if (WATCH) {
  await compilar();
  let temporizador;
  watch(join(RAIZ, 'src'), { recursive: true }, (_evento, archivo) => {
    clearTimeout(temporizador);
    temporizador = setTimeout(() => { console.log(`↻ cambio en ${String(archivo).split(sep).join('/')}`); compilar(); }, 150);
  });
}

// Si el puerto está ocupado (otro proyecto abierto), se prueba el siguiente.
function escuchar(puerto, intentos = 10) {
  const servidor = createServer((req, res) => responder(req, res).catch((err) => {
    console.error(err);
    res.writeHead(500).end('Error interno');
  }));
  servidor.once('error', (err) => {
    if (err.code === 'EADDRINUSE' && intentos > 0) {
      console.log(`El puerto ${puerto} está ocupado; probando ${puerto + 1}…`);
      escuchar(puerto + 1, intentos - 1);
    } else {
      throw err;
    }
  });
  servidor.listen(puerto, () => {
    console.log(`Sitio disponible en http://localhost:${puerto}${WATCH ? ' (recompila al guardar)' : ''}`);
  });
}

escuchar(PUERTO);
