// Carga los productos del catálogo desde una hoja de cálculo (CSV): Google Sheets publicada
// (CATALOGO_CSV_URL) o, si no está configurada o falla, src/data/catalogo.csv.
// Las filas con errores se omiten con un aviso; nunca detienen la publicación.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';

/** Lector CSV (RFC 4180): comillas, comillas dobles escapadas, saltos de línea dentro de celdas, BOM y CRLF. */
export function parseCsv(texto) {
  const filas = [];
  let fila = [];
  let celda = '';
  let comillas = false;
  const t = texto.replace(/^﻿/, '');
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (comillas) {
      if (c === '"' && t[i + 1] === '"') { celda += '"'; i++; }
      else if (c === '"') comillas = false;
      else celda += c;
    } else if (c === '"') comillas = true;
    else if (c === ',') { fila.push(celda); celda = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && t[i + 1] === '\n') i++;
      fila.push(celda); filas.push(fila); fila = []; celda = '';
    } else celda += c;
  }
  if (celda !== '' || fila.length) { fila.push(celda); filas.push(fila); }
  return filas.filter((f) => f.some((x) => x.trim() !== ''));
}

const clave = (s) => String(s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '');

export const slug = (s) => String(s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);

const limpiar = (s) => String(s ?? '').replace(/[\u0000-\u001F\u007F]/g, ' ').replace(/\s+/g, ' ').trim();

// Encabezados aceptados (sin tildes, mayúsculas ni espacios) → campo interno.
const COLUMNAS = {
  categoria: 'categoria', subcategoria: 'subcategoria', producto: 'nombre', nombre: 'nombre',
  referencia: 'referencia', marca: 'marca', medidaunidad: 'unidad', medida: 'unidad', unidad: 'unidad',
  descripcion: 'descripcion', imagen: 'imagen', foto: 'imagen', publicar: 'publicar',
};
const MAX_FILAS = 5000;
const DESCRIPCION_POR_DEFECTO = 'Consulte medidas, referencias y disponibilidad con un asesor.';

/**
 * Convierte el texto CSV en productos y completa las subcategorías de cada categoría.
 * Devuelve { categorias, productos, avisos }.
 */
export function procesarCsv(texto, categoriasBase) {
  const avisos = [];
  const filas = parseCsv(texto);
  if (!filas.length) throw new Error('La hoja del catálogo está vacía.');
  const encabezados = filas[0].map((h) => COLUMNAS[clave(h)] || null);
  for (const requerida of ['categoria', 'nombre']) {
    if (!encabezados.includes(requerida)) throw new Error(`Falta la columna "${requerida === 'nombre' ? 'Producto' : 'Categoría'}" en la hoja del catálogo.`);
  }

  const categorias = categoriasBase.map((c) => ({ ...c, subcategorias: [] }));
  const porClave = new Map();
  for (const c of categorias) { porClave.set(clave(c.nombre), c); porClave.set(clave(c.slug), c); }

  const productos = [];
  const ids = new Set();
  filas.slice(1, MAX_FILAS + 1).forEach((fila, i) => {
    const n = i + 2; // número de fila tal como se ve en la hoja
    const r = {};
    encabezados.forEach((campo, j) => { if (campo) r[campo] = limpiar(fila[j]); });
    if (/^no$/i.test(r.publicar || '')) return;
    if (!r.nombre) { avisos.push(`Fila ${n}: sin nombre de producto; se omite.`); return; }
    const cat = porClave.get(clave(r.categoria));
    if (!cat) { avisos.push(`Fila ${n} («${r.nombre}»): la categoría «${r.categoria}» no existe; se omite.`); return; }

    const subNombre = r.subcategoria || 'General';
    let sub = cat.subcategorias.find((s) => clave(s.nombre) === clave(subNombre));
    if (!sub) { sub = { slug: slug(subNombre) || 'general', nombre: subNombre }; cat.subcategorias.push(sub); }

    let id = slug(r.nombre) || `producto-${n}`;
    if (ids.has(id)) { avisos.push(`Fila ${n}: «${r.nombre}» está repetido; se publica con otra dirección.`); id = `${id}-${n}`; }
    ids.add(id);

    productos.push({
      id,
      nombre: r.nombre.slice(0, 150),
      categoria: cat.slug,
      subcategoria: sub.slug,
      descripcion: (r.descripcion || DESCRIPCION_POR_DEFECTO).slice(0, 600),
      referencia: r.referencia || null,
      marca: r.marca || null,
      unidad: r.unidad || null,
      imagenOrigen: r.imagen || null,
    });
  });
  if (filas.length - 1 > MAX_FILAS) avisos.push(`La hoja tiene más de ${MAX_FILAS} filas; se leyeron las primeras ${MAX_FILAS}.`);
  return { categorias: categorias.filter((c) => c.subcategorias.length), productos, avisos };
}

