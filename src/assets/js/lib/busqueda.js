// Búsqueda del catálogo sin distinguir mayúsculas ni tildes (funciones puras).

export function normalizar(texto) {
  return String(texto ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9ñ"/.\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Palabras que no aportan a la búsqueda.
const VACIAS = new Set(['de', 'del', 'la', 'el', 'los', 'las', 'para', 'y', 'en', 'con', 'por', 'un', 'una']);

/** Reduce plurales simples en español para que "valvula" encuentre "válvulas" y viceversa. */
function raiz(palabra) {
  if (palabra.length > 4 && palabra.endsWith('es')) return palabra.slice(0, -2);
  if (palabra.length > 3 && palabra.endsWith('s')) return palabra.slice(0, -1);
  return palabra;
}

export function terminos(consulta) {
  return normalizar(consulta).split(' ').filter((t) => t && !VACIAS.has(t)).map(raiz);
}

/** Puntaje de relevancia: 2 si todos los términos están en el nombre, 1 si están en el texto completo, 0 si no coincide. */
export function puntaje(nombre, textoProducto, consulta) {
  if (!coincide(textoProducto, consulta)) return 0;
  return coincide(nombre, consulta) ? 2 : 1;
}

/** true si todos los términos de la consulta aparecen en el texto del producto. */
export function coincide(textoProducto, consulta) {
  const ts = terminos(consulta);
  if (!ts.length) return true;
  const texto = normalizar(textoProducto);
  return ts.every((t) => texto.includes(t));
}
