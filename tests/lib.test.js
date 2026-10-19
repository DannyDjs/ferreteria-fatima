// Pruebas de las funciones puras del navegador (validación, WhatsApp, búsqueda).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as v from '../src/assets/js/lib/validacion.js';
import { mensajeCotizacion, urlWhatsapp, lineaItem } from '../src/assets/js/lib/whatsapp.js';
import { coincide, normalizar, puntaje } from '../src/assets/js/lib/busqueda.js';
import { generarCodigo } from '../src/assets/js/lib/formulario.js';

test('validación de teléfono colombiano', () => {
  assert.equal(v.telefono('315 486 4439'), '');
  assert.equal(v.telefono('+57 315 486 4439'), '');
  assert.equal(v.telefono('(602) 721 1961'), '');
  assert.equal(v.telefono('7211961'), '');
  assert.match(v.telefono(''), /Escriba un teléfono/);
  assert.equal(v.telefono('', { obligatorio: false }), '');
  assert.match(v.telefono('12ab'), /solo puede tener números/);
  assert.match(v.telefono('12345'), /7 a 10 dígitos/);
  assert.match(v.telefono('31548644391234'), /7 a 10 dígitos/);
});

test('validación de correo', () => {
  assert.equal(v.correo('compras@empresa.com.co'), '');
  assert.match(v.correo(''), /Escriba su correo/);
  assert.match(v.correo('sin-arroba.com'), /correo válido/);
  assert.match(v.correo('a@b'), /correo válido/);
});

test('validación de NIT o documento (opcional)', () => {
  assert.equal(v.documento(''), '');
  assert.equal(v.documento('900.123.456-7'), '');
  assert.equal(v.documento('1085343931'), '');
  assert.match(v.documento('<script>'), /NIT o documento/);
});

test('validación de cantidad', () => {
  assert.equal(v.cantidad('3'), '');
  assert.equal(v.cantidad('2,5'), '');
  assert.match(v.cantidad('0'), /mayor que cero/);
  assert.match(v.cantidad('-1'), /mayor que cero/);
  assert.match(v.cantidad('abc'), /mayor que cero/);
  assert.match(v.cantidad(''), /Indique la cantidad/);
  assert.match(v.cantidad('1000000'), /demasiado alta/);
});

test('limpiar quita caracteres de control y espacios', () => {
  assert.equal(v.limpiar('  hola\u0000 '), 'hola');
  assert.equal(v.requerido('   '), 'Este campo es obligatorio.');
});

test('enlace y mensaje de WhatsApp codificados correctamente', () => {
  const url = urlWhatsapp('57 315-486-4439', 'Hola & <adiós> ñ #1?');
  assert.equal(url, 'https://wa.me/573154864439?text=' + encodeURIComponent('Hola & <adiós> ñ #1?'));
  assert.equal(decodeURIComponent(new URL(url).searchParams.get('text')), 'Hola & <adiós> ñ #1?');
  assert.equal(urlWhatsapp('573154864439'), 'https://wa.me/573154864439');

  const msg = mensajeCotizacion({
    codigo: 'SOL-261014-ABCD', razon_social: 'Taller X', nit: '', contacto: 'Ana', telefono: '3154864439',
    email: '', ciudad: 'Pasto', direccion: '', descripcion: 'Urgente', observaciones: '',
    items: [{ producto: 'Tubería galvanizada', referencia: '1/2"', cantidad: '6', unidad: 'Tubo' }, { producto: 'Codos', referencia: '', cantidad: '1.5', unidad: 'Unidad' }],
  });
  assert.match(msg, /Código de solicitud: SOL-261014-ABCD/);
  assert.match(msg, /1\. Tubería galvanizada — Ref\.\/medida: 1\/2" — Cantidad: 6 Tubo/);
  assert.match(msg, /2\. Codos — Cantidad: 1,5 Unidad/);
  assert.doesNotMatch(msg, /NIT/);
  assert.doesNotMatch(msg, /Correo/);
  assert.match(msg, /\*Descripción adicional\*\nUrgente/);
  assert.equal(lineaItem({ producto: 'A', cantidad: '2', unidad: 'Metro' }, 0), '1. A — Cantidad: 2 Metro');
});

test('búsqueda sin tildes, mayúsculas ni plurales', () => {
  assert.equal(normalizar('Válvulas DE Bola'), 'valvulas de bola');
  assert.ok(coincide('Válvulas de bola para redes', 'valvula'));
  assert.ok(coincide('Tubería galvanizada', 'TUBERIAS galvanizadas'));
  assert.ok(coincide('Llaves para tubo', 'llave tubo'));
  assert.ok(coincide('Cualquier cosa', '   '));
  assert.ok(!coincide('Tubería galvanizada', 'inoxidable'));
  assert.equal(puntaje('Tubería galvanizada', 'Tubería galvanizada redes', 'galvanizada'), 2);
  assert.equal(puntaje('Válvulas galvanizadas', 'Válvulas para tubería galvanizada', 'tuberia galvanizada'), 1);
  assert.equal(puntaje('Codos', 'Codos', 'rodamiento'), 0);
});

test('código de solicitud con formato SOL-AAMMDD-XXXX', () => {
  assert.match(generarCodigo(new Date(2026, 9, 14)), /^SOL-261014-[A-Z0-9]{4}$/);
});
