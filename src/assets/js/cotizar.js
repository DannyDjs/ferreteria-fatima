// Formulario de solicitud de cotización: filas dinámicas de productos, validación,
// envío al servicio de formularios y alternativa por WhatsApp.
import { solicitud } from './lib/solicitud.js';
import * as v from './lib/validacion.js';
import { mensajeCotizacion, urlWhatsapp } from './lib/whatsapp.js';
import { marcarError, limpiarErrores, mostrarResumen, mostrarAlerta, estadoCargando, generarCodigo, pareceSpam, enviar } from './lib/formulario.js';

const form = document.querySelector('[data-form-cotizacion]');

if (form) {
  const cargadoEn = Date.now();
  const datos = JSON.parse(document.getElementById('datos-cotizacion').textContent);
  const contenedor = form.querySelector('[data-items]');
  const plantilla = form.querySelector('[data-item-template]');
  const contador = form.querySelector('[data-items-contador]');
  const botonAgregar = form.querySelector('[data-item-agregar]');
  const botonEnviar = form.querySelector('[data-enviar]');
  const botonWhatsapp = form.querySelector('[data-enviar-whatsapp]');
  const exito = document.querySelector('[data-form-exito]');
  const MAX_FILAS = 30;
  let codigo = generarCodigo();

  const filas = () => [...contenedor.querySelectorAll('[data-item-row]')];
  const campo = (fila, nombre) => fila.querySelector(`[data-campo="${nombre}"]`);

  /** Mantiene ids, names, etiquetas y textos accesibles coherentes con el número de fila. */
  function renumerar() {
    filas().forEach((fila, i) => {
      const n = i + 1;
      fila.querySelector('[data-item-num]').textContent = n;
      fila.querySelector('[data-item-num-sr]').textContent = n;
      for (const nombre of ['producto', 'referencia', 'cantidad', 'unidad']) {
        const input = campo(fila, nombre);
        input.id = input.name = `${nombre}_${n}`;
        fila.querySelector(`[data-label-for="${nombre}"]`).htmlFor = input.id;
        const error = input.parentElement.querySelector('.field__error');
        if (error) { error.id = `${input.id}-error`; input.setAttribute('aria-describedby', error.id); }
      }
    });
    const total = filas().length;
    filas().forEach((f) => { f.querySelector('[data-item-eliminar]').disabled = total === 1; });
    botonAgregar.disabled = total >= MAX_FILAS;
    contador.textContent = `${total} ${total === 1 ? 'producto' : 'productos'} en la solicitud${total >= MAX_FILAS ? ' (máximo alcanzado)' : ''}`;
  }

  function nuevaFila({ producto = '', referencia = '', unidad = '', idSolicitud = '' } = {}) {
    let fila = filas().find((f) => !campo(f, 'producto').value.trim());
    if (!fila) {
      if (filas().length >= MAX_FILAS) return null;
      const html = plantilla.innerHTML.replaceAll('__N__', String(filas().length + 1));
      contenedor.insertAdjacentHTML('beforeend', html);
      fila = filas().at(-1);
    }
    campo(fila, 'producto').value = producto;
    campo(fila, 'referencia').value = referencia;
    if (unidad) campo(fila, 'unidad').value = unidad;
    if (idSolicitud) fila.dataset.solicitudId = idSolicitud;
    return fila;
  }

  botonAgregar.addEventListener('click', () => {
    const fila = nuevaFila();
    renumerar();
    campo(fila, 'producto').focus();
  });

  contenedor.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-item-eliminar]');
    if (!btn || btn.disabled) return;
    const fila = btn.closest('[data-item-row]');
    const indice = filas().indexOf(fila);
    if (fila.dataset.solicitudId) solicitud.quitar(fila.dataset.solicitudId);
    fila.remove();
    renumerar();
    const destino = filas()[Math.max(0, indice - 1)];
    campo(destino, 'producto').focus();
  });

  // Validación al salir de cada campo (después del primer intento o si ya tenía error).
  const validadores = {
    razon_social: (x) => v.requerido(x, 'El nombre o la razón social'),
    contacto: (x) => v.requerido(x, 'El nombre de contacto'),
    telefono: (x) => v.telefono(x),
    email: (x) => v.correo(x),
    nit: (x) => v.documento(x),
  };
  form.addEventListener('focusout', (e) => {
    const input = e.target;
    if (!(input instanceof HTMLInputElement) || input.getAttribute('aria-invalid') !== 'true') return;
    const regla = validadores[input.name] || (input.dataset.campo === 'producto' ? (x) => v.requerido(x, 'El producto') : input.dataset.campo === 'cantidad' ? v.cantidad : null);
    if (regla) marcarError(input, regla(input.value));
  });

  function validar({ correoObligatorio }) {
    limpiarErrores(form);
    const errores = [];
    const revisar = (input, mensaje) => { if (mensaje) { marcarError(input, mensaje); errores.push({ input, mensaje }); } };
    for (const [nombre, regla] of Object.entries(validadores)) {
      const input = form.elements[nombre];
      if (nombre === 'email' && !correoObligatorio && !input.value.trim()) continue;
      revisar(input, regla(input.value));
    }
    filas().forEach((fila, i) => {
      revisar(campo(fila, 'producto'), v.requerido(campo(fila, 'producto').value) && `Producto ${i + 1}: escriba el nombre del producto o servicio.`);
      const msjCant = v.cantidad(campo(fila, 'cantidad').value);
      revisar(campo(fila, 'cantidad'), msjCant && `Producto ${i + 1}: ${msjCant.charAt(0).toLowerCase()}${msjCant.slice(1)}`);
    });
    revisar(form.elements.consentimiento, form.elements.consentimiento.checked ? '' : 'Debe autorizar el tratamiento de datos para enviar la solicitud.');
    if (errores.length) mostrarResumen(form, errores);
    return errores.length === 0;
  }

  function recolectar() {
    const val = (n) => v.limpiar(form.elements[n].value);
    return {
      codigo,
      razon_social: val('razon_social'),
      nit: val('nit'),
      contacto: val('contacto'),
      telefono: val('telefono'),
      email: val('email'),
      ciudad: val('ciudad'),
      descripcion: val('descripcion'),
      observaciones: val('observaciones'),
      items: filas().map((f) => ({
        producto: v.limpiar(campo(f, 'producto').value),
        referencia: v.limpiar(campo(f, 'referencia').value),
        cantidad: v.limpiar(campo(f, 'cantidad').value).replace(',', '.'),
        unidad: campo(f, 'unidad').value,
      })),
    };
  }

  function abrirWhatsapp(d) {
    const enlace = document.createElement('a');
    enlace.href = urlWhatsapp(datos.whatsapp, mensajeCotizacion(d));
    enlace.target = '_blank';
    enlace.rel = 'noopener';
    enlace.click();
  }

  botonWhatsapp.addEventListener('click', () => {
    if (!validar({ correoObligatorio: false })) return;
    abrirWhatsapp(recolectar());
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (botonEnviar.disabled) return;
    if (!validar({ correoObligatorio: true })) return;
    const d = recolectar();

    if (pareceSpam(form, cargadoEn)) {
      // No se envía nada; se muestra el mismo mensaje de éxito para no orientar a los robots.
      mostrarExito(d);
      return;
    }

    estadoCargando(botonEnviar, true);
    botonWhatsapp.disabled = true;
    try {
      await enviar(form.dataset.endpoint, {
        _subject: `Solicitud de cotización ${d.codigo} — ${d.razon_social}`,
        codigo_solicitud: d.codigo,
        razon_social: d.razon_social,
        nit_documento: d.nit || 'No indicado',
        contacto: d.contacto,
        telefono: d.telefono,
        email: d.email,
        ciudad: d.ciudad || 'No indicada',
        productos: d.items.map((it, i) => `${i + 1}. ${it.producto}${it.referencia ? ` | Ref./medida: ${it.referencia}` : ''} | Cantidad: ${it.cantidad} ${it.unidad}`).join('\n'),
        numero_de_productos: d.items.length,
        descripcion: d.descripcion || '—',
        observaciones: d.observaciones || '—',
        autoriza_tratamiento_datos: `Sí (${new Date().toISOString()})`,
        origen: location.href,
        _gotcha: form.querySelector('[name="_gotcha"]')?.value || '',
      });
      solicitud.vaciar();
      mostrarExito(d);
    } catch (err) {
      const p1 = document.createElement('p');
      p1.innerHTML = '<strong>No pudimos enviar su solicitud.</strong> ';
      p1.append(err.message);
      const p2 = document.createElement('p');
      p2.textContent = 'Sus datos siguen en el formulario. Puede intentarlo de nuevo o enviar la solicitud por WhatsApp.';
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn btn--whatsapp btn--sm';
      btn.textContent = 'Enviar por WhatsApp';
      btn.addEventListener('click', () => abrirWhatsapp(d));
      mostrarAlerta(form, [p1, p2, btn]);
    } finally {
      estadoCargando(botonEnviar, false);
      botonWhatsapp.disabled = false;
    }
  });

  function mostrarExito(d) {
    exito.querySelector('[data-codigo-solicitud]').textContent = d.codigo;
    exito.querySelector('[data-exito-whatsapp]').href = urlWhatsapp(datos.whatsapp, `Hola, Ferretería Fátima. Envié la solicitud de cotización ${d.codigo} desde la página web a nombre de ${d.razon_social}.`);
    form.hidden = true;
    exito.hidden = false;
    exito.focus();
    exito.scrollIntoView({ block: 'start' });
    codigo = generarCodigo();
  }

  /* ---------- Prellenado: lista guardada, ?agregar=id y ?servicio=slug ---------- */
  for (const it of solicitud.items()) {
    nuevaFila({ producto: it.nombre, referencia: it.referencia, idSolicitud: it.id });
  }
  const params = new URLSearchParams(location.search);
  const agregar = params.get('agregar');
  if (agregar && datos.productos[agregar] && !solicitud.tiene(agregar)) {
    const p = datos.productos[agregar];
    solicitud.agregar({ id: agregar, nombre: p.nombre, referencia: p.referencia });
    nuevaFila({ producto: p.nombre, referencia: p.referencia, idSolicitud: agregar });
  }
  const libre = v.limpiar(params.get('producto') || '').slice(0, 150);
  if (libre) nuevaFila({ producto: libre });
  const servicio = params.get('servicio');
  if (servicio && datos.servicios[servicio]) {
    nuevaFila({ producto: datos.servicios[servicio].nombre, unidad: 'Servicio' });
  }
  renumerar();
}
