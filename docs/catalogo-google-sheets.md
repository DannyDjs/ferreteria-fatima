# Catálogo de productos en Google Sheets

El catálogo de la página web se edita en una hoja de Google Sheets. No hay que tocar código:
lo que se cambia en la hoja aparece en la página en **2 a 3 minutos** con el botón «Publicar cambios»,
o sola en **una hora como máximo**.

## A. Configuración inicial (una sola vez)

### 1. Crear la hoja con el catálogo actual

1. Entre a <https://sheets.google.com> con la cuenta de Google de la ferretería.
2. Cree una hoja en blanco y póngale nombre, por ejemplo **«Catálogo web Ferretería Fátima»**.
3. Menú **Archivo → Importar → Subir** y elija el archivo `src/data/catalogo.csv` de este proyecto.
4. En «Ubicación de importación» elija **Reemplazar hoja actual** y pulse **Importar datos**.
5. Recomendado: **Ver → Inmovilizar → 1 fila**, para que los títulos de las columnas queden siempre visibles.

### 2. Obtener el enlace de la hoja en formato CSV

1. Botón **Compartir** (arriba a la derecha) → en «Acceso general» elija **Cualquier persona con el enlace** → rol **Lector** → **Listo**.
2. Copie la dirección de la hoja desde la barra del navegador. Se ve así:
   `https://docs.google.com/spreadsheets/d/`**`1AbC...xyz`**`/edit#gid=`**`0`**
3. Arme el enlace CSV con esas dos partes (el código largo y el número después de `gid=`):
   `https://docs.google.com/spreadsheets/d/1AbC...xyz/export?format=csv&gid=0`
4. Pruébelo: al pegarlo en el navegador debe descargarse un archivo `.csv`.

> Cualquiera que tenga el enlace puede **ver** la hoja (no editarla). No escriba en ella costos,
> precios internos ni datos privados (tampoco en «Notas internas»).
> Se usa este enlace y no «Publicar en la Web» porque siempre entrega los datos al instante;
> «Publicar en la Web» puede tardar hasta 5 minutos en reflejar los cambios.

### 3. Conectar la hoja con la página (en GitHub)

1. Abra <https://github.com/DannyDjs/ferreteria-fatima> → **Settings**.
2. Menú izquierdo: **Secrets and variables → Actions** → pestaña **Variables** → **New repository variable**.
3. **Name:** `CATALOGO_CSV_URL` · **Value:** el enlace CSV del paso 2 → **Add variable**.
4. Vaya a **Actions → Publicar en GitHub Pages → Run workflow → Run workflow** para publicar ya.

Desde ese momento la página toma los productos de la hoja.

### 4. Dar acceso a quien va a editar

En la hoja: botón **Compartir** → escriba el correo de la persona → permiso **Editor**.
Solo esas personas podrán cambiar el catálogo.

## B. Cómo editar el catálogo (día a día)

Cada **fila es un producto**. Columnas:

| Columna | Obligatoria | Qué escribir |
|---|---|---|
| **Categoría** | Sí | Una de las 12 categorías, escrita igual (ver lista abajo). |
| **Subcategoría** | No | Grupo dentro de la categoría, p. ej. «Reguladores de gas». Si es nueva, se crea sola. Vacía = «General». |
| **Producto** | Sí | Nombre que verá el cliente, p. ej. «Regulador Unkar R30». No repita nombres. |
| **Referencia** | No | Código o referencia comercial. |
| **Marca** | No | Marca del producto. |
| **Medida / unidad** | No | Medidas o presentación, p. ej. «1/2" y 3/4"», «Caja x 100». |
| **Descripción** | No | Texto corto. Si se deja vacía se muestra «Consulte medidas, referencias y disponibilidad con un asesor». |
| **Imagen** | No | Enlace `https://` a una foto (JPG, PNG o WebP, máximo 5 MB). Sirve un enlace de Google Drive compartido como «Cualquier persona con el enlace». |
| **Publicar** | No | **No** = el producto queda en la hoja pero no aparece en la página. Vacío o **Sí** = se publica. |
| **Notas internas** | No | Para el equipo. No se muestra en la página (pero ver el aviso del paso A.2). |

**Categorías válidas** (escribirlas tal cual; mayúsculas y tildes no importan):