/** Enlaces de Google Drive "compartir" → descarga directa. */
export function urlDirecta(url) {
  const m = url.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?(?:export=\w+&)?id=)([\w-]+)/);
  return m ? `https://drive.google.com/uc?export=download&id=${m[1]}` : url;
}

const TIPOS_IMAGEN = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/avif': 'avif', 'image/gif': 'gif' };

/** Descarga las fotos externas al sitio (la CSP solo permite imágenes propias). Si una falla, el producto queda sin foto. */
export async function descargarImagenes(productos, dist, avisos) {
  const carpeta = join(dist, 'assets', 'img', 'productos');
  await mkdir(carpeta, { recursive: true });
  for (const p of productos) {
    const origen = p.imagenOrigen;
    delete p.imagenOrigen;
    if (!origen) continue;
    if (origen.startsWith('/assets/')) { p.imagen = origen; continue; }
    if (!/^https:\/\//.test(origen)) { avisos.push(`«${p.nombre}»: la imagen debe ser un enlace https://; se omite.`); continue; }
    try {
      const r = await fetch(urlDirecta(origen), { signal: AbortSignal.timeout(20000) });
      const tipo = (r.headers.get('content-type') || '').split(';')[0].trim();
      if (!r.ok || !TIPOS_IMAGEN[tipo]) throw new Error(r.ok ? `no es una imagen (${tipo || 'tipo desconocido'})` : `respuesta ${r.status}`);
      const datos = Buffer.from(await r.arrayBuffer());
      if (datos.length > 5 * 1024 * 1024) throw new Error('pesa más de 5 MB');
      const archivo = `${p.id}.${TIPOS_IMAGEN[tipo]}`;
      await writeFile(join(carpeta, archivo), datos);
      p.imagen = `/assets/img/productos/${archivo}`;
      p.imagenAlt = p.nombre;
    } catch (err) {
      avisos.push(`«${p.nombre}»: no se pudo descargar la imagen (${err.message}); se publica sin foto.`);
    }
  }
}

/** Lee la hoja (URL publicada o archivo local) y devuelve el catálogo listo para las plantillas. */
export async function cargarCatalogo(categoriasBase, { url = process.env.CATALOGO_CSV_URL, archivoLocal }) {
  const avisos = [];
  let texto;
  let origen = 'archivo local src/data/catalogo.csv';
  if (url) {
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(30000) });
      if (!r.ok) throw new Error(`respuesta ${r.status}`);
      texto = await r.text();
      if (/^\s*<(!doctype|html)/i.test(texto)) throw new Error('la dirección no devuelve CSV (¿la hoja está publicada como CSV?)');
      origen = 'Google Sheets';
    } catch (err) {
      avisos.push(`No se pudo leer la hoja publicada (${err.message}); se usa la copia local.`);
      texto = undefined;
    }
  }
  texto ??= await readFile(archivoLocal, 'utf8');
  const resultado = procesarCsv(texto, categoriasBase);
  return { ...resultado, avisos: [...avisos, ...resultado.avisos], origen };
}
