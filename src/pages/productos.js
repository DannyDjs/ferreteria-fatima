import { html, raw } from '../templates/html.js';
import { icono } from '../templates/icons.js';
import { rutas, enlaceWhatsapp } from '../templates/rutas.js';
import { cabeceraPagina, migas, tarjetaProducto, visualProducto, bandaCotizacion } from '../templates/componentes.js';

const POR_PAGINA = 12;

function barraCategorias(ctx, activa) {
  const { categorias, productos } = ctx.catalogo;
  return html`<aside class="catalog__sidebar" aria-label="Categorías del catálogo">
  <h2 class="catalog__sidebar-title">Categorías</h2>
  <ul class="catalog__cats">
    <li><a href="${rutas.productos}"${!activa ? raw(' aria-current="page"') : ''}><span>Todos los productos</span><span class="count">${productos.length}</span></a></li>
    ${categorias.map((c) => html`<li><a href="${rutas.categoria(c.slug)}"${activa?.slug === c.slug ? raw(' aria-current="page"') : ''}>${icono(c.icono)}<span>${c.nombre}</span><span class="count">${productos.filter((p) => p.categoria === c.slug).length}</span></a></li>`)}
  </ul>
  <div class="catalog__help">
    <p><strong>¿No encuentra una referencia?</strong> Nuestro inventario es más amplio que este catálogo. Consúltenos.</p>
    <a class="btn btn--whatsapp btn--sm btn--block" href="${enlaceWhatsapp(ctx.empresa.whatsapp.numero, 'Hola, Ferretería Fátima. Estoy buscando un producto que no encontré en el catálogo:')}" target="_blank" rel="noopener">${icono('whatsapp')}Consultar por WhatsApp</a>
  </div>
</aside>`;
}

function vistaCatalogo(ctx, categoria) {
  const productos = ctx.catalogo.productos.filter((p) => !categoria || p.categoria === categoria.slug);
  const e = ctx.empresa;
  return html`<section class="section section--tight">
  <div class="container catalog" data-catalogo data-por-pagina="${POR_PAGINA}">
    ${barraCategorias(ctx, categoria)}
    <div class="catalog__main">
      <div class="catalog__toolbar">
        <form class="search-box search-box--compact" role="search" data-catalogo-form action="">
          <label for="buscar-catalogo" class="visually-hidden">Buscar ${categoria ? `en ${categoria.nombre}` : 'en todo el catálogo'} por nombre o referencia</label>
          ${icono('buscar')}
          <input id="buscar-catalogo" name="q" type="search" placeholder="${categoria ? `Buscar en ${categoria.nombre.toLowerCase()}…` : 'Buscar por nombre o referencia…'}" autocomplete="off" maxlength="80" data-catalogo-busqueda>
          <button type="button" class="search-box__clear" data-catalogo-limpiar hidden>${icono('cerrar')}<span class="visually-hidden">Borrar búsqueda</span></button>
        </form>
        ${categoria ? html`<div class="filter-chips" role="group" aria-label="Filtrar por subcategoría">
          <button type="button" class="chip" data-subcategoria="" aria-pressed="true">Todas</button>
          ${categoria.subcategorias.map((s) => html`<button type="button" class="chip" data-subcategoria="${s.slug}" aria-pressed="false">${s.nombre}</button>`)}
        </div>` : ''}
        <p class="catalog__status" role="status" aria-live="polite" data-catalogo-estado>${productos.length} productos</p>
      </div>

      <h2 class="visually-hidden">${categoria ? `Productos de ${categoria.nombre.toLowerCase()}` : 'Todos los productos'}</h2>
      <div class="product-grid" data-catalogo-grid>
        ${productos.map((p) => tarjetaProducto(ctx, p, { enCategoria: Boolean(categoria) }))}
      </div>

      <div class="empty-state" data-catalogo-vacio hidden>
        ${icono('buscar', 'icon--xl')}
        <h2 class="empty-state__title">No encontramos coincidencias para «<span data-catalogo-termino></span>»</h2>
        <p>Revise la ortografía o use un término más general. Es posible que tengamos el producto aunque no aparezca en el catálogo en línea.</p>
        <div class="empty-state__actions">
          <button type="button" class="btn btn--outline" data-catalogo-limpiar>Ver todos los productos</button>
          <a class="btn btn--primary" href="${rutas.cotizar}" data-catalogo-cotizar>${icono('documento')}Solicitarlo por cotización</a>
          <a class="btn btn--whatsapp" href="${enlaceWhatsapp(e.whatsapp.numero, 'Hola, Ferretería Fátima. Estoy buscando un producto:')}" target="_blank" rel="noopener" data-catalogo-whatsapp>${icono('whatsapp')}Preguntar por WhatsApp</a>
        </div>
      </div>

      <div class="catalog__more">
        <button type="button" class="btn btn--outline" data-catalogo-mas hidden>Mostrar más productos</button>
      </div>

      <p class="note catalog__note">${icono('info')}Los productos se muestran sin precio. Precio, existencias, marcas y medidas disponibles se confirman en la cotización. Los íconos son representaciones gráficas, no fotografías del producto.</p>
    </div>
  </div>
</section>`;
}

