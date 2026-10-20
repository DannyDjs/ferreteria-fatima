# Solicitudes de cotización con Google (sin Formspree)

Las solicitudes del formulario **Solicitar cotización** quedan:

1. guardadas en una hoja de Google **«Solicitudes»**, con una fila por solicitud;
2. enviadas por **correo** a la ferretería, con «Responder» dirigido al correo del cliente.

Todo funciona con la cuenta de Google de la ferretería. Es gratis y no tiene límite mensual: Gmail permite
unos 100 correos al día y, si se pasa ese tope, la solicitud igual queda en la hoja.

> **Importante:** use una hoja **nueva y privada**, distinta de la hoja del catálogo. La hoja del catálogo
> se comparte con enlace, y por ese enlace cualquiera podría ver los datos de los clientes.

## Instalación (una sola vez, unos 10 minutos)

### 1. Crear la hoja privada

1. Con la cuenta de Google de la ferretería, entre a <https://sheets.google.com> y cree una hoja en blanco.
2. Póngale nombre: **«Solicitudes página web»**. **No la comparta** con enlace público.

### 2. Pegar el script

1. En esa hoja: **Extensiones → Apps Script**.
2. Borre lo que haya en el editor y pegue todo el contenido de `docs/solicitudes.gs`.
3. Pulse **Guardar** (ícono de disquete).

### 3. (Opcional) Elegir el correo que recibe las solicitudes

Por defecto llegan al correo de la cuenta de Google donde está el script. Para usar otro:
**⚙ Configuración del proyecto → Propiedades de la secuencia de comandos → Agregar propiedad** →
Propiedad `CORREO_DESTINO`, valor: el correo que debe recibirlas → **Guardar**.

### 4. Publicar el script como aplicación web

1. Botón azul **Implementar → Nueva implementación**.
2. En «Seleccionar tipo» (ícono de engranaje), elija **Aplicación web**.
3. **Descripción:** `Solicitudes página web`.
4. **Ejecutar como:** **Yo** (la cuenta de la ferretería).
5. **Quién tiene acceso:** **Cualquier usuario**. Esto es necesario para que la página pueda enviar
   solicitudes; nadie puede leer la hoja por este medio.
6. **Implementar**. Google pide autorización: **Autorizar acceso** → elija la cuenta →
   **Configuración avanzada → Ir a … (no seguro)** → **Permitir**. El aviso aparece porque el script es
   propio y no está verificado por Google.
7. **Copie la «URL de la aplicación web»**. Empieza por `https://script.google.com/macros/s/` y termina en `/exec`.

### 5. Conectar la página

Envíe esa URL al desarrollador, o cámbiela usted mismo:

1. En `src/data/empresa.json`, reemplace el valor de `"formularios"` → `"endpoint"` por la URL copiada.
2. Suba el cambio a GitHub. La página se publica en 2 a 3 minutos.
3. Envíe una solicitud de prueba desde **Solicitar cotización**. Debe aparecer una fila en la pestaña
   **Solicitudes** de la hoja (se crea sola la primera vez) y llegar el correo.

## Uso diario

- Cada solicitud llega por correo. Para contestar al cliente, use **Responder**.
- En la hoja, la columna **Estado** empieza en «Nueva». Cámbiela a «Respondida» o «Cotizada» para llevar el control.
- Se pueden usar filtros, ordenar por fecha o descargar la hoja en Excel (**Archivo → Descargar**).

## Si cambia el script

Si se modifica el código, publique la nueva versión **sin cambiar la URL**:
**Implementar → Administrar implementaciones → ✏ Editar → Versión: Nueva versión → Implementar**.
(Una «Nueva implementación» crearía otra URL y habría que cambiarla en la página).

## Protecciones incluidas

- **Validación en Google:** los datos se validan de nuevo al llegar (campos obligatorios, correo, teléfono, longitudes y autorización de datos).
- **Spam:** una trampa contra robots y un máximo de 60 solicitudes por hora.
- **Hoja:** los textos que empiezan por `=`, `+`, `-` o `@` se guardan como texto, no como fórmulas.

Es una protección básica: si llegan muchas solicitudes falsas, se puede agregar una verificación
«no soy un robot».
