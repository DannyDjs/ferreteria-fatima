// Construcción de mensajes y enlaces de WhatsApp (funciones puras).

export function urlWhatsapp(numero, texto = '') {
  const limpio = String(numero).replace(/\D/g, '');
  return `https://wa.me/${limpio}${texto ? `?text=${encodeURIComponent(texto)}` : ''}`;
}

function formatoCantidad(valor) {
  const n = Number(String(valor).replace(',', '.'));
  return Number.isFinite(n) ? n.toLocaleString('es-CO', { maximumFractionDigits: 3 }) : String(valor);
}

/** Texto de una línea de producto: "1. Tubería galvanizada — Ref.: 1/2" — 3 Tubo" */
export function lineaItem(item, indice) {
  const ref = item.referencia ? ` — Ref./medida: ${item.referencia}` : '';
  return `${indice + 1}. ${item.producto}${ref} — Cantidad: ${formatoCantidad(item.cantidad)} ${item.unidad || ''}`.trim();
}

/** Mensaje organizado para solicitar una cotización por WhatsApp. */
export function mensajeCotizacion(datos) {
  const l = ['Hola, Ferretería Fátima. Quiero solicitar una cotización.', ''];
  if (datos.codigo) l.push(`Código de solicitud: ${datos.codigo}`, '');
  l.push('*Datos del solicitante*');
  l.push(`Nombre o razón social: ${datos.razon_social}`);
  if (datos.nit) l.push(`NIT/documento: ${datos.nit}`);
  l.push(`Contacto: ${datos.contacto}`);
  l.push(`Teléfono: ${datos.telefono}`);
  if (datos.email) l.push(`Correo: ${datos.email}`);
  if (datos.ciudad) l.push(`Ciudad: ${datos.ciudad}`);
  l.push('', '*Productos o servicios*');
  datos.items.forEach((it, i) => l.push(lineaItem(it, i)));
  if (datos.descripcion) l.push('', '*Descripción adicional*', datos.descripcion);
  if (datos.observaciones) l.push('', '*Observaciones*', datos.observaciones);
  return l.join('\n');
}
