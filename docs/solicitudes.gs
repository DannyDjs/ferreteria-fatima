/**
 * Recepción de solicitudes de cotización de la página de Ferretería Fátima (reemplaza a Formspree).
 * Instalación: docs/solicitudes-google.md.
 *
 * Cada solicitud:
 *  1. se valida de nuevo aquí (no se confía solo en la validación de la página),
 *  2. se guarda como una fila en la pestaña «Solicitudes» de la hoja que contiene este script,
 *  3. se envía por correo a la ferretería (propiedad CORREO_DESTINO, o la cuenta dueña del script),
 *     con «Responder» dirigido al correo del cliente.
 */

const HOJA = 'Solicitudes';
const COLUMNAS = ['Fecha', 'Código', 'Nombre o razón social', 'NIT / documento', 'Contacto', 'Teléfono', 'Correo',
  'Ciudad', 'Productos', 'Descripción', 'Observaciones', 'Autoriza datos', 'Estado'];
const MAX_POR_HORA = 60; // correos por hora; por encima se guarda la solicitud sin enviar correo (protege la cuota de Gmail)

function doPost(e) {
  const formulario = esFormulario(e);
  try {
    const d = leerDatos(e);
    if (d._gotcha) return responder({ ok: true }, formulario); // trampa anti-spam llena: se finge éxito y no se guarda nada
    const error = validar(d);
    if (error) return responder({ ok: false, error: error }, formulario);

    // Nunca se rechaza a un cliente por el límite: la solicitud se guarda igual y solo se omite el correo.
    const conCorreo = dentroDelLimite();
    const fila = [new Date(), d.codigo_solicitud, d.razon_social, d.nit_documento, d.contacto, d.telefono, d.email,
      d.ciudad, d.productos, d.descripcion, d.observaciones, d.autoriza_tratamiento_datos,
      conCorreo ? 'Nueva' : 'Nueva (sin correo: límite por hora)'];
    hoja().appendRow(fila.map(celdaSegura));
    if (conCorreo) {
      try {
        enviarCorreo(d);
      } catch (err) {
        // La solicitud ya quedó guardada en la hoja; no se reporta error al cliente para que no la envíe dos veces.
        console.error('No se pudo enviar el correo: ' + err);
      }
    }
    return responder({ ok: true, codigo: d.codigo_solicitud }, formulario);
  } catch (err) {
    console.error(err);
    return responder({ ok: false, error: 'No se pudo registrar la solicitud. Intente de nuevo o escríbanos por WhatsApp.' }, formulario);
  }
}

/** true si llegó como formulario normal (navegador sin JavaScript) y no como JSON desde la página. */
function esFormulario(e) {
  const contenido = e && e.postData && e.postData.contents;
  return !(contenido && e.postData.type !== 'application/x-www-form-urlencoded');
}

/** La página envía JSON como texto plano; sin JavaScript llega como formulario normal (campos producto_1, cantidad_1…). */
function leerDatos(e) {
  let d = {};
  if (!esFormulario(e)) {
    d = JSON.parse(e.postData.contents);
  } else {
    const p = (e && e.parameter) || {};
    const items = [];
    for (let i = 1; i <= 30 && p['producto_' + i]; i++) {
      items.push(i + '. ' + p['producto_' + i] + (p['referencia_' + i] ? ' | Ref./medida: ' + p['referencia_' + i] : '') +
        ' | Cantidad: ' + (p['cantidad_' + i] || '') + ' ' + (p['unidad_' + i] || ''));
    }
    d = {
      razon_social: p.razon_social, nit_documento: p.nit, contacto: p.contacto, telefono: p.telefono, email: p.email,
      ciudad: p.ciudad, productos: items.join('\n'), descripcion: p.descripcion, observaciones: p.observaciones,
      autoriza_tratamiento_datos: p.consentimiento ? 'Sí' : '', _gotcha: p._gotcha,
    };
  }
  const limpio = {};
  Object.keys(d).forEach(function (k) { limpio[k] = String(d[k] == null ? '' : d[k]).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim(); });
  limpio.codigo_solicitud = /^SOL-\d{6}-[A-Z0-9]{4}$/.test(limpio.codigo_solicitud) ? limpio.codigo_solicitud : 'SOL-' + Utilities.getUuid().slice(0, 8).toUpperCase();
  return limpio;
}

