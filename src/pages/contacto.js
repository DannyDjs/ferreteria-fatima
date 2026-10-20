import { html } from '../templates/html.js';
import { icono } from '../templates/icons.js';
import { rutas, enlaceWhatsapp } from '../templates/rutas.js';
import { cabeceraPagina, migas, mapa, encabezadoSeccion, bandaCotizacion } from '../templates/componentes.js';
import { fotoFachada } from './inicio.js';

// Sin formulario propio: las consultas van por WhatsApp/llamada/correo y los pedidos por /cotizar/ (un solo formulario en el sitio).
export default function contacto(ctx) {
  const e = ctx.empresa;
  const m = migas(ctx, [{ texto: 'Contacto', href: rutas.contacto }]);
  const wa = enlaceWhatsapp(e.whatsapp.numero, e.whatsapp.mensajeInicial);

  const canales = [
    { icono: 'whatsapp', titulo: 'WhatsApp', valor: e.whatsapp.visible, nota: 'Respuesta en horario de atención', href: wa, externo: true, wa: true },
    { icono: 'telefono', titulo: 'Llámenos', valor: e.telefonos.celular.visible, nota: 'Mismo número de WhatsApp', href: `tel:${e.telefonos.celular.e164}` },
    ...(e.correo ? [{ icono: 'correo', titulo: 'Correo electrónico', valor: e.correo, nota: 'Para documentos y cotizaciones', href: `mailto:${e.correo}` }] : []),
  ];

  const necesidades = [
    { icono: 'documento', titulo: 'Cotizar productos o servicios', texto: 'Envíe su lista con medidas y cantidades. Le respondemos con precios y disponibilidad.', href: rutas.cotizar, accion: 'Solicitar cotización' },
    { icono: 'whatsapp', titulo: 'Hacer una pregunta rápida', texto: 'Escríbanos por WhatsApp y un asesor le atiende.', href: wa, accion: 'Escribir por WhatsApp', externo: true },
    { icono: 'buscar', titulo: 'Buscar un producto', texto: 'Revise nuestro catálogo y agregue productos a su solicitud.', href: rutas.productos, accion: 'Ver catálogo' },
    { icono: 'info', titulo: 'Resolver una duda', texto: 'Precios, servicios, horario y cómo recoger su pedido.', href: rutas.faq, accion: 'Preguntas frecuentes' },
  ];

  const cuerpo = html`
${cabeceraPagina({
  migasHtml: m.visible,
  eyebrow: 'Contacto',
  titulo: 'Hablemos de su proyecto',
  lead: 'Escríbanos, llámenos o visítenos en el barrio Fátima de Pasto. Le ayudamos a encontrar el material y el servicio que necesita.',
  acciones: html`<div class="hero__actions">
    <a class="btn btn--whatsapp btn--lg" href="${wa}" target="_blank" rel="noopener">${icono('whatsapp')}Escribir por WhatsApp</a>
    <a class="btn btn--ghost-light btn--lg" href="tel:${e.telefonos.celular.e164}">${icono('telefono')}Llamar al ${e.telefonos.celular.visible}</a>
  </div>`,
})}

<section class="channels" aria-label="Canales de contacto">
  <div class="container">
    <ul class="channels__inner">
      ${canales.map((c) => html`<li>
        <a class="channel" href="${c.href}"${c.externo ? html` target="_blank" rel="noopener"` : ''}>
          <span class="channel__icon${c.wa ? ' channel__icon--wa' : ''}">${icono(c.icono)}</span>
          <span class="channel__body">
            <span class="channel__title">${c.titulo}</span>
            <span class="channel__value${c.valor.length > 20 ? ' channel__value--sm' : ''}">${c.valor.includes('@') ? html`${c.valor.split('@')[0]}@<wbr>${c.valor.split('@')[1]}` : c.valor}</span>
            <span class="channel__note">${c.nota}</span>
          </span>
        </a>
      </li>`)}
    </ul>
  </div>
</section>

<section class="section" aria-labelledby="visitenos-titulo">
  <div class="container visit">
    <div class="visit__info">
      ${encabezadoSeccion({ eyebrow: 'Visítenos', titulo: 'Nuestra sede en el barrio Fátima', id: 'visitenos-titulo', texto: 'Atendemos en mostrador: puede traer sus medidas o su muestra y le ayudamos a elegir el material.' })}
      <ul class="info-list">
        <li>${icono('ubicacion')}<div><strong>Dirección</strong><span>${e.direccion.calle}, barrio ${e.direccion.barrio}</span><span>${e.direccion.ciudad}, ${e.direccion.departamento}</span></div></li>
      </ul>
      <dl class="hours hours--inline">
        ${e.horario.map((h) => html`<div class="hours__row"><dt>${h.dias}</dt><dd>${h.horas}</dd></div>`)}
      </dl>
    </div>
    <div class="visit__map">
      <h3 class="mini-title" id="mapa-titulo">Cómo llegar</h3>
      ${mapa(ctx, { fondo: fotoFachada({ clase: 'map__bg', sizes: '(min-width: 1024px) 45vw, 100vw' }) })}
    </div>
  </div>
</section>

<section class="section section--muted" aria-labelledby="necesita-titulo">
  <div class="container">
    ${encabezadoSeccion({ eyebrow: '¿Qué necesita?', titulo: 'Elija la forma más rápida de resolverlo', id: 'necesita-titulo' })}
    <ul class="needs">
      ${necesidades.map((n) => html`<li>
        <a class="need" href="${n.href}"${n.externo ? html` target="_blank" rel="noopener"` : ''}>
          <span class="need__icon">${icono(n.icono)}</span>
          <span class="need__title">${n.titulo}</span>
          <span class="need__text">${n.texto}</span>
          <span class="need__action">${n.accion}${icono('flecha')}</span>
        </a>
      </li>`)}
    </ul>
  </div>
</section>

${bandaCotizacion(ctx)}`;

  return [{
    ruta: rutas.contacto,
    seccion: 'contacto',
    titulo: 'Contacto, dirección y horario',
    descripcion: `Contacte a Ferretería Fátima en Pasto: WhatsApp y llamadas al ${e.whatsapp.visible}, ${e.direccion.calle}, barrio ${e.direccion.barrio}. Horario de atención y mapa.`,
    sinWhatsappFlotante: true,
    jsonLd: [m.jsonLd],
    cuerpo,
  }];
}
