import { html } from '../templates/html.js';
import { icono } from '../templates/icons.js';
import { rutas, enlaceWhatsapp } from '../templates/rutas.js';
import { encabezadoSeccion, bandaCotizacion } from '../templates/componentes.js';

export function fotoFachada({ clase = '', sizes = '(min-width: 1024px) 50vw, 100vw', prioridad = false } = {}) {
  return html`<picture class="${clase}">
  <source type="image/webp" srcset="/assets/img/fotos/fachada-sede-800.webp 800w, /assets/img/fotos/fachada-sede-1280.webp 1280w, /assets/img/fotos/fachada-sede-1920.webp 1920w" sizes="${sizes}">
  <img src="/assets/img/fotos/fachada-sede-1280.jpg" width="1280" height="1051" alt="Fachada de la sede de Ferretería Fátima en la Calle 18 del barrio Fátima, Pasto" ${prioridad ? html`fetchpriority="high"` : html`loading="lazy"`} decoding="async">
</picture>`;
}

export default function inicio(ctx) {
  const e = ctx.empresa;
  const { categorias, productos } = ctx.catalogo;
  const servicios = ctx.servicios.servicios;
  const conteo = (slug) => productos.filter((p) => p.categoria === slug).length;

  const cuerpo = html`
<section class="hero">
  <div class="container hero__grid">
    <div class="hero__content">
      <p class="eyebrow eyebrow--light">Ferretería industrial en Pasto, Nariño</p>
      <h1 class="hero__title">Soluciones en ferretería <span>e industria</span></h1>
      <p class="hero__lead">Suministramos tubería, válvulas, accesorios, aceros, herramientas y materiales para instalaciones y procesos industriales. Además, roscamos, ranuramos y cortamos tubería según su necesidad.</p>
      <div class="hero__actions">
        <a class="btn btn--primary btn--lg" href="${rutas.productos}">${icono('cajas')}Explorar productos</a>
        <a class="btn btn--ghost-light btn--lg" href="${rutas.cotizar}">${icono('documento')}Solicitar cotización</a>
      </div>
      <ul class="hero__facts">
        <li>${icono('check')}Atención a empresas, talleres, contratistas y particulares</li>
        <li>${icono('check')}Cotizaciones formales con revisión de disponibilidad</li>
      </ul>
    </div>
    <div class="hero__media">
      ${fotoFachada({ clase: 'hero__photo', prioridad: true })}
      <p class="hero__caption">${icono('ubicacion')}Nuestra sede: ${e.direccion.calle}, ${e.direccion.barrio}</p>
    </div>
  </div>
</section>

<section class="search-strip" aria-labelledby="buscar-titulo">
  <div class="container search-strip__inner">
    <h2 class="search-strip__title" id="buscar-titulo">¿Qué material necesita?</h2>
    <form class="search-box" action="${rutas.productos}" method="get" role="search">
      <label for="buscar-inicio" class="visually-hidden">Buscar productos por nombre o referencia</label>
      ${icono('buscar')}
      <input id="buscar-inicio" name="q" type="search" placeholder="Ej.: tubería galvanizada, regulador Unkar, electrodo 6011…" autocomplete="off" maxlength="80">
      <button class="btn btn--primary" type="submit">Buscar</button>
    </form>
    <ul class="chip-row" aria-label="Búsquedas frecuentes">
      ${['Tubería galvanizada', 'Regulador Unkar', 'Válvulas de bola', 'Electrodo', 'Chumaceras'].map((t) => html`<li><a class="chip" href="${rutas.productos}?q=${encodeURIComponent(t)}">${t}</a></li>`)}
    </ul>
  </div>
</section>

<section class="section" aria-labelledby="lineas-titulo">
  <div class="container">
    ${encabezadoSeccion({ eyebrow: 'Qué hacemos', titulo: 'Tres frentes para abastecer su proyecto', id: 'lineas-titulo', texto: 'Un solo proveedor para el material, su preparación y la asesoría para elegirlo.' })}
    <div class="pillars">
      <article class="pillar">
        <span class="pillar__num">01</span>
        <h3 class="pillar__title">Suministro de ferretería industrial</h3>
        <p>Tubería y accesorios, gas y GLP, redes contra incendios, válvulas, metales, tornillería, soldadura, herramientas y más.</p>
        <a class="link-arrow" href="${rutas.productos}">Ver catálogo${icono('flecha')}</a>
      </article>
      <article class="pillar">
        <span class="pillar__num">02</span>
        <h3 class="pillar__title">Servicios sobre tubería y materiales</h3>
        <p>Roscado y ranurado de tubería y corte de materiales para que reciba el material listo para el montaje.</p>
        <a class="link-arrow" href="${rutas.servicios}">Ver servicios${icono('flecha')}</a>
      </article>
      <article class="pillar">
        <span class="pillar__num">03</span>
        <h3 class="pillar__title">Cotizaciones para empresas</h3>
        <p>Reciba su lista de materiales, verificamos disponibilidad y le enviamos una cotización formal.</p>
        <a class="link-arrow" href="${rutas.cotizar}">Solicitar cotización${icono('flecha')}</a>
      </article>
    </div>
  </div>
</section>

<section class="section section--muted" aria-labelledby="categorias-titulo">
  <div class="container">
    <div class="section-head section-head--split">
      ${encabezadoSeccion({ eyebrow: 'Catálogo', titulo: 'Líneas de producto', id: 'categorias-titulo' })}
      <a class="btn btn--outline" href="${rutas.productos}">Ver todo el catálogo${icono('flecha')}</a>
    </div>
    <ul class="category-grid">
      ${categorias.map((c) => html`<li>
        <a class="category-tile" href="${rutas.categoria(c.slug)}">
          <span class="category-tile__icon">${icono(c.icono)}</span>
          <span class="category-tile__body">
            <span class="category-tile__name">${c.nombre}</span>
            <span class="category-tile__desc">${c.resumen}</span>
          </span>
          <span class="category-tile__count">${conteo(c.slug)} productos${icono('chevron')}</span>
        </a>
      </li>`)}
    </ul>
  </div>
</section>

<section class="section section--navy" aria-labelledby="servicios-titulo">
  <div class="container">
    <div class="section-head section-head--split">
      ${encabezadoSeccion({ eyebrow: 'Servicios industriales', titulo: 'Roscado, ranurado y corte', id: 'servicios-titulo', claro: true, texto: 'Prepare su tubería y sus materiales en el mismo lugar donde los compra.' })}
      <a class="btn btn--ghost-light" href="${rutas.servicios}">Conocer los servicios${icono('flecha')}</a>
    </div>
    <div class="service-row">
      ${servicios.map((s, i) => html`<article class="service-mini">
        <span class="service-mini__icon">${icono(s.icono)}</span>
        <p class="service-mini__num">0${i + 1}</p>
        <h3 class="service-mini__title">${s.nombre}</h3>
        <p>${s.resumen}</p>
        <a class="link-arrow link-arrow--light" href="${rutas.servicio(s.slug)}">Detalles<span class="visually-hidden"> de ${s.nombre}</span>${icono('flecha')}</a>
      </article>`)}
    </div>
  </div>
</section>

<section class="section" aria-labelledby="beneficios-titulo">
  <div class="container benefits">
    <div class="benefits__intro">
      ${encabezadoSeccion({ eyebrow: 'Por qué Ferretería Fátima', titulo: 'Compra técnica, atención directa', id: 'beneficios-titulo', texto: 'Atendemos tanto el pedido de una empresa como la compra puntual de un taller o de un particular.' })}
      <a class="btn btn--primary" href="${rutas.nosotros}">Conozca la empresa${icono('flecha')}</a>
    </div>
    <ul class="benefit-list">
      <li class="benefit">${icono('personas', 'benefit__icon')}<div><h3>Asesoría personalizada</h3><p>Le ayudamos a identificar el material, la medida y el accesorio adecuados antes de comprar.</p></div></li>
      <li class="benefit">${icono('cajas', 'benefit__icon')}<div><h3>Varias líneas en un mismo lugar</h3><p>Tubería, conexiones, válvulas, metales, herramientas y fijación en una sola compra.</p></div></li>
      <li class="benefit">${icono('rosca', 'benefit__icon')}<div><h3>Material listo para instalar</h3><p>Roscado, ranurado y corte para reducir trabajo en obra o en el taller.</p></div></li>
      <li class="benefit">${icono('documento', 'benefit__icon')}<div><h3>Cotización formal</h3><p>Documento de cotización con los productos, cantidades y condiciones para su empresa.</p></div></li>
    </ul>
  </div>
</section>

<section class="section section--muted" aria-labelledby="proceso-titulo">
  <div class="container">
    ${encabezadoSeccion({ eyebrow: 'Clientes empresariales', titulo: 'Cómo solicitar una cotización', id: 'proceso-titulo', centrado: true })}
    <ol class="steps">
      <li class="step"><span class="step__num">1</span><h3>Envíe su lista</h3><p>Use el formulario o WhatsApp con productos, referencias, medidas y cantidades.</p></li>
      <li class="step"><span class="step__num">2</span><h3>Revisamos disponibilidad</h3><p>Un asesor verifica inventario y le consulta si falta algún dato técnico.</p></li>
      <li class="step"><span class="step__num">3</span><h3>Reciba su cotización</h3><p>Le respondemos con precios, condiciones y vigencia de la oferta.</p></li>
    </ol>
    <p class="steps__cta"><a class="btn btn--primary btn--lg" href="${rutas.cotizar}">${icono('documento')}Empezar solicitud</a></p>
  </div>
</section>

<section class="section" aria-labelledby="visitenos-titulo">
  <div class="container visit">
    <div class="visit__info">
      ${encabezadoSeccion({ eyebrow: 'Visítenos', titulo: 'En el barrio Fátima, Pasto', id: 'visitenos-titulo' })}
      <ul class="info-list">
        <li>${icono('ubicacion')}<div><strong>Dirección</strong><span>${e.direccion.calle}, ${e.direccion.barrio}, ${e.direccion.ciudad}, ${e.direccion.departamento}</span></div></li>
        <li>${icono('reloj')}<div><strong>Horario</strong>${e.horario.map((h) => html`<span>${h.dias}: ${h.horas}</span>`)}</div></li>
        <li>${icono('whatsapp')}<div><strong>WhatsApp</strong><a href="${enlaceWhatsapp(e.whatsapp.numero, e.whatsapp.mensajeInicial)}" target="_blank" rel="noopener">${e.whatsapp.visible}</a></div></li>
      </ul>
      <div class="visit__actions">
        <a class="btn btn--outline" href="${e.mapaUrl}" target="_blank" rel="noopener">${icono('ubicacion')}Cómo llegar</a>
        <a class="btn btn--outline" href="${rutas.contacto}">Ver contacto${icono('flecha')}</a>
      </div>
    </div>
    ${fotoFachada({ clase: 'visit__photo', sizes: '(min-width: 1024px) 45vw, 100vw' })}
  </div>
</section>

${bandaCotizacion(ctx)}`;

  return [{
    ruta: rutas.inicio,
    seccion: 'inicio',
    titulo: 'Ferretería Fátima | Ferretería industrial en Pasto, Nariño',
    descripcion: 'Ferretería industrial en Pasto: tubería de acero y galvanizada, accesorios para tubería, válvulas, acero inoxidable, herramientas y servicios de roscado, ranurado y corte de tubería.',
    preload: html`<link rel="preload" as="image" type="image/webp" imagesrcset="/assets/img/fotos/fachada-sede-800.webp 800w, /assets/img/fotos/fachada-sede-1280.webp 1280w, /assets/img/fotos/fachada-sede-1920.webp 1920w" imagesizes="(min-width: 1024px) 50vw, 100vw">`,
    cuerpo,
  }];
}
