// Comportamiento común a todas las páginas: menú móvil, encabezado, lista de
// cotización (contador y botones "Agregar") y mapa con carga bajo demanda.
import { solicitud } from './lib/solicitud.js';

/* ---------- Menú móvil ---------- */
function iniciarMenu() {
  const boton = document.querySelector('[data-nav-toggle]');
  const nav = document.querySelector('[data-nav]');
  const header = document.querySelector('[data-header]');
  if (!boton || !nav) return;
  const escritorio = window.matchMedia('(min-width: 1024px)');

  const abrir = (abierto) => {
    if (abierto) {
      // El panel empieza justo debajo del encabezado (la barra superior puede estar visible o no).
      nav.style.setProperty('--nav-top', `${Math.max(header.getBoundingClientRect().bottom, 0)}px`);
    }
    boton.setAttribute('aria-expanded', String(abierto));
    boton.setAttribute('aria-label', abierto ? 'Cerrar menú' : 'Abrir menú');
    nav.classList.toggle('is-open', abierto);
    document.documentElement.classList.toggle('nav-abierta', abierto);
    if (abierto) nav.querySelector('a')?.focus();
  };

  boton.addEventListener('click', () => abrir(boton.getAttribute('aria-expanded') !== 'true'));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && nav.classList.contains('is-open')) { abrir(false); boton.focus(); }
  });
  // Mantener el foco dentro del panel abierto (Tab al final vuelve al botón).
  nav.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab' || !nav.classList.contains('is-open')) return;
    const enfocables = nav.querySelectorAll('a, button');
    const ultimo = enfocables[enfocables.length - 1];
    if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); boton.focus(); }
  });
  escritorio.addEventListener('change', (e) => { if (e.matches) abrir(false); });
}

/* ---------- Sombra del encabezado al desplazarse ---------- */
function iniciarEncabezado() {
  const header = document.querySelector('[data-header]');
  if (!header) return;
  const actualizar = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
  actualizar();
  window.addEventListener('scroll', actualizar, { passive: true });
}

/* ---------- Lista de cotización ---------- */
function actualizarSolicitud() {
  const items = solicitud.items();
  document.querySelectorAll('[data-cotizacion-contador]').forEach((badge) => {
    badge.hidden = items.length === 0;
    badge.querySelector('[data-contador-valor]').textContent = String(items.length);
    badge.closest('a')?.setAttribute('aria-label', items.length
      ? `Solicitar cotización (${items.length} ${items.length === 1 ? 'producto' : 'productos'} en su solicitud)`
      : 'Solicitar cotización');
  });
  document.querySelectorAll('[data-agregar-cotizacion]').forEach((btn) => {
    btn.setAttribute('aria-pressed', String(items.some((x) => x.id === btn.dataset.agregarCotizacion)));
  });
}

function iniciarBotonesCotizacion() {
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-agregar-cotizacion]');
    if (!btn) return;
    const id = btn.dataset.agregarCotizacion;
    if (solicitud.tiene(id)) solicitud.quitar(id);
    else solicitud.agregar({ id, nombre: btn.dataset.nombre, referencia: btn.dataset.referencia });
  });
  window.addEventListener('solicitud:cambio', actualizarSolicitud);
  actualizarSolicitud();
}

/* ---------- Mapa bajo demanda ---------- */
function iniciarMapa() {
  document.querySelectorAll('[data-mapa]').forEach((mapa) => {
    mapa.querySelector('[data-mapa-cargar]')?.addEventListener('click', () => {
      const iframe = document.createElement('iframe');
      iframe.src = mapa.dataset.src;
      iframe.title = 'Mapa de la ubicación de Ferretería Fátima en Pasto';
      iframe.loading = 'lazy';
      iframe.referrerPolicy = 'no-referrer-when-downgrade';
      iframe.allowFullscreen = true;
      mapa.append(iframe);
      mapa.classList.add('is-loaded');
      iframe.focus();
    });
  });
}

iniciarMenu();
iniciarEncabezado();
iniciarBotonesCotizacion();
iniciarMapa();