1. Tuberías y accesorios roscados
2. Gas y GLP
3. Redes contra incendios
4. Eléctricos y canalización
5. Acero inoxidable sanitario
6. Válvulas, vapor e instrumentación
7. Metales y plásticos de ingeniería
8. Tornillería, fijaciones y anclajes
9. Soldadura, corte, abrasivos y pulido
10. Herramientas, perforación y mecanizado
11. Transmisión, rodamientos y carga
12. Equipos, sellantes y ferretería general

Para una categoría nueva hay que pedírsela al desarrollador (lleva ícono y textos propios).

### Tareas frecuentes

- **Agregar un producto:** escriba una fila nueva al final.
- **Ocultar un producto** (agotado, descontinuado): ponga **No** en «Publicar». No hace falta borrarlo.
- **Publicar un pendiente:** cuando se confirme, corrija el nombre y cambie «Publicar» a **Sí**.
- **Poner foto con Google Drive:** suba la foto a Drive → clic derecho → **Compartir** → «Cualquier persona con el enlace» → **Copiar enlace** → péguelo en la columna «Imagen».
- **Ver el cambio ya:** en la hoja, menú **Página web → Publicar cambios** (parte C). La página se actualiza en 2 a 3 minutos.

### Si algo no aparece

Las filas con problemas (sin nombre, categoría mal escrita, foto que no se puede descargar) **no detienen la
página**: se omite esa fila o su foto y el resto se publica. Para ver qué pasó: GitHub → **Actions** → la última
ejecución → **build** → paso «Compilar para GitHub Pages» → sección **avisos del catálogo**.

Si la hoja no se puede leer (por ejemplo, se despublicó), la página usa la última copia guardada en el proyecto
(`src/data/catalogo.csv`).

> GitHub pausa las tareas programadas si el repositorio pasa 60 días sin cambios. Si deja de actualizarse,
> entre a **Actions** y pulse **Enable workflow**, o publique a mano con **Run workflow**.

## C. Botón «Publicar cambios» en la hoja (una sola vez)

Agrega a la hoja el menú **Página web → Publicar cambios**, que actualiza la página en 2 a 3 minutos sin entrar a GitHub.

### 1. Crear el permiso en GitHub (token)

1. Entre a GitHub con la cuenta dueña del repositorio → foto de perfil (arriba a la derecha) → **Settings**.
2. Abajo a la izquierda: **Developer settings → Personal access tokens → Fine-grained tokens → Generate new token**.
3. **Token name:** `Publicar catálogo desde Sheets`.
4. **Expiration:** la mayor duración disponible (anótela: cuando venza hay que repetir esta parte).
5. **Repository access:** **Only select repositories** → elija `ferreteria-fatima`.
6. **Permissions → Repository permissions → Actions:** **Read and write**. No active ningún otro permiso.
7. **Generate token** y **copie** el código que empieza por `github_pat_...` (GitHub solo lo muestra una vez).

> Este código permite publicar la página. No lo comparta ni lo pegue en la hoja.

### 2. Pegar el script en la hoja

1. En la hoja: menú **Extensiones → Apps Script**.
2. Borre lo que haya en el editor y pegue todo el contenido de `docs/publicar-cambios.gs`.
3. Pulse **Guardar** (ícono de disquete).

### 3. Guardar el permiso

1. En Apps Script, menú izquierdo: **⚙ Configuración del proyecto**.
2. Abajo, **Propiedades de la secuencia de comandos → Agregar propiedad de la secuencia de comandos**.
3. **Propiedad:** `GITHUB_TOKEN` · **Valor:** el código `github_pat_...` → **Guardar propiedades de la secuencia de comandos**.

### 4. Probar

1. Vuelva a la hoja y **recárguela** (F5). Aparece el menú **Página web** junto a «Ayuda».
2. **Página web → Publicar cambios**. La primera vez Google pide autorización: **Continuar** → elija su
   cuenta → **Configuración avanzada → Ir a … (no seguro)** → **Permitir**. (El aviso aparece porque el
   script es propio y no está verificado por Google; solo se conecta con GitHub.)
3. Debe aparecer «Listo. La página se actualizará en 2 a 3 minutos».

**Si aparece un error 401 o 403**, el token venció o no tiene el permiso de **Actions**: repita los pasos 1 y 3.

> Quien pueda editar la hoja puede abrir Apps Script y ver el token. Comparta la hoja como **Editor**
> solo con personas de confianza.
