// Estructura común de todas las páginas: <head>, encabezado, pie y WhatsApp flotante.
import { html, raw, jsonScript } from './html.js';
import { icono, spriteIconos } from './icons.js';
import { rutas, menuPrincipal, enlaceWhatsapp } from './rutas.js';

function datosEstructuradosNegocio(ctx) {
  const e = ctx.empresa;
  const horas = [];
  for (const h of e.horario) {
    for (const s of [h.schema, h.schema2]) {
      if (!s) continue;
      horas.push({
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: s[0].map((d) => ({ Mo: 'Monday', Tu: 'Tuesday', We: 'Wednesday', Th: 'Thursday', Fr: 'Friday', Sa: 'Saturday', Su: 'Sunday' })[d]),
        opens: s[1],
        closes: s[2],
      });
    }
  }
  return {
    '@context': 'https://schema.org',
    '@type': 'HardwareStore',
    '@id': `${e.sitioUrl}/#negocio`,
    name: e.nombre,
    slogan: e.eslogan,
    url: `${e.sitioUrl}/`,
    logo: `${e.sitioUrl}/assets/img/brand/logo-claro-640.png`,
    image: `${e.sitioUrl}/assets/img/fotos/fachada-sede-1280.jpg`,
    telephone: e.telefonos.celular.e164,
    ...(e.correo ? { email: e.correo } : {}),
    address: {
      '@type': 'PostalAddress',
      streetAddress: `${e.direccion.calle}, ${e.direccion.barrio}`,
      addressLocality: e.direccion.ciudad,
      addressRegion: e.direccion.departamento,
      addressCountry: e.direccion.codigoPais,
    },
    geo: { '@type': 'GeoCoordinates', latitude: e.geo.lat, longitude: e.geo.lng },
    openingHoursSpecification: horas,
    sameAs: Object.values(e.redes),
    currenciesAccepted: 'COP',
    areaServed: { '@type': 'City', name: 'Pasto' },
  };
}

function head(ctx, pagina) {
  const e = ctx.empresa;
  const url = e.sitioUrl + pagina.ruta;
  const titulo = pagina.ruta === '/' ? pagina.titulo : `${pagina.titulo} | ${e.nombre}`;
  const v = ctx.version;
  return html`<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
${ctx.csp ? html`<meta http-equiv="Content-Security-Policy" content="${ctx.csp}">` : ''}
<title>${titulo}</title>
<meta name="description" content="${pagina.descripcion}">
${pagina.noIndex ? raw('<meta name="robots" content="noindex">') : html`<link rel="canonical" href="${url}">`}
<meta name="theme-color" content="#001a35">
<meta property="og:type" content="website">
<meta property="og:locale" content="es_CO">
<meta property="og:site_name" content="${e.nombre}">
<meta property="og:title" content="${titulo}">
<meta property="og:description" content="${pagina.descripcion}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${e.sitioUrl}/og-ferreteria-fatima.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/favicon.ico" sizes="48x48">
<link rel="icon" href="/icon-192.png" type="image/png" sizes="192x192">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<link rel="preload" href="/assets/fonts/barlow-400.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/assets/fonts/barlow-500.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/assets/fonts/barlow-600.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/assets/fonts/barlow-700.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/assets/fonts/barlow-condensed-600.woff2" as="font" type="font/woff2" crossorigin>
${pagina.preload || ''}
<link rel="stylesheet" href="/assets/css/site.css?v=${v}">
<script type="module" src="/assets/js/main.js?v=${v}"></script>
${(pagina.scripts || []).map((s) => html`<script type="module" src="/assets/js/${s}?v=${v}"></script>`)}
${jsonScript(datosEstructuradosNegocio(ctx), { tipo: 'application/ld+json' })}
${(pagina.jsonLd || []).map((d) => jsonScript({ '@context': 'https://schema.org', ...d }, { tipo: 'application/ld+json' }))}
</head>`;
}

