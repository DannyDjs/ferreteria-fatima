// Catálogo: búsqueda, filtro por subcategoría y carga progresiva.
// Las tarjetas ya vienen en el HTML (funciona sin JavaScript); aquí solo se ocultan o muestran.
// El estado se refleja en la URL (?q=…&sub=…) para poder compartirla y usar atrás/adelante.
import { puntaje } from './lib/busqueda.js';
import { urlWhatsapp } from './lib/whatsapp.js';

const raiz = document.querySelector('[data-catalogo]');

if (raiz) {
  const porPagina = Number(raiz.dataset.porPagina) || 12;
  const input = raiz.querySelector('[data-catalogo-busqueda]');
  const form = raiz.querySelector('[data-catalogo-form]');
  const grid = raiz.querySelector('[data-catalogo-grid]');
  const tarjetas = [...grid.querySelectorAll('[data-producto]')];
  const nombreDe = (t) => t.querySelector('.product-card__title').textContent;
  const cotizarVacio = raiz.querySelector('[data-catalogo-cotizar]');
  const rutaCotizar = cotizarVacio?.getAttribute('href'); // ya incluye la subcarpeta de publicación, si la hay
  const chips = [...raiz.querySelectorAll('[data-subcategoria]')].filter((el) => el.tagName === 'BUTTON');
  const estado = raiz.querySelector('[data-catalogo-estado]');
  const vacio = raiz.querySelector('[data-catalogo-vacio]');
  const termino = raiz.querySelector('[data-catalogo-termino]');
  const botonMas = raiz.querySelector('[data-catalogo-mas]');
  const limpiar = raiz.querySelectorAll('[data-catalogo-limpiar]');
  const waVacio = raiz.querySelector('[data-catalogo-whatsapp]');
  const numeroWa = waVacio ? new URL(waVacio.href).pathname.replace('/', '') : '';
  const subValidas = new Set(chips.map((c) => c.dataset.subcategoria));

  let visibles = porPagina;
  let temporizador;

  const leerUrl = () => {
    const p = new URLSearchParams(location.search);
    const sub = p.get('sub') || '';
    return { q: (p.get('q') || '').slice(0, 80), sub: subValidas.has(sub) ? sub : '' };
  };

  let actual = leerUrl();

  function escribirUrl(reemplazar) {
    const p = new URLSearchParams();
    if (actual.q) p.set('q', actual.q);
    if (actual.sub) p.set('sub', actual.sub);
    const url = `${location.pathname}${p.toString() ? `?${p}` : ''}`;
    if (url === location.pathname + location.search) return;
    history[reemplazar ? 'replaceState' : 'pushState'](actual, '', url);
  }

  function render({ anunciar = true } = {}) {
    input.value = actual.q;
    limpiar[0].hidden = !actual.q;
    chips.forEach((c) => c.setAttribute('aria-pressed', String(c.dataset.subcategoria === actual.sub)));

    // Con búsqueda, primero las coincidencias en el nombre; sin búsqueda, el orden original.
    const puntuadas = tarjetas
      .map((t, i) => ({ t, i, p: (!actual.sub || t.dataset.subcategoria === actual.sub) ? puntaje(nombreDe(t), t.dataset.texto, actual.q) : 0 }))
      .filter((x) => x.p > 0)
      .sort((a, b) => b.p - a.p || a.i - b.i);
    const coinciden = puntuadas.map((x) => x.t);
    const orden = actual.q ? [...coinciden, ...tarjetas.filter((t) => !coinciden.includes(t))] : tarjetas;
    orden.forEach((t) => grid.append(t));
    tarjetas.forEach((t) => { t.hidden = true; });
    coinciden.slice(0, visibles).forEach((t) => { t.hidden = false; });

    const total = coinciden.length;
    const mostrados = Math.min(visibles, total);
    vacio.hidden = total > 0;
    botonMas.hidden = mostrados >= total;
    botonMas.textContent = `Mostrar más productos (${total - mostrados} restantes)`;

    if (total === 0) {
      termino.textContent = actual.q || 'el filtro seleccionado';
      if (cotizarVacio) cotizarVacio.href = actual.q ? `${rutaCotizar}?producto=${encodeURIComponent(actual.q)}` : rutaCotizar;
      if (waVacio && numeroWa) {
        waVacio.href = urlWhatsapp(numeroWa, `Hola, Ferretería Fátima. Estoy buscando: ${actual.q || ''}`.trim());
      }
    }
    if (anunciar) {
      estado.textContent = total === 0
        ? 'Sin resultados'
        : `${total === tarjetas.length && !actual.q && !actual.sub ? '' : 'Resultados: '}${total} ${total === 1 ? 'línea de producto' : 'líneas de producto'}${mostrados < total ? ` (mostrando ${mostrados})` : ''}`;
    }
  }

  input.addEventListener('input', () => {
    clearTimeout(temporizador);
    temporizador = setTimeout(() => {
      actual = { ...actual, q: input.value.trim().slice(0, 80) };
      visibles = porPagina;
      escribirUrl(true);
      render();
    }, 180);
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    clearTimeout(temporizador);
    actual = { ...actual, q: input.value.trim().slice(0, 80) };
    visibles = porPagina;
    escribirUrl(false);
    render();
  });

  chips.forEach((chip) => chip.addEventListener('click', () => {
    actual = { ...actual, sub: chip.dataset.subcategoria };
    visibles = porPagina;
    escribirUrl(false);
    render();
  }));

  limpiar.forEach((b) => b.addEventListener('click', () => {
    actual = { q: '', sub: '' };
    visibles = porPagina;
    escribirUrl(false);
    render();
    input.focus();
  }));

  botonMas.addEventListener('click', () => {
    const primeraNueva = grid.querySelectorAll('[data-producto]:not([hidden])').length;
    visibles += porPagina;
    render();
    // Lleva el foco a la primera tarjeta nueva para usuarios de teclado.
    grid.querySelectorAll('[data-producto]:not([hidden])')[primeraNueva]?.querySelector('.product-card__title a')?.focus();
  });

  window.addEventListener('popstate', () => {
    actual = leerUrl();
    visibles = porPagina;
    render();
  });

  history.replaceState(actual, '');
  render();
}
