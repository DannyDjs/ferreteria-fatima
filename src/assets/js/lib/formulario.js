// Utilidades compartidas por los formularios: errores accesibles, envío y antispam.

export function errorDe(input) {
  return document.getElementById(`${input.id}-error`);
}

export function marcarError(input, mensaje) {
  const el = errorDe(input);
  if (mensaje) {
    input.setAttribute('aria-invalid', 'true');
    if (el) el.textContent = mensaje;
  } else {
    input.removeAttribute('aria-invalid');
    if (el) el.textContent = '';
  }
}

export function limpiarErrores(form) {
  form.querySelectorAll('[aria-invalid]').forEach((i) => marcarError(i, ''));
  const resumen = form.querySelector('[data-form-resumen-errores]');
  if (resumen) { resumen.hidden = true; resumen.textContent = ''; }
}

/** Muestra el resumen de errores con enlaces a cada campo y lleva el foco al primero. */
export function mostrarResumen(form, errores) {
  const resumen = form.querySelector('[data-form-resumen-errores]');
  if (!resumen) { errores[0]?.input.focus(); return; }
  resumen.textContent = '';
  const titulo = document.createElement('p');
  titulo.innerHTML = `<strong>Revise ${errores.length === 1 ? 'el siguiente campo' : `los siguientes ${errores.length} campos`}:</strong>`;
  const lista = document.createElement('ul');
  for (const { input, mensaje } of errores) {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = `#${input.id}`;
    a.textContent = mensaje;
    a.addEventListener('click', (e) => { e.preventDefault(); input.focus(); });
    li.append(a);
    lista.append(li);
  }
  resumen.append(titulo, lista);
  resumen.hidden = false;
  resumen.focus();
}

/** Muestra un error general (por ejemplo, de red) en el recuadro de alerta del formulario. */
export function mostrarAlerta(form, nodos) {
  const resumen = form.querySelector('[data-form-resumen-errores]');
  resumen.textContent = '';
  resumen.append(...nodos);
  resumen.hidden = false;
  resumen.focus();
}

export function estadoCargando(boton, cargando) {
  boton.classList.toggle('is-loading', cargando);
  boton.disabled = cargando;
  boton.setAttribute('aria-busy', String(cargando));
}

export function generarCodigo(fecha = new Date()) {
  const f = `${String(fecha.getFullYear()).slice(2)}${String(fecha.getMonth() + 1).padStart(2, '0')}${String(fecha.getDate()).padStart(2, '0')}`;
  const aleatorio = Math.random().toString(36).slice(2, 6).toUpperCase().padEnd(4, '0');
  return `SOL-${f}-${aleatorio}`;
}

/** Antispam básico: campo trampa lleno o envío en menos de 3 segundos desde que cargó la página. */
export function pareceSpam(form, cargadoEn) {
  const trampa = form.querySelector('[name="_gotcha"]');
  return Boolean(trampa && trampa.value) || Date.now() - cargadoEn < 3000;
}

/**
 * Envía los datos al servicio que recibe las solicitudes y lanza un error legible si falla.
 * Google Apps Script (script.google.com): JSON como texto plano (evita la consulta previa CORS que Apps Script
 * no atiende) y respuesta { ok, error }. Formspree: JSON normal.
 */
export async function enviar(endpoint, datos, { tiempoMaximo = 20000 } = {}) {
  const appsScript = /^https:\/\/script\.google\.com\//.test(endpoint);
  const control = new AbortController();
  const temporizador = setTimeout(() => control.abort(), tiempoMaximo);
  let respuesta;
  try {
    respuesta = await fetch(endpoint, {
      method: 'POST',
      headers: appsScript ? { 'Content-Type': 'text/plain;charset=utf-8' } : { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(datos),
      signal: control.signal,
    });
  } catch (err) {
    throw new Error(err.name === 'AbortError'
      ? 'El servidor tardó demasiado en responder.'
      : 'No hay conexión con el servidor. Revise su conexión a internet.');
  } finally {
    clearTimeout(temporizador);
  }
  if (!respuesta.ok) {
    let detalle = '';
    try {
      const cuerpo = await respuesta.json();
      detalle = (cuerpo.errors || []).map((e) => e.message).join(' ');
    } catch { /* respuesta sin JSON */ }
    throw new Error(detalle || `El servicio de formularios respondió con un error (${respuesta.status}).`);
  }
  if (appsScript) {
    let cuerpo;
    try { cuerpo = await respuesta.json(); } catch { throw new Error('El servicio de formularios dio una respuesta inesperada.'); }
    if (!cuerpo.ok) throw new Error(cuerpo.error || 'El servicio de formularios rechazó la solicitud.');
  }
  return true;
}