function validar(d) {
  const largos = { razon_social: 120, nit_documento: 20, contacto: 100, telefono: 20, email: 150, ciudad: 60, productos: 6000, descripcion: 2000, observaciones: 1000 };
  if (!d.razon_social) return 'Falta el nombre o la razón social.';
  if (!d.contacto) return 'Falta el nombre de contacto.';
  if (!/^[+\d\s().-]{7,20}$/.test(d.telefono) || d.telefono.replace(/\D/g, '').length < 7) return 'El teléfono no es válido.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(d.email)) return 'El correo no es válido.';
  if (!d.productos) return 'La solicitud no tiene productos.';
  if (!d.autoriza_tratamiento_datos) return 'Falta la autorización de tratamiento de datos.';
  for (const campo in largos) {
    if ((d[campo] || '').length > largos[campo]) return 'El campo «' + campo + '» es demasiado largo.';
  }
  return '';
}

/** Evita que un texto que empieza por = + - @ se interprete como fórmula en la hoja. */
function celdaSegura(valor) {
  return typeof valor === 'string' && /^[=+\-@\t\r]/.test(valor) ? "'" + valor : valor;
}

function dentroDelLimite() {
  const cache = CacheService.getScriptCache();
  const clave = 'envios-' + new Date().toISOString().slice(0, 13); // por hora
  const lock = LockService.getScriptLock();
  lock.waitLock(5000);
  try {
    const n = Number(cache.get(clave) || 0) + 1;
    cache.put(clave, String(n), 3700);
    return n <= MAX_POR_HORA;
  } finally {
    lock.releaseLock();
  }
}

function hoja() {
  const libro = SpreadsheetApp.getActiveSpreadsheet();
  let h = libro.getSheetByName(HOJA);
  if (!h) {
    h = libro.insertSheet(HOJA);
    h.appendRow(COLUMNAS);
    h.setFrozenRows(1);
  }
  return h;
}

function enviarCorreo(d) {
  const destino = PropertiesService.getScriptProperties().getProperty('CORREO_DESTINO') || Session.getEffectiveUser().getEmail();
  const cuerpo = [
    'Nueva solicitud de cotización desde la página web.',
    '',
    'Código: ' + d.codigo_solicitud,
    'Nombre o razón social: ' + d.razon_social,
    'NIT / documento: ' + (d.nit_documento || 'No indicado'),
    'Contacto: ' + d.contacto,
    'Teléfono: ' + d.telefono,
    'Correo: ' + d.email,
    'Ciudad: ' + (d.ciudad || 'No indicada'),
    '',
    'PRODUCTOS O SERVICIOS',
    d.productos,
    '',
    'Descripción: ' + (d.descripcion || '—'),
    'Observaciones: ' + (d.observaciones || '—'),
    '',
    'Para responder al cliente, use «Responder» en este correo.',
    'Esta solicitud también quedó guardada en la hoja «' + HOJA + '».',
  ].join('\n');
  MailApp.sendEmail({
    to: destino,
    replyTo: d.email,
    subject: 'Solicitud de cotización ' + d.codigo_solicitud + ' — ' + d.razon_social,
    body: cuerpo,
    name: 'Página web Ferretería Fátima',
  });
}

/** JSON para la página; sin JavaScript, una página legible en lugar de texto JSON. */
function responder(objeto, formulario) {
  if (formulario) {
    const texto = objeto.ok
      ? 'Recibimos su solicitud' + (objeto.codigo ? ' (código ' + objeto.codigo + ')' : '') + '. Un asesor le responderá en el horario de atención.'
      : 'No pudimos registrar su solicitud: ' + objeto.error + ' Vuelva atrás para corregirla.';
    return HtmlService.createHtmlOutput('<p style="font:18px sans-serif;max-width:40em;margin:2em auto">' + escaparHtml(texto) + '</p>')
      .setTitle('Ferretería Fátima');
  }
  return ContentService.createTextOutput(JSON.stringify(objeto)).setMimeType(ContentService.MimeType.JSON);
}

function escaparHtml(s) {
  return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
}