function logo(variante, { ancho = 168, prioridad = false } = {}) {
  const alto = Math.round(ancho * 514 / 1500);
  return html`<img src="/assets/img/brand/logo-${variante}-320.webp" srcset="/assets/img/brand/logo-${variante}-320.webp 320w, /assets/img/brand/logo-${variante}-640.webp 640w" sizes="${ancho}px" width="${ancho}" height="${alto}" alt="Ferretería Fátima — Soluciones en ferretería e industria"${prioridad ? raw(' fetchpriority="high"') : raw(' loading="lazy"')}>`;
}

function encabezado(ctx, pagina) {
  const e = ctx.empresa;
  const enlaces = menuPrincipal.map((m) => {
    const activo = pagina.seccion === m.clave;
    return html`<li><a href="${m.href}" class="nav__link"${activo ? raw(' aria-current="page"') : ''}>${m.texto}</a></li>`;
  });
  const cotizarActivo = pagina.seccion === 'cotizar';
  return html`<a class="skip-link" href="#contenido">Saltar al contenido</a>
<div class="topbar">
  <div class="container topbar__inner">
    <p class="topbar__item">${icono('ubicacion')}<span>${e.direccion.calle}, ${e.direccion.barrio} · ${e.direccion.ciudad}, ${e.direccion.departamento}</span></p>
    <p class="topbar__item topbar__item--horario">${icono('reloj')}<span>${e.horarioCorto}</span></p>
    <p class="topbar__item topbar__item--end"><a href="tel:${e.telefonos.celular.e164}">${icono('telefono')}<span>${e.telefonos.celular.visible}</span></a></p>
  </div>
</div>
<header class="site-header" data-header>
  <div class="container site-header__inner">
    <a href="/" class="site-header__logo" aria-label="Ferretería Fátima, ir al inicio">${logo('claro', { prioridad: true })}</a>
    <nav class="nav" id="menu-principal" aria-label="Principal" data-nav>
      <ul class="nav__list">${enlaces}</ul>
      <div class="nav__mobile-extra">
        <a class="btn btn--primary btn--block" href="${rutas.cotizar}">${icono('documento')}Solicitar cotización</a>
        <a class="btn btn--whatsapp btn--block" href="${enlaceWhatsapp(e.whatsapp.numero, e.whatsapp.mensajeInicial)}" target="_blank" rel="noopener">${icono('whatsapp')}WhatsApp ${e.whatsapp.visible}</a>
        <p class="nav__mobile-info">${icono('reloj')}${e.horarioCorto}</p>
      </div>
    </nav>
    <div class="site-header__actions">
      <a class="btn btn--primary site-header__cta" href="${rutas.cotizar}" aria-label="Solicitar cotización"${cotizarActivo ? raw(' aria-current="page"') : ''}>
        ${icono('documento')}<span class="site-header__cta-text">Solicitar cotización</span>
        <span class="badge" data-cotizacion-contador hidden><span class="visually-hidden">Productos en su solicitud: </span><span data-contador-valor>0</span></span>
      </a>
      <button type="button" class="nav-toggle" aria-controls="menu-principal" aria-expanded="false" aria-label="Abrir menú" data-nav-toggle>
        <span class="nav-toggle__abrir">${icono('menu')}</span><span class="nav-toggle__cerrar">${icono('cerrar')}</span>
      </button>
    </div>
  </div>
</header>`;
}

