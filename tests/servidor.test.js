// Pruebas del servidor local (imita el hosting): URLs limpias, 404 y cabeceras de seguridad.
// Requiere dist/ compilado (npm test compila antes de ejecutar las pruebas).
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const PUERTO = 4399;
const base = `http://127.0.0.1:${PUERTO}`;
let servidor;

before(async () => {
  servidor = spawn(process.execPath, [fileURLToPath(new URL('../scripts/serve.js', import.meta.url)), '--port', String(PUERTO)], { stdio: ['ignore', 'pipe', 'inherit'] });
  await new Promise((ok, falla) => {
    servidor.stdout.on('data', (d) => { if (String(d).includes('Sitio disponible')) ok(); });
    servidor.on('exit', (c) => falla(new Error(`El servidor terminó con código ${c}`)));
  });
});

after(() => servidor?.kill());

test('las páginas responden 200 con cabeceras de seguridad', async () => {
  for (const ruta of ['/', '/nosotros/', '/productos/', '/productos/tuberias/', '/productos/tuberias/tuberia-galvanizada/', '/servicios/', '/cotizar/', '/contacto/']) {
    const r = await fetch(base + ruta);
    assert.equal(r.status, 200, ruta);
    assert.match(r.headers.get('content-type'), /text\/html/);
    assert.match(r.headers.get('content-security-policy') || '', /default-src 'self'/);
    assert.equal(r.headers.get('x-content-type-options'), 'nosniff');
  }
});

test('las rutas sin barra final redirigen a la versión con barra', async () => {
  const r = await fetch(`${base}/productos?q=codos`, { redirect: 'manual' });
  assert.equal(r.status, 308);
  assert.equal(r.headers.get('location'), '/productos/?q=codos');
});

test('una ruta inexistente responde 404 con la página personalizada', async () => {
  const r = await fetch(`${base}/no-existe/`);
  assert.equal(r.status, 404);
  assert.match(await r.text(), /No encontramos esta página/);
});

test('no permite salir de la carpeta publicada', async () => {
  const r = await fetch(`${base}/..%2fpackage.json`);
  assert.ok([400, 404].includes(r.status));
  assert.doesNotMatch(await r.text(), /"scripts"/);
});
