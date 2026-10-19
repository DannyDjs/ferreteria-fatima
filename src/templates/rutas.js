// Rutas públicas del sitio. Todas terminan en "/" (cada página se publica como carpeta/index.html).
export const rutas = {
  inicio: '/',
  nosotros: '/nosotros/',
  productos: '/productos/',
  categoria: (slug) => `/productos/${slug}/`,
  producto: (categoria, id) => `/productos/${categoria}/${id}/`,
  servicios: '/servicios/',
  servicio: (slug) => `/servicios/#${slug}`,
  cotizar: '/cotizar/',
  cotizarProducto: (id) => `/cotizar/?agregar=${encodeURIComponent(id)}`,
  cotizarServicio: (slug) => `/cotizar/?servicio=${encodeURIComponent(slug)}`,
  contacto: '/contacto/',
  faq: '/preguntas-frecuentes/',
  privacidad: '/politica-de-privacidad/',
};

export const menuPrincipal = [
  { clave: 'inicio', texto: 'Inicio', href: rutas.inicio },
  { clave: 'nosotros', texto: 'Nosotros', href: rutas.nosotros },
  { clave: 'productos', texto: 'Productos', href: rutas.productos },
  { clave: 'servicios', texto: 'Servicios', href: rutas.servicios },
  { clave: 'contacto', texto: 'Contacto', href: rutas.contacto },
];

/** Enlace de WhatsApp con mensaje codificado. */
export function enlaceWhatsapp(numero, mensaje) {
  return `https://wa.me/${numero}${mensaje ? `?text=${encodeURIComponent(mensaje)}` : ''}`;
}