function paginaIndice(ctx) {
  const m = migas(ctx, [{ texto: 'Productos', href: rutas.productos }]);
  return {
    ruta: rutas.productos,
    seccion: 'productos',
    titulo: 'Catálogo de productos de ferretería industrial',
    descripcion: 'Catálogo de ferretería industrial en Pasto: tubería y accesorios roscados, gas y GLP, redes contra incendios, válvulas, aceros, tornillería, soldadura, herramientas y transmisión.',
    scripts: ['catalogo.js'],
    jsonLd: [m.jsonLd],
    cuerpo: html`${cabeceraPagina({
      migasHtml: m.visible,
      eyebrow: 'Catálogo',
      titulo: 'Productos de ferretería industrial',
      lead: 'Explore nuestros productos por categoría, agregue lo que necesita a su solicitud y reciba una cotización con precios y disponibilidad.',
    })}
${vistaCatalogo(ctx, null)}
${bandaCotizacion(ctx)}`,
  };
}

function paginaCategoria(ctx, c) {
  const m = migas(ctx, [{ texto: 'Productos', href: rutas.productos }, { texto: c.nombre, href: rutas.categoria(c.slug) }]);
  return {
    ruta: rutas.categoria(c.slug),
    seccion: 'productos',
    titulo: `${c.nombre} en Pasto`,
    descripcion: `${c.nombre} en Ferretería Fátima, Pasto: ${c.resumen.charAt(0).toLowerCase()}${c.resumen.slice(1)} Solicite cotización y disponibilidad.`,
    scripts: ['catalogo.js'],
    jsonLd: [m.jsonLd],
    cuerpo: html`${cabeceraPagina({ migasHtml: m.visible, eyebrow: 'Catálogo', titulo: c.nombre, lead: c.descripcion })}
${vistaCatalogo(ctx, c)}
${bandaCotizacion(ctx)}`,
  };
}

function filaDato(etiqueta, valor) {
  return html`<div class="spec-row"><dt>${etiqueta}</dt><dd>${valor ?? html`<span class="muted">Consultar con un asesor</span>`}</dd></div>`;
}

