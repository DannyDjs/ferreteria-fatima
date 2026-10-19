// Plantillas HTML seguras: todo valor interpolado se escapa salvo que se marque con raw().

const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export function esc(valor) {
  return String(valor ?? '').replace(/[&<>"']/g, (c) => ESCAPES[c]);
}

class Raw {
  constructor(valor) { this.valor = valor; }
  toString() { return this.valor; }
}

export const raw = (valor) => new Raw(String(valor ?? ''));

function render(valor) {
  if (valor == null || valor === false) return '';
  if (valor instanceof Raw) return valor.valor;
  if (Array.isArray(valor)) return valor.map(render).join('');
  return esc(valor);
}

/** Etiqueta de plantilla: html`<p>${texto}</p>` devuelve un Raw ya escapado. */
export function html(partes, ...valores) {
  let salida = partes[0];
  valores.forEach((v, i) => { salida += render(v) + partes[i + 1]; });
  return raw(salida);
}

/** Convierte un objeto JSON en un bloque <script type="application/json|ld+json"> seguro. */
export function jsonScript(datos, { id, tipo = 'application/json' } = {}) {
  const json = JSON.stringify(datos).replace(/</g, '\\u003c');
  return raw(`<script type="${tipo}"${id ? ` id="${esc(id)}"` : ''}>${json}</script>`);
}
