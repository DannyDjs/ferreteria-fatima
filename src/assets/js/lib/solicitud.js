// Lista de productos que la persona va agregando a su solicitud de cotización.
// Se guarda solo en su navegador (localStorage). Si el almacenamiento no está
// disponible (modo privado, bloqueado), la lista funciona solo en memoria.

const CLAVE = 'ff-solicitud-v1';
const MAX_ITEMS = 30;
let memoria = [];

function leer() {
  try {
    const datos = JSON.parse(localStorage.getItem(CLAVE) || '[]');
    return Array.isArray(datos) ? datos.filter((x) => x && typeof x.id === 'string' && typeof x.nombre === 'string').slice(0, MAX_ITEMS) : [];
  } catch {
    return memoria;
  }
}

function guardar(lista) {
  memoria = lista;
  try { localStorage.setItem(CLAVE, JSON.stringify(lista)); } catch { /* sin almacenamiento: queda en memoria */ }
  window.dispatchEvent(new CustomEvent('solicitud:cambio', { detail: lista }));
}

export const solicitud = {
  items: leer,
  tiene: (id) => leer().some((x) => x.id === id),
  agregar({ id, nombre, referencia = '' }) {
    const lista = leer();
    if (lista.some((x) => x.id === id) || lista.length >= MAX_ITEMS) return false;
    guardar([...lista, { id, nombre: String(nombre).slice(0, 150), referencia: String(referencia).slice(0, 120) }]);
    return true;
  },
  quitar(id) { guardar(leer().filter((x) => x.id !== id)); },
  vaciar() { guardar([]); },
};

// Sincroniza entre pestañas abiertas.
window.addEventListener('storage', (e) => {
  if (e.key === CLAVE) window.dispatchEvent(new CustomEvent('solicitud:cambio', { detail: leer() }));
});
