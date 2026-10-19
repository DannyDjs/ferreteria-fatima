import { html } from '../templates/html.js';
import { icono } from '../templates/icons.js';
import { rutas, enlaceWhatsapp } from '../templates/rutas.js';
import { cabeceraPagina, migas, encabezadoSeccion, bandaCotizacion } from '../templates/componentes.js';

export default function servicios(ctx) {
  const e = ctx.empresa;
  const lista = ctx.servicios.servicios;
  const m = migas(ctx, [{ texto: 'Servicios', href: rutas.servicios }]);

  const cuerpo = html`
${cabeceraPagina({
  migasHtml: m.visible,
  eyebrow: 'Servicios industriales',
  titulo: 'Roscado, ranurado y corte de tubería y materiales',
  lead: 'Prepare la tubería y los materiales de su proyecto en Pasto. Consulte medidas, materiales y condiciones con un asesor antes de solicitar el servicio.',
  acciones: html`<nav class="service-nav" aria-label="Servicios">${lista.map((s) => html`<a class="chip chip--light" href="#${s.slug}">${icono(s.icono)}${s.nombre}</a>`)}</nav>`,
})}

<div class="services">
  ${lista.map((s, i) => html`<section class="service${i % 2 ? ' service--alt' : ''}" id="${s.slug}" aria-labelledby="${s.slug}-titulo">
    <div class="container service__grid">
      <div class="service__visual${s.imagen ? ' service__visual--foto' : ''}"${s.imagen ? '' : html` aria-hidden="true"`}>
        ${s.imagen ? html`<img class="service__photo" src="${s.imagen}" alt="${s.imagenAlt || s.nombre}" width="800" height="600" loading="lazy">` : ''}
        <span class="service__num" aria-hidden="true">0${i + 1}</span>
        ${s.imagen ? '' : icono(s.icono, 'service__icon')}
      </div>
      <div class="service__content">
        <p class="eyebrow">Servicio 0${i + 1}</p>
        <h2 class="section-title" id="${s.slug}-titulo">${s.nombre}</h2>
        <p class="service__desc">${s.descripcion}</p>
        <div class="service__cols">
          <div>
            <h3 class="mini-title">Aplicaciones generales</h3>
            <ul class="check-list">${s.aplicaciones.map((a) => html`<li>${a}</li>`)}</ul>
          </div>
          <div>
            <h3 class="mini-title">Datos para cotizar</h3>
            <ul class="dot-list">${s.datosParaCotizar.map((a) => html`<li>${a}</li>`)}</ul>
          </div>
        </div>
        <h3 class="mini-title service__specs-title">Especificaciones</h3>
        <dl class="spec-table">${s.capacidades.map((c) => html`<div class="spec-row"><dt>${c.etiqueta}</dt><dd>${c.valor}</dd></div>`)}</dl>
        <p class="note">${icono('info')}El valor y el tiempo de entrega se confirman con un asesor según cada pedido.</p>
        <div class="service__actions">
          <a class="btn btn--primary" href="${rutas.cotizarServicio(s.slug)}">${icono('documento')}Solicitar cotización</a>
          <a class="btn btn--outline" href="${enlaceWhatsapp(e.whatsapp.numero, `Hola, Ferretería Fátima. Quisiera consultar el servicio de ${s.nombre.toLowerCase()}.`)}" target="_blank" rel="noopener">${icono('whatsapp')}Consultar por WhatsApp</a>
        </div>
      </div>
    </div>
  </section>`)}
</div>

<section class="section section--muted" aria-labelledby="como-titulo">
  <div class="container">
    ${encabezadoSeccion({ eyebrow: 'Cómo funciona', titulo: 'Del pedido al material listo', id: 'como-titulo', centrado: true })}
    <ol class="steps">
      <li class="step"><span class="step__num">1</span><h3>Consulte</h3><p>Indíquenos material, diámetro, medidas y cantidad de trabajos.</p></li>
      <li class="step"><span class="step__num">2</span><h3>Confirme condiciones</h3><p>Un asesor confirma si podemos realizar el trabajo, el valor y el plazo.</p></li>
      <li class="step"><span class="step__num">3</span><h3>Reciba su material</h3><p>Recoja la tubería o el material preparado según lo acordado.</p></li>
    </ol>
  </div>
</section>

${bandaCotizacion(ctx, { titulo: '¿Necesita roscar, ranurar o cortar tubería?', texto: 'Envíenos las medidas y la cantidad de trabajos. Puede combinar la compra de material y el servicio en una misma solicitud.' })}`;

  return [{
    ruta: rutas.servicios,
    seccion: 'servicios',
    titulo: 'Roscado, ranurado y corte de tubería en Pasto',
    descripcion: 'Servicios industriales en Pasto: roscado de tubería, ranurado de tubería para acoples ranurados y corte de materiales a medida. Solicite su cotización.',
    jsonLd: [m.jsonLd, ...lista.map((s) => ({
      '@type': 'Service', name: s.nombre, description: s.descripcion, serviceType: s.nombre,
      provider: { '@id': `${e.sitioUrl}/#negocio` }, areaServed: { '@type': 'City', name: 'Pasto' },
      url: `${e.sitioUrl}${rutas.servicio(s.slug)}`,
    }))],
    cuerpo,
  }];
}
