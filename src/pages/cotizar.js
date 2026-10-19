import { html, raw, jsonScript } from '../templates/html.js';
import { icono } from '../templates/icons.js';
import { rutas, enlaceWhatsapp } from '../templates/rutas.js';
import { cabeceraPagina, migas } from '../templates/componentes.js';

export const UNIDADES = ['Unidad', 'Metro', 'Tubo', 'Kilogramo', 'Lámina', 'Caja', 'Paquete', 'Rollo', 'Par', 'Juego', 'Servicio', 'Otra'];

function campo({ id, etiqueta, tipo = 'text', requerido = false, ayuda, attrs = '', ancho = '' }) {
  return html`<div class="field${ancho ? ` field--${ancho}` : ''}">
  <label for="${id}">${etiqueta}${requerido ? html` <span class="req" aria-hidden="true">*</span>` : html` <span class="opt">(opcional)</span>`}</label>
  <input id="${id}" name="${id}" type="${tipo}"${requerido ? html` required aria-required="true"` : ''} ${raw(attrs)} aria-describedby="${ayuda ? `${id}-ayuda ` : ''}${id}-error">
  ${ayuda ? html`<p class="field__help" id="${id}-ayuda">${ayuda}</p>` : ''}
  <p class="field__error" id="${id}-error" data-error-para="${id}"></p>
</div>`;
}

function filaProducto(n) {
  return html`<div class="item-row" data-item-row>
  <p class="item-row__num" aria-hidden="true" data-item-num>${n}</p>
  <div class="field item-row__producto">
    <label for="producto_${n}" data-label-for="producto">Producto o servicio <span class="req" aria-hidden="true">*</span></label>
    <input id="producto_${n}" name="producto_${n}" data-campo="producto" type="text" list="lista-productos" maxlength="150" required aria-required="true" aria-describedby="producto_${n}-error" placeholder="Ej.: Tubería galvanizada">
    <p class="field__error" id="producto_${n}-error"></p>
  </div>
  <div class="field item-row__ref">
    <label for="referencia_${n}" data-label-for="referencia">Referencia o medida</label>
    <input id="referencia_${n}" name="referencia_${n}" data-campo="referencia" type="text" maxlength="120" placeholder="Ej.: 1/2&quot;, clase 40">
  </div>
  <div class="field item-row__cant">
    <label for="cantidad_${n}" data-label-for="cantidad">Cantidad <span class="req" aria-hidden="true">*</span></label>
    <input id="cantidad_${n}" name="cantidad_${n}" data-campo="cantidad" type="number" inputmode="decimal" min="0.01" step="any" max="100000" required aria-required="true" aria-describedby="cantidad_${n}-error" value="1">
    <p class="field__error" id="cantidad_${n}-error"></p>
  </div>
  <div class="field item-row__unidad">
    <label for="unidad_${n}" data-label-for="unidad">Unidad</label>
    <select id="unidad_${n}" name="unidad_${n}" data-campo="unidad">${UNIDADES.map((u) => html`<option>${u}</option>`)}</select>
  </div>
  <button type="button" class="icon-btn item-row__remove" data-item-eliminar>${icono('eliminar')}<span class="visually-hidden">Eliminar producto <span data-item-num-sr>${n}</span></span></button>
</div>`;
}

