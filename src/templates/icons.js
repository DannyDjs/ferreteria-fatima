// Iconos SVG en línea (trazo de 24x24). Se insertan como <svg><use href="#i-nombre"></svg>
// a partir de un sprite incluido una vez por página.
import { raw } from './html.js';

const T = (d) => `<path d="${d}"/>`;

const ICONOS = {
  menu: T('M4 6h16M4 12h16M4 18h16'),
  cerrar: T('M18 6 6 18M6 6l12 12'),
  telefono: T('M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z'),
  correo: '<rect x="2" y="4" width="20" height="16" rx="2"/>' + T('m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7'),
  ubicacion: T('M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z') + '<circle cx="12" cy="10" r="3"/>',
  reloj: '<circle cx="12" cy="12" r="10"/>' + T('M12 6v6l4 2'),
  flecha: T('M5 12h14M12 5l7 7-7 7'),
  buscar: '<circle cx="11" cy="11" r="7"/>' + T('m21 21-4.3-4.3'),
  mas: T('M12 5v14M5 12h14'),
  eliminar: T('M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6'),
  check: T('M20 6 9 17l-5-5'),
  chevron: T('m9 18 6-6-6-6'),
  abajo: T('m6 9 6 6 6-6'),
  documento: T('M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8'),
  lista: '<rect x="8" y="2" width="8" height="4" rx="1"/>' + T('M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2M12 11h4M12 16h4M8 11h.01M8 16h.01'),
  edificio: '<rect x="4" y="2" width="16" height="20" rx="2"/>' + T('M9 22v-4h6v4M8 6h.01M12 6h.01M16 6h.01M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M16 14h.01'),
  personas: T('M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2') + '<circle cx="9" cy="7" r="4"/>' + T('M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75'),
  escudo: T('M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z') + T('m9 12 2 2 4-4'),
  info: '<circle cx="12" cy="12" r="10"/>' + T('M12 16v-4M12 8h.01'),
  alerta: T('m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3ZM12 9v4M12 17h.01'),
  externo: T('M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6'),
  facebook: T('M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z'),
  cajas: T('M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16ZM3.3 7 12 12l8.7-5M12 22V12'),
  // Categorías
  gas: T('M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z'),
  electrico: T('M13 2 3 14h9l-1 8 10-12h-9l1-8z'),
  metales: T('M2.5 20h8l-1.5-5h-5zM13.5 20h8l-1.5-5h-5zM8 13h8l-1.5-5h-5z'),
  tuberia: T('M5 9h14M5 15h14M5 7v10M19 7v10M2 9.5v5M22 9.5v5M2 12h3M19 12h3'),
  valvula: T('M2 13h4M18 13h4M6 10h12v6H6zM12 10V6M8 4h8'),
  herramienta: T('M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z'),
  tornillo: T('M7 2h10v4H7zM9.5 6v12l2.5 4 2.5-4V6M9.5 9l5 1.5M9.5 12.5l5 1.5M9.5 16l5 1.5'),
  rodamiento: '<circle cx="12" cy="12" r="9.5"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="5.25" r="1.4"/><circle cx="18.75" cy="12" r="1.4"/><circle cx="12" cy="18.75" r="1.4"/><circle cx="5.25" cy="12" r="1.4"/>',
  accesorio: T('M4 21v-8a8 8 0 0 1 8-8h8M9 21v-8a3 3 0 0 1 3-3h8M2.5 21h8M20 3.5v8'),
  // Servicios
  rosca: T('M2 9h20v6H2zM12 9l-1.5 6M15 9l-1.5 6M18 9l-1.5 6M21 9l-1.5 6'),
  ranura: T('M2 9h20v6H2zM15 8v8M17 8v8M2 12h2'),
  corte: '<circle cx="12" cy="9" r="6"/><circle cx="12" cy="9" r="1.5"/>' + T('M2 19h20M2 22h20M12 15v4'),
};

const WHATSAPP = '<path fill="currentColor" stroke="none" d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.26-.46-2.39-1.47-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.92-2.21-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.07c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.7.63.71.22 1.36.19 1.87.12.57-.09 1.76-.72 2-1.42.25-.69.25-1.29.18-1.41-.08-.13-.28-.2-.57-.35zM12.05 21.8h-.01a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 0 1-1.51-5.26c0-5.45 4.44-9.88 9.89-9.88 2.64 0 5.12 1.03 6.99 2.9a9.82 9.82 0 0 1 2.89 6.99c0 5.45-4.44 9.88-9.88 9.88zm8.41-18.3A11.81 11.81 0 0 0 12.05 0C5.5 0 .16 5.34.16 11.89c0 2.1.55 4.14 1.59 5.95L.06 24l6.3-1.65a11.88 11.88 0 0 0 5.69 1.45h.01c6.55 0 11.89-5.34 11.89-11.89 0-3.18-1.24-6.17-3.49-8.41z"/>';

/** Sprite con todos los iconos; se incluye una vez al inicio del <body>. */
export function spriteIconos() {
  const simbolos = Object.entries(ICONOS)
    .map(([n, contenido]) => `<symbol id="i-${n}" viewBox="0 0 24 24">${contenido}</symbol>`)
    .join('');
  return raw(
    `<svg xmlns="http://www.w3.org/2000/svg" class="sprite" aria-hidden="true" focusable="false">` +
    `<defs>${simbolos}<symbol id="i-whatsapp" viewBox="0 0 24 24">${WHATSAPP}</symbol></defs></svg>`
  );
}

export function icono(nombre, clase = '') {
  if (nombre !== 'whatsapp' && !ICONOS[nombre]) throw new Error(`Icono desconocido: ${nombre}`);
  return raw(`<svg class="icon${clase ? ' ' + clase : ''}" aria-hidden="true" focusable="false"><use href="#i-${nombre}"/></svg>`);
}

export const NOMBRES_ICONOS = [...Object.keys(ICONOS), 'whatsapp'];