function paginaProducto(ctx, p) {
  const e = ctx.empresa;
  const c = ctx.catalogo.categorias.find((x) => x.slug === p.categoria);
  const sub = c.subcategorias.find((s) => s.slug === p.subcategoria);
  const url = rutas.producto(c.slug, p.id);
  const m = migas(ctx, [{ texto: 'Productos', href: rutas.productos }, { texto: c.nombre, href: rutas.categoria(c.slug) }, { texto: p.nombre, href: url }]);
  const relacionados = ctx.catalogo.productos.filter((x) => x.categoria === p.categoria && x.id !== p.id).slice(0, 3);
  const servicio = p.servicio && ctx.servicios.servicios.find((s) => s.slug === p.servicio);
  const verCat = p.verCategoria && ctx.catalogo.categorias.find((x) => x.slug === p.verCategoria);
  const mensajeWa = `Hola, Ferretería Fátima. Quisiera consultar la disponibilidad de: ${p.nombre}${p.referencia ? ` (Ref. ${p.referencia})` : ''}. Medida/cantidad: `;

  return {
    ruta: url,
    seccion: 'productos',
    titulo: `${p.nombre} | ${c.nombre}`,
    descripcion: `${p.nombre}${p.marca ? ` ${p.marca}` : ''} en Ferretería Fátima, Pasto (${c.nombre.toLowerCase()}). Consulte medidas, disponibilidad y solicite su cotización.`,
    jsonLd: [m.jsonLd],
    cuerpo: html`<section class="section section--tight product-page">
  <div class="container">
    ${m.visible}
    <div class="product-detail">
      <div class="product-detail__media">
        ${visualProducto(p, c, { grande: true })}
        ${p.imagen ? '' : html`<p class="product-detail__media-note">Representación gráfica del producto. Solicite fotos o fichas técnicas de las referencias disponibles.</p>`}
      </div>
      <div class="product-detail__info">
        <p class="eyebrow"><span><a href="${rutas.categoria(c.slug)}">${c.nombre}</a>${sub ? html` · ${sub.nombre}` : ''}</span></p>
        <h1 class="product-detail__title">${p.nombre}</h1>
        <p class="product-detail__desc">${p.descripcion}</p>
        <dl class="spec-table">
          ${filaDato('Referencia', p.referencia)}
          ${filaDato('Marca', p.marca)}
          ${filaDato('Medida / presentación', p.unidad)}
          ${ctx.empresa.mostrarPrecio ? filaDato('Precio', p.precio ? p.precio : html`<span class="muted">Consultar precio</span>`) : ''}
          ${(p.especificaciones || []).map((s) => filaDato(s.etiqueta, s.valor))}
        </dl>
        <div class="product-detail__actions">
          <a class="btn btn--primary btn--lg" href="${rutas.cotizarProducto(p.id)}" data-cotizar-ahora="${p.id}" data-nombre="${p.nombre}" data-referencia="${p.referencia || ''}">${icono('documento')}Solicitar cotización</a>
          <a class="btn btn--whatsapp btn--lg" href="${enlaceWhatsapp(e.whatsapp.numero, mensajeWa)}" target="_blank" rel="noopener">${icono('whatsapp')}Consultar disponibilidad</a>
          <button type="button" class="btn btn--outline" data-agregar-cotizacion="${p.id}" data-nombre="${p.nombre}" data-referencia="${p.referencia || ''}" aria-pressed="false">
            <span class="when-off">${icono('mas')}Agregar a mi solicitud</span><span class="when-on">${icono('check')}Agregado a su solicitud</span>
          </button>
        </div>
        <p class="note">${icono('info')}La información de esta ficha es general. Las especificaciones técnicas, medidas y existencias se confirman con un asesor.</p>
      </div>
    </div>

    <div class="product-extra">
      ${p.aplicaciones?.length ? html`<section aria-labelledby="aplicaciones-titulo">
        <h2 class="mini-title" id="aplicaciones-titulo">Aplicaciones generales</h2>
        <ul class="check-list">${p.aplicaciones.map((a) => html`<li>${a}</li>`)}</ul>
      </section>` : ''}
      <section aria-labelledby="datos-titulo">
        <h2 class="mini-title" id="datos-titulo">Datos que conviene enviar al cotizar</h2>
        <ul class="dot-list">${c.datosParaCotizar.map((d) => html`<li>${d}</li>`)}</ul>
      </section>
      ${servicio || verCat ? html`<section aria-labelledby="relacion-titulo">
        <h2 class="mini-title" id="relacion-titulo">También le puede servir</h2>
        <ul class="link-list">
          ${servicio ? html`<li><a class="link-arrow" href="${rutas.servicio(servicio.slug)}">Servicio de ${servicio.nombre.toLowerCase()}${icono('flecha')}</a></li>` : ''}
          ${verCat ? html`<li><a class="link-arrow" href="${rutas.categoria(verCat.slug)}">${verCat.nombre}${icono('flecha')}</a></li>` : ''}
        </ul>
      </section>` : ''}
    </div>
  </div>
</section>

${relacionados.length ? html`<section class="section section--muted" aria-labelledby="relacionados-titulo">
  <div class="container">
    <div class="section-head section-head--split">
      <h2 class="section-title" id="relacionados-titulo">Más en ${c.nombre.toLowerCase()}</h2>
      <a class="link-arrow" href="${rutas.categoria(c.slug)}">Ver la categoría${icono('flecha')}</a>
    </div>
    <div class="product-grid product-grid--3">${relacionados.map((r) => tarjetaProducto(ctx, r, { enCategoria: true }))}</div>
  </div>
</section>` : ''}

${bandaCotizacion(ctx)}`,
  };
}

export default function productos(ctx) {
  return [
    paginaIndice(ctx),
    ...ctx.catalogo.categorias.map((c) => paginaCategoria(ctx, c)),
    ...ctx.catalogo.productos.map((p) => paginaProducto(ctx, p)),
  ];
}
