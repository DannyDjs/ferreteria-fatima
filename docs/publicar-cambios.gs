/**
 * Botón «Publicar cambios» para la hoja del catálogo de Ferretería Fátima.
 * Se pega en: Hoja de cálculo → Extensiones → Apps Script (ver docs/catalogo-google-sheets.md, parte C).
 *
 * Agrega el menú «Página web → Publicar cambios». Al usarlo, le pide a GitHub que vuelva a
 * publicar la página con los datos actuales de la hoja (tarda 2 a 3 minutos).
 *
 * El permiso de GitHub NO se escribe aquí: se guarda en Configuración del proyecto →
 * Propiedades de la secuencia de comandos → GITHUB_TOKEN.
 */

const REPOSITORIO = 'DannyDjs/ferreteria-fatima';
const FLUJO = 'pages.yml';

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Página web')
    .addItem('Publicar cambios', 'publicarCambios')
    .addToUi();
}

function publicarCambios() {
  const ui = SpreadsheetApp.getUi();
  const token = PropertiesService.getScriptProperties().getProperty('GITHUB_TOKEN');
  if (!token) {
    ui.alert('Falta configurar el permiso de GitHub (GITHUB_TOKEN). Vea la guía del catálogo, parte C.');
    return;
  }
  const respuesta = UrlFetchApp.fetch(
    'https://api.github.com/repos/' + REPOSITORIO + '/actions/workflows/' + FLUJO + '/dispatches',
    {
      method: 'post',
      contentType: 'application/json',
      headers: {
        Authorization: 'Bearer ' + token,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      payload: JSON.stringify({ ref: 'main' }),
      muteHttpExceptions: true,
    }
  );
  const codigo = respuesta.getResponseCode();
  if (codigo === 204) {
    ui.alert('Listo. La página se actualizará en 2 a 3 minutos.');
  } else if (codigo === 401 || codigo === 403) {
    ui.alert('GitHub rechazó el permiso (código ' + codigo + '). Es posible que el token haya vencido: cree uno nuevo (guía, parte C).');
  } else {
    ui.alert('No se pudo publicar (código ' + codigo + '). Intente de nuevo en unos minutos.\n\n' + respuesta.getContentText().slice(0, 300));
  }
}