function pie(ctx) {
  const e = ctx.empresa;
  const cats = ctx.catalogo.categorias;
  return html`<footer class="site-footer">
  <div class="container site-footer__grid">
    <div class="site-footer__marca">
      <a href="/" aria-label="Ferretería Fátima, ir al inicio">${logo('oscuro', { ancho: 200 })}</a>
      <p>Ferretería industrial en Pasto, Nariño. Materiales, accesorios, herramientas y servicios de roscado, ranurado y corte para empresas, talleres, contratistas y particulares.</p>
      <div class="site-footer__social">
        <a href="${e.redes.facebook}" target="_blank" rel="noopener" aria-label="Facebook de Ferretería Fátima (se abre en una pestaña nueva)">${icono('facebook')}</a>
        <a href="${enlaceWhatsapp(e.whatsapp.numero, e.whatsapp.mensajeInicial)}" target="_blank" rel="noopener" aria-label="WhatsApp de Ferretería Fátima (se abre en una pestaña nueva)">${icono('whatsapp')}</a>
      </div>
    </div>
    <div>
      <h2 class="site-footer__titulo">Productos</h2>
      <ul class="site-footer__links">
        ${cats.map((c) => html`<li><a href="${rutas.categoria(c.slug)}">${c.nombre}</a></li>`)}
      </ul>
    </div>
    <div>
      <h2 class="site-footer__titulo">Empresa</h2>
      <ul class="site-footer__links">
        <li><a href="${rutas.nosotros}">Nosotros</a></li>
        <li><a href="${rutas.servicios}">Servicios industriales</a></li>
        <li><a href="${rutas.cotizar}">Solicitar cotización</a></li>
        <li><a href="${rutas.faq}">Preguntas frecuentes</a></li>
        <li><a href="${rutas.contacto}">Contacto</a></li>
        <li><a href="${rutas.privacidad}">Política de privacidad y datos</a></li>
      </ul>
    </div>
    <div>
      <h2 class="site-footer__titulo">Contacto</h2>
      <ul class="site-footer__contacto">
        <li>${icono('ubicacion')}<span>${e.direccion.calle}, ${e.direccion.barrio}<br>${e.direccion.ciudad}, ${e.direccion.departamento}, ${e.direccion.pais}</span></li>
        <li>${icono('whatsapp')}<a href="${enlaceWhatsapp(e.whatsapp.numero, e.whatsapp.mensajeInicial)}" target="_blank" rel="noopener">${e.whatsapp.visible}</a></li>
        <li>${icono('telefono')}<a href="tel:${e.telefonos.celular.e164}">Llamar al ${e.telefonos.celular.visible}</a></li>
        ${e.correo ? html`<li>${icono('correo')}<a href="mailto:${e.correo}">${e.correo}</a></li>` : ''}
        <li>${icono('reloj')}<span>${e.horario.map((h) => html`${h.dias}: ${h.horas}<br>`)}</span></li>
      </ul>
    </div>
  </div>
  <div class="site-footer__legal">
    <div class="container site-footer__legal-inner">
      <p>© ${ctx.anio} ${e.nombre}. Pasto, Nariño, Colombia.</p>
      <p>Precios y disponibilidad sujetos a confirmación por parte de un asesor.</p>
    </div>
  </div>
</footer>`;
}

function whatsappFlotante(ctx) {
  const e = ctx.empresa;
  return html`<a class="wa-float" href="${enlaceWhatsapp(e.whatsapp.numero, e.whatsapp.mensajeInicial)}" target="_blank" rel="noopener" aria-label="Escribir por WhatsApp a Ferretería Fátima (se abre en una pestaña nueva)">${icono('whatsapp')}<span class="wa-float__texto">WhatsApp</span></a>`;
}

/** Aviso visible solo en desarrollo (npm run dev) para datos que faltan confirmar. */
export function pendiente(ctx, texto) {
  if (!ctx.dev) return '';
  return html`<p class="pendiente" role="note"><strong>Pendiente de confirmar:</strong> ${texto}</p>`;
}

export function layout(ctx, pagina, cuerpo) {
  return '<!doctype html>\n' + html`<html lang="es-CO">
${head(ctx, pagina)}
<body class="${pagina.claseBody || ''}">
${spriteIconos()}
${encabezado(ctx, pagina)}
<main id="contenido" tabindex="-1">
${cuerpo}
</main>
${pie(ctx)}
${pagina.sinWhatsappFlotante ? '' : whatsappFlotante(ctx)}
${ctx.dev ? raw('<div class="dev-banner" role="note">Vista de desarrollo: los recuadros amarillos marcan datos pendientes de confirmar y no aparecen en la versión publicada.</div>') : ''}
</body>
</html>
`;
}

export { logo };
