# Ferretería Fátima — Sitio web

Sitio web corporativo multipágina de **Ferretería Fátima** (Calle 18 # 11-06, barrio Fátima, Pasto, Nariño):
catálogo de líneas de producto, servicios industriales (roscado, ranurado y corte), solicitudes de
cotización por formulario o WhatsApp, contacto, preguntas frecuentes y política de datos.

- **Stack:** HTML, CSS y JavaScript sin framework. Un generador estático propio en Node.js
  (`scripts/build.js`, **sin dependencias**) arma las páginas desde plantillas y datos JSON.
- **Resultado:** 70 páginas HTML estáticas en `dist/` con URLs limpias (`/productos/tuberias/`).
- **Formularios:** se envían a Formspree (servicio externo); alternativa por WhatsApp con mensaje organizado.
- **Publicación:** cualquier hosting estático. Configurado para Cloudflare Workers (`wrangler.jsonc`).

---

## 1. Diagnóstico inicial (octubre de 2026)

| Elemento | Hallazgo | Decisión |
|---|---|---|
| Carpeta del proyecto | Vacía. | Proyecto nuevo, sin destruir nada. |
| Sitio anterior (`../PAGINA FERRETERIA`) | Sitio HTML + Bootstrap del mismo negocio, con datos reales (WhatsApp, dirección, horario, Formspree). | No se modificó. Se reutilizaron sus datos de contacto y la foto de la fachada. |
| Catálogo en Google Sheets del sitio anterior | Solo contiene filas de prueba («yucas», «Aleja»). | No se usa. Se creó `src/data/catalogo.json`. |
| Logos oficiales | `logofatimaclaro.jpeg`, `logofatimaoscuro.jpeg` y versiones PNG transparentes (cotizador). | Copiados sin modificar a `src/assets/img/brand/originales/`; se publican versiones redimensionadas. |
| Colores | Medidos en el logo: turquesa `#00A88C`, azul marino `#001A35`. | Paleta en `src/assets/css/base.css`. |
| Fotos de categorías del sitio anterior | Imágenes de internet; una con marca de agua de otra empresa (TECTUL). | **No se usan.** Se muestran íconos propios hasta tener fotos reales. |

## 2. Páginas y rutas

| Ruta | Página |
|---|---|
| `/` | Inicio: hero con foto de la sede, buscador, líneas de negocio, categorías, servicios, beneficios, proceso de cotización y ubicación |
| `/nosotros/` | Presentación, actividad comercial, compromiso con el cliente |
| `/productos/` | Catálogo completo con buscador, categorías y carga progresiva |
| `/productos/<categoría>/` | 9 páginas de categoría con filtro por subcategoría |
| `/productos/<categoría>/<producto>/` | 52 fichas de línea de producto |
| `/servicios/` | Roscado, ranurado y corte (anclas `#roscado-de-tuberia`, `#ranurado-de-tuberia`, `#corte-de-materiales`) |
| `/cotizar/` | Formulario de cotización con varios productos |
| `/contacto/` | WhatsApp y llamadas, correo, dirección, guía «¿Qué necesita?», horario y mapa bajo demanda (sin formulario: el único formulario del sitio es `/cotizar/`) |
| `/preguntas-frecuentes/` | Preguntas frecuentes |
| `/politica-de-privacidad/` | Política de privacidad y tratamiento de datos (Ley 1581 de 2012) |
| cualquier otra | `404.html` personalizada (respuesta HTTP 404) |

Parámetros útiles: `/productos/?q=codos`, `/productos/valvulas/?sub=por-material`,
`/cotizar/?agregar=<id-producto>`, `/cotizar/?servicio=<slug>`, `/cotizar/?producto=<texto libre>`.

## 3. Estructura de archivos

```
ferreteriaFatima/
├─ src/
│  ├─ data/                  ← DATOS EDITABLES (sin tocar código)
│  │  ├─ empresa.json        teléfonos, dirección, horario, WhatsApp, formulario, lista de pendientes
│  │  ├─ catalogo.json       categorías, subcategorías y líneas de producto
│  │  └─ servicios.json      servicios industriales
│  ├─ pages/                 una plantilla por página (inicio, nosotros, productos, servicios, cotizar, contacto, otras)
│  ├─ templates/             partes compartidas: layout (encabezado/pie), componentes, íconos, rutas, html seguro
│  └─ assets/
│     ├─ css/                base · layout · components · pages (se unen y minifican en site.css)
│     ├─ js/                 main (común) · catalogo · cotizar · lib/ (funciones puras probadas)
│     ├─ img/brand/          logos (originales/ no se publica)
│     ├─ img/fotos/          fachada de la sede (WebP 800/1280/1920 + JPG)
│     └─ fonts/              Barlow y Barlow Condensed (WOFF2, licencia OFL, servidas localmente)
├─ public/                   archivos copiados tal cual: _headers (seguridad y caché), favicon, íconos, imagen Open Graph
├─ scripts/
│  ├─ build.js               genera dist/ (valida el catálogo, páginas, sitemap, robots, manifest)
│  └─ serve.js               servidor local: URLs limpias, 404, cabeceras de _headers, gzip, recarga al guardar
├─ tests/                    pruebas con node --test (sin dependencias)
├─ dist/                     sitio generado (no se edita a mano; no se sube al repositorio)
├─ wrangler.jsonc            publicación en Cloudflare (solo dist/)
├─ .env.example              variables opcionales
└─ package.json
```

## 4. Ejecutar el proyecto en Visual Studio Code

Requisito: **Node.js 22 o superior** (`node -v`). No hay que instalar paquetes: no hay `npm install`.

1. *Archivo → Abrir carpeta…* y elegir `ferreteriaFatima`.
2. Abrir la terminal integrada (*Terminal → Nueva terminal*).
3. Ejecutar el modo desarrollo:

```bash
npm run dev
```

4. Abrir <http://localhost:5050>. Al guardar cualquier archivo de `src/` el sitio se recompila
   (recargue el navegador). En este modo se ven **recuadros amarillos** con los datos pendientes de confirmar.
   No aparecen en la versión de producción.

Otros comandos:

| Comando | Qué hace |
|---|---|
| `npm run build` | Genera la versión de producción en `dist/` y lista los datos pendientes. |
| `npm start` | Compila producción y la sirve en <http://localhost:5050> (como quedará publicada). |
| `npm test` | Compila y ejecuta las 26 pruebas automáticas. |
| `npm run deploy` | Compila y publica en Cloudflare (requiere `wrangler login`, ver §9). |

> Abrir `dist/index.html` con doble clic **no** es recomendable: las rutas son absolutas (`/assets/...`)
> y necesitan un servidor. Use `npm start`.

## 5. Configuración

### Variables de entorno (opcionales)

Copiar `.env.example` como `.env`. Ninguna es secreta.

| Variable | Uso |
|---|---|
| `FORM_ENDPOINT` | URL del servicio que recibe los formularios. Si no se define, se usa `empresa.json → formularios.endpoint`. |
| `PORT` | Puerto del servidor local (por defecto 5050; si está ocupado usa el siguiente libre). |

### Datos del negocio

Todo dato comercial está en `src/data/empresa.json` y se replica automáticamente en el encabezado,
el pie, la página de contacto, los mensajes de WhatsApp, la política de datos y los datos estructurados (Schema.org).
El campo `"correo": null` hace que el sitio **no muestre correo** hasta que se defina uno real.

### Catálogo: se edita en Google Sheets

Los **productos** se editan en una hoja de Google Sheets, sin tocar código. Guía paso a paso para
configurarla y usarla: **[docs/catalogo-google-sheets.md](docs/catalogo-google-sheets.md)**.

- **Hoja publicada como CSV:** variable de GitHub `CATALOGO_CSV_URL`. Sin ella, o si falla, se usa la copia local
  `src/data/catalogo.csv`, generada a partir del documento «Catálogo general de productos».
- **Categorías:** las 12 están en `src/data/catalogo.json` (nombre, ícono y textos). Las subcategorías se crean
  solas a partir de la hoja.
- **Lectura y validación:** `scripts/catalogo.js` lee la hoja. Las filas con errores se omiten con un aviso y no
  detienen la publicación. Las filas con «Publicar: No» quedan ocultas.
- **Fotos:** con la columna «Imagen» (enlace https o de Google Drive), la compilación las descarga al sitio,
  porque la política de seguridad solo permite imágenes propias.
- **Actualización:** GitHub Actions vuelve a publicar cada hora, en cada `git push` y con «Run workflow».
- **No** agregar precios ni existencias sin datos reales: el sitio funciona con «Consultar precio».

## 6. Integraciones

| Integración | Estado | Configuración |
|---|---|---|
| **Solicitudes de cotización** | **Google Apps Script** (`docs/solicitudes.gs`): cada solicitud se guarda en la hoja privada «Solicitudes página web» y llega por correo. Sin Formspree. | Guía y mantenimiento: [docs/solicitudes-google.md](docs/solicitudes-google.md). URL en `empresa.json → "formularios" → "endpoint"`. |
| **WhatsApp** (`wa.me/573154864439`) | Funcional. Mensajes codificados con `encodeURIComponent`. | Cambiar el número en `empresa.json → whatsapp.numero` (formato internacional sin `+`). |
| **Google Maps** | Se carga solo si la persona pulsa «Ver mapa aquí» (privacidad y rendimiento). | `empresa.json → mapaEmbed` y `mapaUrl`. |
| **Facebook** | Enlace en el pie. | `empresa.json → redes.facebook`. |

Formspree recibe los campos ya organizados: `codigo_solicitud` (formato `SOL-AAMMDD-XXXX`, también visible
para el cliente), datos del solicitante, `productos` (una línea por producto con referencia, cantidad y unidad),
descripción, observaciones y la constancia de autorización de datos con fecha. El campo `email` queda como
dirección de respuesta.

## 7. Seguridad y privacidad (controles implementados)

- **Sin secretos en el código**: el sitio no usa claves API. El endpoint de Formspree es público por diseño.
- **CSP estricta** en `public/_headers`: solo scripts y estilos propios, sin código en línea, `connect-src`
  limitado a Formspree y `frame-src` limitado a Google (mapa). También `nosniff`, `X-Frame-Options: DENY`,
  `Referrer-Policy`, `Permissions-Policy`, HSTS y `COOP`.
- **Plantillas con escape automático** (`src/templates/html.js`): todo texto de los JSON se escapa al generar HTML.
- **Formularios**: validación en el navegador con mensajes por campo y resumen accesible, límites de longitud,
  limpieza de caracteres de control, campo trampa `_gotcha` y tiempo mínimo de llenado contra spam,
  consentimiento obligatorio (Ley 1581 de 2012), aviso de que la solicitud no es una cotización oficial.
- **Datos personales**: no se guardan en el navegador. Solo la lista de productos de la solicitud se guarda en
  `localStorage` (con alternativa en memoria si está bloqueado). No hay cookies ni analítica.
- `dist/` publica solo archivos públicos (los logos originales y los archivos de configuración no salen).

**Limitaciones conocidas:** la validación del lado del servidor y el filtrado de spam dependen de Formspree
(no hay backend propio). Si el spam aumenta, active reCAPTCHA o Turnstile en Formspree y agregue su dominio a la CSP.
La política de privacidad es un **documento base que no ha sido revisado por un abogado**: debe validarse
antes de publicar el sitio y completarse con un correo para el ejercicio de derechos.
Ningún sitio es completamente seguro; estos controles reducen los riesgos habituales de un sitio estático.

## 8. Pruebas realizadas y resultados reales

### Automáticas (`npm test`): 26 pruebas, 26 aprobadas

- **Funciones** (`tests/lib.test.js`): validación de teléfono, correo, NIT y cantidad; codificación del mensaje
  y del enlace de WhatsApp; búsqueda sin tildes ni plurales y su orden por relevancia; formato del código de solicitud.
- **Sitio generado** (`tests/sitio.test.js`):
  - Las 70 páginas existen y cada una tiene un solo `h1`, título y descripción únicos y `canonical` correcto.
  - Todos los enlaces, imágenes y anclas internas existen; no hay enlaces `#` vacíos.
  - Todas las imágenes tienen `alt` y dimensiones, y todos los campos de formulario tienen etiqueta.
  - No hay código en línea (compatibilidad con la CSP), el JSON-LD es válido y no contiene calificaciones ni correos inventados.
  - Producción no muestra avisos de desarrollo, no se publican precios ni secretos, y el sitemap y robots son correctos.
  - WhatsApp usa siempre el número configurado.
- **Servidor** (`tests/servidor.test.js`): respuestas 200 con cabeceras de seguridad, redirección 308
  a la URL con barra final, 404 personalizado y bloqueo de rutas fuera de `dist/`.

### Manuales en navegador (Chrome, escritorio 1280–1366 px y móvil 360 px)

- Todas las páginas cargan sin errores en la consola.
- **Menú móvil:**
  - Abre, mueve el foco al primer enlace y bloquea el desplazamiento de fondo.
  - Se cierra con Escape devolviendo el foco al botón.
  - Se cierra solo al pasar a escritorio.
- **Sin desbordamiento horizontal a 360 px.**
- **Catálogo:**
  - Búsqueda con tildes y mayúsculas, sincronizada con la URL.
  - Botón Atrás del navegador.
  - Filtro por subcategoría.
  - Estado vacío con WhatsApp y cotización precargados con el término buscado.
  - «Mostrar más» de 12 en 12, con el foco en el primer producto nuevo.
- **Lista de cotización:**
  - Agregar y quitar productos.
  - Contador en el encabezado.
  - Persistencia entre páginas.
  - Precarga en `/cotizar/` desde la lista, `?agregar=` y `?servicio=`.
- **Formulario de cotización:**
  - Errores por campo con resumen enfocable.
  - Agregar y eliminar filas, renumerando IDs y etiquetas.
  - Mensaje de WhatsApp verificado, incluidos caracteres especiales.
  - Envío con estado de carga.
  - Ante error del servicio: mensaje claro, conserva los datos y ofrece WhatsApp.
  - Ante éxito: oculta el formulario, muestra el código y vacía la lista.
  - Los envíos se probaron interceptando `fetch`; no se envió nada real.
- **Contacto:**
  - Validación y envío (interceptado).
  - Mapa bajo demanda: se detectó y corrigió un bloqueo de la CSP.

### Lighthouse 12.6 (servidor local con gzip, versión de producción)

| Página | Escritorio (rend./acces./b. prácticas/SEO) | Móvil (rend./acces./b. prácticas/SEO) |
|---|---|---|
| Inicio | 99 / 100 / 100 / 100 | 95 / 100 / 100 / 100 |
| Productos | 98 / 100 / 100 / 100 | 93 / 100 / 100 / 100 |
| Ficha de producto | 99 / 100 / 100 / 100 | 98 / 100 / 100 / 100 |
| Servicios | 99 / 100 / 100 / 100 | 95 / 100 / 100 / 100 |
| Cotizar | 100 / 100 / 100 / 100 | 94 / 100 / 100 / 100 |

Los resultados varían según la red y el equipo. Hay que medir de nuevo sobre el dominio publicado.

## 9. Publicación

El sitio es estático: se publica el contenido de `dist/` en cualquier hosting.
Antes de publicar, revise la **lista de pendientes** (§10).

### Opción actual — GitHub Pages (automática)

El flujo `.github/workflows/pages.yml` se ejecuta en cada `git push` a `main`: corre las pruebas,
compila y publica en `https://<usuario>.github.io/<repositorio>/`. Si una prueba falla, no se publica.

- Configuración única en GitHub: *Settings → Pages → Source: **GitHub Actions***.
- Como Pages publica en una subcarpeta, la compilación usa `BASE_PATH=/<repositorio>` (antepone la
  subcarpeta a todas las rutas) y `SITE_URL` (canonical, sitemap y datos estructurados). Ambas las pone el flujo.
- GitHub Pages no lee `_headers`: la política de seguridad (CSP) va también como `<meta>` en cada página;
  HSTS y `X-Frame-Options` no se aplican allí.
- Para publicar cambios: `git add -A`, `git commit -m "mensaje"` y `git push`.

Con dominio propio (`ferreteriafatima.com`) en Pages: *Settings → Pages → Custom domain*, y en el flujo
quitar `BASE_PATH` y poner `SITE_URL: https://ferreteriafatima.com`.

### Opción A — Cloudflare Workers (configurada; misma plataforma del sitio anterior)

```bash
npx wrangler login
```

```bash
npm run deploy
```

`wrangler.jsonc` publica solo `dist/`, responde 404 con `404.html` y agrega la barra final a las rutas.
`_headers` aplica las cabeceras de seguridad. Si se conecta el repositorio de GitHub en *Workers & Pages*:
comando de compilación `node scripts/build.js`, comando de despliegue `npx wrangler deploy`, variable `NODE_VERSION=22`.

### Opción B — Netlify o Cloudflare Pages

Directorio de publicación `dist`, comando `node scripts/build.js`. Ambos leen `_headers`.

### Después de publicar

1. Apuntar el dominio `ferreteriafatima.com` (si se confirma) y verificar HTTPS.
2. Registrar el sitio en Google Search Console y enviar `https://ferreteriafatima.com/sitemap.xml`.
3. Crear o actualizar el **Perfil de Empresa de Google** con la misma dirección, teléfono y horario
   (clave para el posicionamiento local en Pasto).
4. Enviar una solicitud real de prueba desde `/cotizar/` y confirmar que llega al correo.

## 10. Datos comerciales pendientes de confirmar

Se listan en `src/data/empresa.json → "pendientes"`, se imprimen en cada compilación y, en `npm run dev`,
aparecen como recuadros amarillos en la página correspondiente:

1. Correo: se usa provisionalmente dannyramirezch73@gmail.com; se cambia en `src/data/empresa.json → "correo"`.
2. (Resuelto) Teléfono fijo retirado: llamadas y WhatsApp al 315 486 4439.
3. (Resuelto) Horario de festivos: 8:00 a. m. – 12:00 m.
4. Mapa: confirmar que la ubicación incrustada señala la sede exacta.
5. Foto de la fachada: confirmar que corresponde al aspecto actual. El sitio anterior tenía una versión
   sin letrero y otra con letrero; se usa la versión con letrero.
6. Formspree: confirmar la cuenta y el correo de destino. Hacer un envío real de prueba.
7. Años de experiencia: el sitio anterior decía «más de 20 años»; no se publica hasta confirmarlo.
8. NIT 5.203.413-9 y razón social del responsable del tratamiento de datos (para la política).
9. Catálogo: referencias, marcas, medidas, unidades y fotos reales de cada línea; denominación exacta de «Tubería PE-LP».
10. Servicios: capacidades técnicas ya cargadas en `servicios.json`; faltan tiempos de entrega y fotos reales (campo `"imagen"`). No se hacen entregas a domicilio.
11. Dominio definitivo (`ferreteriafatima.com`), usado en canonical, sitemap y datos estructurados.
12. Historia, misión y visión: la página Nosotros deja el espacio preparado y no inventa contenido.
13. Revisión jurídica de la política de privacidad.

## 11. Accesibilidad y rendimiento (resumen técnico)

- **Estructura:** HTML semántico, un solo `h1` por página y enlace «Saltar al contenido».
- **Teclado y lectores de pantalla:** foco visible, `aria-current` en la navegación, regiones `aria-live` para los resultados y errores asociados con `aria-describedby`.
- **Contraste:** verificado; los botones usan el tono `#007A66` sobre blanco (5,3:1).
- **Movimiento reducido:** se respeta `prefers-reduced-motion`.
- **Fuentes:** propias, en WOFF2, con `font-display: swap` y precarga de los dos pesos principales.
- **Imágenes:** WebP con `srcset`, dimensiones explícitas (sin saltos de diseño), carga diferida fuera de la primera pantalla y prioridad alta para la foto principal.
- **CSS y JavaScript:** un solo CSS minificado (9,7 KB comprimido) y módulos JS pequeños sin librerías.

## 12. Mejoras recomendadas para una segunda fase

1. **Fotos reales** de productos, de la bodega y de los servicios en operación (reemplazan los íconos automáticamente).
2. **Inventario real:** cargar referencias, medidas y marcas por línea, y luego una ficha por referencia.
3. **Gestión del catálogo sin código:** Decap CMS o una hoja de cálculo que se convierta a JSON al compilar.
4. **Backend propio para cotizaciones** (por ejemplo, un Worker de Cloudflare). Permitiría:
   - Validación del lado del servidor.
   - Numeración consecutiva compatible con el cotizador de escritorio existente.
   - Copia automática al cliente.
   - Protección con Turnstile.
5. **Analítica respetuosa de la privacidad** (Cloudflare Web Analytics, sin cookies) para medir búsquedas y solicitudes.
6. **Perfil de Empresa de Google** y reseñas reales de clientes (nunca inventadas).
7. **Páginas por servicio**, cuando existan capacidades técnicas confirmadas, para posicionar mejor «roscado de tubería Pasto».
8. **Exportar la solicitud a PDF** con el formato de la plantilla de cotización de la empresa.
