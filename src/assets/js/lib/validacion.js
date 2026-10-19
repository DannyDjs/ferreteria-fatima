// Validaciones de formularios. Funciones puras: devuelven un mensaje de error o '' si el valor es válido.

export const limpiar = (valor) => String(valor ?? '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim();

export function requerido(valor, nombre = 'Este campo') {
  return limpiar(valor) ? '' : `${nombre} es obligatorio.`;
}

export function correo(valor) {
  const v = limpiar(valor);
  if (!v) return 'Escriba su correo electrónico.';
  if (v.length > 150 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return 'Escriba un correo válido, por ejemplo nombre@empresa.com.';
  return '';
}

/** Teléfono colombiano: 7 a 10 dígitos, admite +57, espacios, guiones, puntos y paréntesis. */
export function telefono(valor, { obligatorio = true } = {}) {
  const v = limpiar(valor);
  if (!v) return obligatorio ? 'Escriba un teléfono de contacto.' : '';
  if (!/^[+\d\s().-]+$/.test(v)) return 'El teléfono solo puede tener números, espacios y los signos + - ( ).';
  const digitos = v.replace(/\D/g, '').replace(/^57(?=\d{10}$)/, '');
  if (digitos.length < 7 || digitos.length > 10) return 'Escriba un teléfono de 7 a 10 dígitos (por ejemplo, 315 486 4439).';
  return '';
}

/** NIT o documento: opcional; números con puntos y guion de verificación opcionales. */
export function documento(valor) {
  const v = limpiar(valor);
  if (!v) return '';
  if (!/^[\dA-Za-z.\s-]{5,20}$/.test(v)) return 'Escriba el NIT o documento solo con números, puntos o guion (por ejemplo, 900.123.456-7).';
  return '';
}

export function cantidad(valor) {
  const v = limpiar(valor).replace(',', '.');
  if (!v) return 'Indique la cantidad.';
  const n = Number(v);
  if (!Number.isFinite(n) || n <= 0) return 'La cantidad debe ser mayor que cero.';
  if (n > 100000) return 'La cantidad es demasiado alta; si es correcta, indíquela en la descripción.';
  return '';
}

export function longitudMaxima(valor, max, nombre = 'El texto') {
  return limpiar(valor).length > max ? `${nombre} admite máximo ${max} caracteres.` : '';
}