export default function cotizar(ctx) {
  const e = ctx.empresa;
  const m = migas(ctx, [{ texto: 'Solicitar cotización', href: rutas.cotizar }]);
  const datos = {
    productos: Object.fromEntries(ctx.catalogo.productos.map((p) => [p.id, { nombre: p.nombre, referencia: p.referencia || '' }])),
    servicios: Object.fromEntries(ctx.servicios.servicios.map((s) => [s.slug, { nombre: `Servicio: ${s.nombre}` }])),
    whatsapp: e.whatsapp.numero,
  };

  const cuerpo = html`
${cabeceraPagina({
  migasHtml: m.visible,
  eyebrow: 'Cotizaciones',
  titulo: 'Solicitar cotización',
  lead: 'Cuéntenos qué productos o servicios necesita. Un asesor revisará la disponibilidad y le responderá con la cotización.',
})}

<section class="section section--tight">
  <div class="container quote">
    <div class="quote__main">
      <form class="form" action="${ctx.formEndpoint}" method="POST" novalidate data-form-cotizacion data-endpoint="${ctx.formEndpoint}">
        <input type="hidden" name="_subject" value="Nueva solicitud de cotización — sitio web">
        <div class="hp" aria-hidden="true"><label for="_gotcha">No llenar este campo</label><input type="text" id="_gotcha" name="_gotcha" tabindex="-1" autocomplete="off"></div>

        <div class="alert alert--error" role="alert" data-form-resumen-errores hidden tabindex="-1"></div>

        <fieldset class="form__section">
          <legend class="form__legend"><span class="form__step">1</span>Datos del solicitante</legend>
          <div class="form__grid">
            ${campo({ id: 'razon_social', etiqueta: 'Nombre o razón social', requerido: true, attrs: 'autocomplete="organization" maxlength="120"' })}
            ${campo({ id: 'nit', etiqueta: 'NIT o documento de identificación', ayuda: 'Útil si necesita factura a nombre de una empresa.', attrs: 'maxlength="20" inputmode="text"' })}
            ${campo({ id: 'contacto', etiqueta: 'Nombre de la persona de contacto', requerido: true, attrs: 'autocomplete="name" maxlength="100"' })}
            ${campo({ id: 'telefono', etiqueta: 'Teléfono o celular', tipo: 'tel', requerido: true, attrs: 'autocomplete="tel" maxlength="20" inputmode="tel"', ayuda: 'Ej.: 315 486 4439' })}
            ${campo({ id: 'email', etiqueta: 'Correo electrónico', tipo: 'email', requerido: true, attrs: 'autocomplete="email" maxlength="150"', ayuda: 'Le enviaremos la cotización a este correo.' })}
            ${campo({ id: 'ciudad', etiqueta: 'Ciudad', attrs: 'autocomplete="address-level2" maxlength="60" value="Pasto"' })}
          </div>
        </fieldset>

        <fieldset class="form__section">
          <legend class="form__legend"><span class="form__step">2</span>Productos o servicios</legend>
          <p class="form__intro">Agregue una fila por producto. Si conoce la referencia, el diámetro o la medida, inclúyalos.</p>
          <div class="items" data-items>
            ${filaProducto(1)}
          </div>
          <template data-item-template>${filaProducto('__N__')}</template>
          <div class="items__footer">
            <button type="button" class="btn btn--outline btn--sm" data-item-agregar>${icono('mas')}Agregar otro producto</button>
            <p class="items__count" data-items-contador aria-live="polite"></p>
          </div>
          <datalist id="lista-productos">
            ${ctx.catalogo.productos.map((p) => html`<option value="${p.nombre}"></option>`)}
            ${ctx.servicios.servicios.map((s) => html`<option value="Servicio: ${s.nombre}"></option>`)}
          </datalist>
        </fieldset>

        <fieldset class="form__section">
          <legend class="form__legend"><span class="form__step">3</span>Información adicional</legend>
          <div class="form__grid">
            <div class="field field--full">
              <label for="descripcion">Descripción adicional <span class="opt">(opcional)</span></label>
              <textarea id="descripcion" name="descripcion" rows="4" maxlength="2000" placeholder="Uso previsto, material, presión de trabajo, si requiere roscado, ranurado o corte…"></textarea>
            </div>
            <div class="field field--full">
              <label for="observaciones">Observaciones <span class="opt">(opcional)</span></label>
              <textarea id="observaciones" name="observaciones" rows="3" maxlength="1000" placeholder="Fecha en que necesita el material, marca de preferencia…"></textarea>
            </div>
          </div>
        </fieldset>

        <div class="form__consent field">
          <div class="checkbox">
            <input type="checkbox" id="consentimiento" name="consentimiento" value="Sí" required aria-required="true" aria-describedby="consentimiento-error">
            <label for="consentimiento">Autorizo a Ferretería Fátima a tratar mis datos personales para responder esta solicitud, según la <a href="${rutas.privacidad}" target="_blank">Política de privacidad y tratamiento de datos</a>. <span class="req" aria-hidden="true">*</span></label>
          </div>
          <p class="field__error" id="consentimiento-error" data-error-para="consentimiento"></p>
        </div>

        <p class="note">${icono('info')}Esta solicitud no es una cotización oficial. Los precios, la disponibilidad y las condiciones se confirman cuando un asesor revisa su pedido y le responde.</p>

        <div class="form__actions">
          <button type="submit" class="btn btn--primary btn--lg" data-enviar>
            <span class="btn__label">${icono('documento')}Enviar solicitud</span>
            <span class="btn__loading" aria-hidden="true"><span class="spinner"></span>Enviando…</span>
          </button>
          <button type="button" class="btn btn--whatsapp btn--lg" data-enviar-whatsapp>${icono('whatsapp')}Enviar por WhatsApp</button>
        </div>
        <p class="form__hint">Los campos marcados con <span class="req">*</span> son obligatorios. Para enviar por WhatsApp no es necesario el correo.</p>
      </form>

      <div class="form-result" data-form-exito hidden tabindex="-1">
        <div class="form-result__icon">${icono('check')}</div>
        <h2 class="form-result__title">Recibimos su solicitud</h2>
        <p>Código de su solicitud: <strong data-codigo-solicitud></strong>. Un asesor revisará los productos y le responderá al correo o teléfono que indicó, en el horario de atención.</p>
        <p class="muted">Recuerde que esta solicitud no constituye una cotización oficial hasta que reciba nuestra respuesta.</p>
        <div class="form-result__actions">
          <a class="btn btn--primary" href="${rutas.productos}">Seguir explorando productos</a>
          <a class="btn btn--whatsapp" href="${enlaceWhatsapp(e.whatsapp.numero)}" target="_blank" rel="noopener" data-exito-whatsapp>${icono('whatsapp')}Avisar por WhatsApp</a>
        </div>
      </div>
    </div>

    <aside class="quote__aside" aria-label="Información sobre la solicitud">
      <div class="aside-card">
        <h2 class="aside-card__title">Cómo funciona</h2>
        <ol class="mini-steps">
          <li><strong>Envíe su lista</strong> por el formulario o por WhatsApp.</li>
          <li><strong>Revisamos</strong> referencias, disponibilidad y condiciones.</li>
          <li><strong>Le respondemos</strong> con la cotización formal y su vigencia.</li>
        </ol>
      </div>
      <div class="aside-card aside-card--navy">
        <h2 class="aside-card__title">¿Prefiere hablar con un asesor?</h2>
        <p>Atención en horario comercial.</p>
        <a class="btn btn--whatsapp btn--block" href="${enlaceWhatsapp(e.whatsapp.numero, 'Hola, Ferretería Fátima. Quisiera solicitar una cotización.')}" target="_blank" rel="noopener">${icono('whatsapp')}${e.whatsapp.visible}</a>
        <a class="btn btn--ghost-light btn--block" href="tel:${e.telefonos.celular.e164}">${icono('telefono')}Llamar al ${e.telefonos.celular.visible}</a>
        <p class="aside-card__small">${e.horario.map((h) => html`${h.dias}: ${h.horas}<br>`)}</p>
      </div>
      <div class="aside-card">
        <h2 class="aside-card__title">Consejos para una cotización precisa</h2>
        <ul class="dot-list">
          <li>Indique material, diámetro y clase de la tubería.</li>
          <li>Para válvulas y accesorios, el tipo de conexión.</li>
          <li>Si requiere roscado, ranurado o corte, inclúyalo como un producto más.</li>
        </ul>
      </div>
    </aside>
  </div>
</section>
${jsonScript(datos, { id: 'datos-cotizacion' })}`;

  return [{
    ruta: rutas.cotizar,
    seccion: 'cotizar',
    titulo: 'Solicitar cotización de materiales industriales',
    descripcion: 'Solicite la cotización de tubería, válvulas, accesorios, aceros, herramientas y servicios de roscado, ranurado y corte en Ferretería Fátima, Pasto.',
    scripts: ['cotizar.js'],
    sinWhatsappFlotante: true,
    jsonLd: [m.jsonLd],
    cuerpo,
  }];
}
