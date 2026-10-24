// Lector de la hoja del catálogo (CSV de Google Sheets).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseCsv, procesarCsv, urlDirecta, slug } from '../scripts/catalogo.js';

const categorias = [
  { slug: 'gas-y-glp', nombre: 'Gas y GLP', icono: 'gas' },
  { slug: 'redes-contra-incendios', nombre: 'Redes contra incendios', icono: 'incendio' },
];

test('parseCsv: comillas, comas y saltos de línea dentro de celdas, BOM y CRLF', () => {
  const filas = parseCsv('﻿a,b,c\r\n"uno, dos","con ""comillas""","línea1\nlínea2"\r\n\r\n,,\n');
  assert.deepEqual(filas, [['a', 'b', 'c'], ['uno, dos', 'con "comillas"', 'línea1\nlínea2']]);
});

test('procesarCsv: arma productos y subcategorías, omite filas inválidas o no publicadas', () => {
  const csv = [
    'Categoría,Subcategoría,Producto,Referencia,Marca,Medida / unidad,Descripción,Imagen,Publicar,Notas internas',
    'Gas y GLP,Reguladores de gas,Regulador Unkar R30,R30,Unkar,,,,Sí,',
    'gas y glp,Reguladores de gas,Regulador Unkar R25,R25,Unkar,,Para GLP,,,',          // categoría en minúsculas y Publicar vacío → se publica
    'Gas y GLP,,Válvulas para gas,,,,,,sí,',                                               // sin subcategoría → General
    'Gas y GLP,Pendientes,Accesorios PALB,,,,,,No,Pendiente',                             // no se publica
    'Categoría inventada,X,Producto raro,,,,,,Sí,',                                       // categoría inexistente → aviso
    'Gas y GLP,Reguladores de gas,,,,,,,Sí,',                                             // sin nombre → aviso
    'Gas y GLP,Reguladores de gas,Regulador Unkar R30,,,,,,Sí,',                          // repetido → otra dirección
  ].join('\n');
  const { categorias: cats, productos, avisos } = procesarCsv(csv, categorias);

  assert.deepEqual(productos.map((p) => p.nombre), ['Regulador Unkar R30', 'Regulador Unkar R25', 'Válvulas para gas', 'Regulador Unkar R30']);
  assert.equal(new Set(productos.map((p) => p.id)).size, productos.length, 'IDs únicos');
  assert.equal(productos[0].marca, 'Unkar');
  assert.equal(productos[1].descripcion, 'Para GLP');
  assert.match(productos[0].descripcion, /Consulte/);
  assert.equal(productos[2].subcategoria, 'general');
  assert.equal(cats.length, 1, 'las categorías sin productos no se publican');
  assert.deepEqual(cats[0].subcategorias.map((s) => s.nombre), ['Reguladores de gas', 'General']);
  assert.equal(avisos.length, 3);
  assert.match(avisos.join(' '), /no existe/);
  assert.match(avisos.join(' '), /sin nombre/);
  assert.match(avisos.join(' '), /repetido/);
});

test('procesarCsv: la columna opcional «Dirección web» fija el ID aunque cambie el nombre', () => {
  const csv = 'Categoría,Producto,Dirección web\nGas y GLP,Regulador Unkar R30 (nuevo nombre),Regulador Unkar R30\nGas y GLP,Válvula,\n';
  const { productos } = procesarCsv(csv, categorias);
  assert.deepEqual(productos.map((p) => p.id), ['regulador-unkar-r30', 'valvula']);
});

test('procesarCsv: exige las columnas Categoría y Producto', () => {
  assert.throws(() => procesarCsv('Nombre del producto,Precio\nA,1', categorias), /Categoría/);
});

test('urlDirecta convierte enlaces de Google Drive', () => {
  assert.equal(urlDirecta('https://drive.google.com/file/d/AbC_12-3/view?usp=sharing'), 'https://drive.google.com/uc?export=download&id=AbC_12-3');
  assert.equal(urlDirecta('https://drive.google.com/open?id=XyZ'), 'https://drive.google.com/uc?export=download&id=XyZ');
  assert.equal(urlDirecta('https://ejemplo.com/foto.jpg'), 'https://ejemplo.com/foto.jpg');
});

test('slug: sin tildes ni símbolos', () => {
  assert.equal(slug('Tubería de acero al carbono Schedule 40'), 'tuberia-de-acero-al-carbono-schedule-40');
  assert.equal(slug('Discos de corte de 4,5"'), 'discos-de-corte-de-4-5');
});

test('la hoja local del catálogo usa solo categorías existentes', () => {
  const base = JSON.parse(readFileSync(new URL('../src/data/catalogo.json', import.meta.url), 'utf8')).categorias;
  const { avisos, productos } = procesarCsv(readFileSync(new URL('../src/data/catalogo.csv', import.meta.url), 'utf8'), base);
  assert.deepEqual(avisos, []);
  assert.ok(productos.length > 200);
});
