// Componentes reutilizables entre páginas.
import { html, raw } from './html.js';
import { icono } from './icons.js';
import { rutas, enlaceWhatsapp } from './rutas.js';

/** Migas de pan visibles + datos estructurados BreadcrumbList. Cada item: { texto, href } (el último es la página actual). */
export function migas(ctx, items) {
  const todos = [{ texto: 'Inicio', href: '/' }, ...items];
  const visible = html`<nav class="breadcrumbs" aria-label="Ruta de navegación"><ol>
    ${todos.map((it, i) => i === todos.length - 1
      ? html`<li><span aria-current="page">${it.texto}</span></li>`
      : html`<li><a href="${it.href}">${it.texto}</a>${icono('chevron')}</li>`)}
  </ol></nav>`;
  const jsonLd = {
    '@type': 'BreadcrumbList',
    itemListElement: todos.map((it, i) => ({
      '@type': 'ListItem', position: i + 1, name: it.texto, item: ctx.empresa.sitioUrl + it.href,
    })),
  };
  return { visible, jsonLd };
}

/** Encabezado de página interior. */
export function cabeceraPagina({ eyebrow, titulo, lead, migasHtml, acciones }) {
  return html`<section class="page-header">
  <div class="container">
    ${migasHtml || ''}
    ${eyebrow ? html`<p class="eyebrow eyebrow--light">${eyebrow}</p>` : ''}
    <h1 class="page-header__title">${titulo}</h1>
    ${lead ? html`<p class="page-header__lead">${lead}</p>` : ''}
    ${acciones ? html`<div class="page-header__actions">${acciones}</div>` : ''}
  </div>
</section>`;
}

export function encabezadoSeccion({ eyebrow, titulo, texto, id, centrado = false, claro = false }) {
  return html`<div class="section-head${centrado ? ' section-head--center' : ''}">
  ${eyebrow ? html`<p class="eyebrow${claro ? ' eyebrow--light' : ''}">${eyebrow}</p>` : ''}
  <h2 class="section-title"${id ? raw(` id="${id}"`) : ''}>${titulo}</h2>
  ${texto ? html`<p class="section-text">${texto}</p>` : ''}
</div>`;
}

/** Visual de producto: foto real si existe; si no, el icono de la categoría (sin fingir una foto). */
export function visualProducto(producto, categoria, { grande = false } = {}) {
  if (producto.imagen) {
    return html`<div class="product-visual${grande ? ' product-visual--lg' : ''}"><img src="${producto.imagen}" alt="${producto.imagenAlt || producto.nombre}" loading="lazy" width="480" height="360"></div>`;
  }
  return html`<div class="product-visual product-visual--icon${grande ? ' product-visual--lg' : ''}" aria-hidden="true">${icono(categoria.icono)}</div>`;
}

/**
 * Tarjeta de producto. Sin foto real se muestra en formato compacto (icono de la categoría
 * junto a la etiqueta) en lugar de un recuadro grande vacío.
 * enCategoria: dentro de la página de una categoría la etiqueta muestra la subcategoría.
 */
export function tarjetaProducto(ctx, producto, { enCategoria = false } = {}) {
  const cat = ctx.catalogo.categorias.find((c) => c.slug === producto.categoria);
  const sub = cat.subcategorias.find((s) => s.slug === producto.subcategoria);
  const textoBusqueda = [producto.nombre, producto.descripcion, producto.referencia, producto.marca, cat.nombre, sub?.nombre, ...(producto.aplicaciones || [])].filter(Boolean).join(' ');
  const url = rutas.producto(producto.categoria, producto.id);
  return html`<article class="product-card${producto.imagen ? '' : ' product-card--compact'}" data-producto="${producto.id}" data-categoria="${producto.categoria}" data-subcategoria="${producto.subcategoria}" data-texto="${textoBusqueda}">
  ${producto.imagen ? visualProducto(producto, cat) : ''}
  <div class="product-card__body">
    <div class="product-card__head">
      ${producto.imagen ? '' : html`<span class="product-card__icon" aria-hidden="true">${icono(cat.icono)}</span>`}
      <p class="product-card__cat">${enCategoria && sub ? sub.nombre : cat.nombre}</p>
    </div>
    <h3 class="product-card__title"><a href="${url}">${producto.nombre}</a></h3>
    <p class="product-card__desc">${producto.descripcion}</p>
    ${producto.referencia ? html`<p class="product-card__ref">Ref. ${producto.referencia}</p>` : ''}
  </div>
  <div class="product-card__actions">
    <button type="button" class="btn btn--outline btn--sm" data-agregar-cotizacion="${producto.id}" data-nombre="${producto.nombre}" data-referencia="${producto.referencia || ''}" aria-pressed="false">
      <span class="when-off">${icono('mas')}Agregar a cotización</span><span class="when-on">${icono('check')}En su solicitud</span>
    </button>
    <a class="product-card__go" href="${url}" tabindex="-1" aria-hidden="true">${icono('flecha')}</a>
  </div>
</article>`;
}

/** Banda de llamada a la acción para cotizar. */
export function bandaCotizacion(ctx, { titulo = '¿Necesita una cotización para su empresa, obra o taller?', texto = 'Envíenos su lista de materiales con referencias, medidas y cantidades. Un asesor revisa la disponibilidad y le responde con la cotización.' } = {}) {
  const e = ctx.empresa;
  return html`<section class="cta-band" aria-labelledby="cta-titulo">
  <div class="container cta-band__inner">
    <div>
      <h2 class="cta-band__title" id="cta-titulo">${titulo}</h2>
      <p class="cta-band__text">${texto}</p>
    </div>
    <div class="cta-band__actions">
      <a class="btn btn--primary btn--lg" href="${rutas.cotizar}">${icono('documento')}Solicitar cotización</a>
      <a class="btn btn--ghost-light btn--lg" href="${enlaceWhatsapp(e.whatsapp.numero, 'Hola, Ferretería Fátima. Quisiera solicitar una cotización.')}" target="_blank" rel="noopener">${icono('whatsapp')}Cotizar por WhatsApp</a>
    </div>
  </div>
</section>`;
}

/** Mapa con carga bajo demanda: Google Maps solo se carga si la persona lo pide. */
/** fondo (opcional): imagen que se muestra detrás de los botones hasta que se carga el mapa. */
export function mapa(ctx, { fondo } = {}) {
  const e = ctx.empresa;
  return html`<div class="map${fondo ? ' map--foto' : ''}" data-mapa data-src="${e.mapaEmbed}">
  ${fondo || ''}
  <div class="map__placeholder">
    ${icono('ubicacion', 'icon--xl')}
    <p class="map__address"><strong>${e.direccion.calle}, ${e.direccion.barrio}</strong><br>${e.direccion.ciudad}, ${e.direccion.departamento}</p>
    <div class="map__actions">
      <button type="button" class="btn btn--primary btn--sm" data-mapa-cargar>Ver mapa aquí</button>
      <a class="btn btn--outline btn--sm" href="${e.mapaUrl}" target="_blank" rel="noopener">${icono('externo')}Abrir en Google Maps</a>
    </div>
    <p class="map__note">Al cargar el mapa, Google puede recibir datos de su navegación.</p>
  </div>
</div>`;
}
