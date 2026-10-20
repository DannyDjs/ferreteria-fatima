// Script de Google Apps Script que recibe las solicitudes (docs/solicitudes.gs), ejecutado con servicios simulados,
// y el envío desde la página (enviar) hacia Apps Script.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { enviar } from '../src/assets/js/lib/formulario.js';

const codigoGs = readFileSync(new URL('../docs/solicitudes.gs', import.meta.url), 'utf8');

function entorno({ correoFalla = false } = {}) {
  const filas = [];
  const correos = [];
  const cache = new Map();
  const hoja = { appendRow: (f) => filas.push(f), setFrozenRows() {} };
  const ctx = {
    console: { error() {} },
    SpreadsheetApp: { getActiveSpreadsheet: () => ({ getSheetByName: () => (filas.length ? hoja : null), insertSheet: () => hoja }) },
    MailApp: { sendEmail: (o) => { if (correoFalla) throw new Error('cuota'); correos.push(o); } },
    PropertiesService: { getScriptProperties: () => ({ getProperty: (k) => (k === 'CORREO_DESTINO' ? 'ventas@ferreteria.test' : null) }) },
    Session: { getEffectiveUser: () => ({ getEmail: () => 'duenio@ferreteria.test' }) },
    CacheService: { getScriptCache: () => ({ get: (k) => cache.get(k), put: (k, v) => cache.set(k, v) }) },
    LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
    Utilities: { getUuid: () => 'abcd1234-0000' },
    ContentService: { MimeType: { JSON: 'json' }, createTextOutput: (t) => ({ setMimeType: () => JSON.parse(t) }) },
  };
  vm.createContext(ctx);
  vm.runInContext(codigoGs, ctx);
  return { ctx, filas, correos };
}

const valida = {
  codigo_solicitud: 'SOL-261020-AB12', razon_social: 'Taller Prueba', nit_documento: '900.123.456-7', contacto: 'Ana',
  telefono: '+57 315 486 4439', email: 'ana@taller.co', ciudad: 'Pasto', productos: '1. Codos | Cantidad: 2 Unidad',
  descripcion: '=HYPERLINK("http://malo")', observaciones: '', autoriza_tratamiento_datos: 'Sí (2026-10-20)', _gotcha: '',
};
const post = (datos) => ({ postData: { type: 'text/plain', contents: JSON.stringify(datos) } });

test('solicitud válida: guarda la fila (sin fórmulas) y envía el correo con respuesta al cliente', () => {
  const { ctx, filas, correos } = entorno();
  const r = ctx.doPost(post(valida));
  assert.deepEqual(r, { ok: true, codigo: 'SOL-261020-AB12' });
  assert.equal(filas.length, 2, 'encabezado + solicitud');
  const fila = filas[1];
  assert.equal(fila[1], 'SOL-261020-AB12');
  assert.equal(fila[5], "'+57 315 486 4439", 'el teléfono no se convierte en fórmula');
  assert.equal(fila[9], `'=HYPERLINK("http://malo")`, 'texto con = se guarda como texto');
  assert.equal(fila[12], 'Nueva');
  assert.equal(correos.length, 1);
  assert.equal(correos[0].to, 'ventas@ferreteria.test');
  assert.equal(correos[0].replyTo, 'ana@taller.co');
  assert.match(correos[0].subject, /SOL-261020-AB12/);
});

test('rechaza datos inválidos y no guarda nada', () => {
  const { ctx, filas } = entorno();
  assert.equal(ctx.doPost(post({ ...valida, email: 'malo' })).ok, false);
  assert.equal(ctx.doPost(post({ ...valida, autoriza_tratamiento_datos: '' })).ok, false);
  assert.equal(ctx.doPost(post({ ...valida, productos: '' })).ok, false);
  assert.equal(ctx.doPost(post({ ...valida, razon_social: 'x'.repeat(500) })).ok, false);
  assert.equal(filas.length, 0);
});

test('trampa anti-spam llena: responde éxito pero no guarda ni envía', () => {
  const { ctx, filas, correos } = entorno();
  assert.equal(ctx.doPost(post({ ...valida, _gotcha: 'spam' })).ok, true);
  assert.equal(filas.length + correos.length, 0);
});

test('si el correo falla, la solicitud queda guardada y se responde éxito', () => {
  const { ctx, filas } = entorno({ correoFalla: true });
  assert.equal(ctx.doPost(post(valida)).ok, true);
  assert.equal(filas.length, 2);
});

test('envío sin JavaScript (formulario normal) también se registra', () => {
  const { ctx, filas } = entorno();
  const r = ctx.doPost({ postData: { type: 'application/x-www-form-urlencoded', contents: 'x' }, parameter: {
    razon_social: 'Taller', contacto: 'Ana', telefono: '3154864439', email: 'a@b.co', consentimiento: 'Sí',
    producto_1: 'Codos', cantidad_1: '2', unidad_1: 'Unidad', producto_2: 'Tes', referencia_2: '1/2"', cantidad_2: '1', unidad_2: 'Unidad',
  } });
  assert.equal(r.ok, true);
  assert.match(filas[1][8], /1\. Codos \| Cantidad: 2 Unidad\n2\. Tes \| Ref\.\/medida: 1\/2" \| Cantidad: 1 Unidad/);
  assert.match(filas[1][1], /^SOL-/);
});

test('limita la cantidad de solicitudes por hora', () => {
  const { ctx } = entorno();
  for (let i = 0; i < 60; i++) assert.equal(ctx.doPost(post(valida)).ok, true);
  assert.equal(ctx.doPost(post(valida)).ok, false);
});

test('enviar() a Apps Script: texto plano y error legible si el script rechaza', async () => {
  const real = globalThis.fetch;
  let pedido;
  try {
    globalThis.fetch = async (url, op) => { pedido = op; return new Response(JSON.stringify({ ok: false, error: 'El correo no es válido.' }), { status: 200 }); };
    await assert.rejects(enviar('https://script.google.com/macros/s/ABC/exec', { a: 1 }), /El correo no es válido/);
    assert.equal(pedido.headers['Content-Type'], 'text/plain;charset=utf-8');
    globalThis.fetch = async () => new Response(JSON.stringify({ ok: true }), { status: 200 });
    assert.equal(await enviar('https://script.google.com/macros/s/ABC/exec', { a: 1 }), true);
  } finally {
    globalThis.fetch = real;
  }
});
