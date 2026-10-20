// Páginas de apoyo: preguntas frecuentes, política de privacidad y error 404.
import { html } from '../templates/html.js';
import { icono } from '../templates/icons.js';
import { rutas, enlaceWhatsapp } from '../templates/rutas.js';
import { pendiente } from '../templates/layout.js';
import { cabeceraPagina, migas, bandaCotizacion } from '../templates/componentes.js';

function preguntas(ctx) {
  const e = ctx.empresa;
  return [
    { p: '¿Venden en línea o tienen tienda virtual?', r: 'No realizamos ventas ni pagos en línea. El sitio funciona como catálogo: puede revisar nuestro catálogo y enviarnos una solicitud de cotización por formulario o WhatsApp. Un asesor le responde con precios y disponibilidad.' },
    { p: '¿Por qué los productos no muestran precio?', r: 'Los precios de materiales industriales cambian según medidas, cantidades, referencias y disponibilidad de inventario. Para darle un valor correcto, lo confirmamos en cada cotización.' },
    { p: '¿Cómo solicito una cotización?', r: `Puede usar la página "Solicitar cotización", agregar productos desde el catálogo con el botón "Agregar a cotización" o escribirnos por WhatsApp al ${e.whatsapp.visible}. Incluya referencias, medidas y cantidades para una respuesta más precisa.` },
    { p: '¿La solicitud enviada por la página ya es una cotización?', r: 'No. La solicitud nos permite conocer lo que necesita. La cotización oficial es la que le enviamos después de revisar disponibilidad y condiciones, con su vigencia indicada.' },
    { p: '¿Pueden roscar, ranurar o cortar tubería?', r: 'Sí, ofrecemos servicios de roscado y ranurado de tubería y corte de materiales. Los diámetros, tipos de rosca y materiales que podemos procesar se confirman con un asesor según cada pedido.' },
    { p: '¿Puedo llevar mi propia tubería para roscarla o cortarla?', r: 'Consulte las condiciones con un asesor antes de traerla, indicando el material, el diámetro y la cantidad de trabajos.' },
    { p: '¿Hacen entregas a domicilio?', r: `No realizamos entregas a domicilio. Los pedidos se recogen en nuestra sede de la ${e.direccion.calle}, barrio ${e.direccion.barrio}.` },
    { p: '¿Dónde están ubicados y cuál es el horario?', r: `Estamos en la ${e.direccion.calle}, barrio ${e.direccion.barrio}, ${e.direccion.ciudad}, ${e.direccion.departamento}. Horario: ${e.horario.map((h) => `${h.dias.toLowerCase()}, ${h.horas}`).join('; ')}.` },
    { p: '¿Atienden a personas naturales o solo a empresas?', r: 'Atendemos a empresas, talleres, contratistas, instaladores y clientes particulares.' },
  ];
}

function faq(ctx) {
  const m = migas(ctx, [{ texto: 'Preguntas frecuentes', href: rutas.faq }]);
  const lista = preguntas(ctx);
  return {
    ruta: rutas.faq,
    seccion: 'faq',
    titulo: 'Preguntas frecuentes',
    descripcion: 'Respuestas sobre cotizaciones, precios, servicios de roscado, ranurado y corte, entregas, ubicación y horario de Ferretería Fátima en Pasto.',
    jsonLd: [m.jsonLd, {
      '@type': 'FAQPage',
      mainEntity: lista.map((q) => ({ '@type': 'Question', name: q.p, acceptedAnswer: { '@type': 'Answer', text: q.r } })),
    }],
    cuerpo: html`${cabeceraPagina({ migasHtml: m.visible, eyebrow: 'Ayuda', titulo: 'Preguntas frecuentes', lead: 'Lo que más nos consultan sobre compras, cotizaciones y servicios.' })}
<section class="section section--tight">
  <div class="container container--narrow">
    <div class="faq">
      ${lista.map((q) => html`<details class="faq__item">
        <summary class="faq__q">${q.p}${icono('abajo')}</summary>
        <div class="faq__a"><p>${q.r}</p></div>
      </details>`)}
    </div>
    <div class="faq__more">
      <p>¿Tiene otra pregunta?</p>
      <a class="btn btn--whatsapp" href="${enlaceWhatsapp(ctx.empresa.whatsapp.numero, 'Hola, Ferretería Fátima. Tengo una pregunta:')}" target="_blank" rel="noopener">${icono('whatsapp')}Escríbanos por WhatsApp</a>
      <a class="btn btn--outline" href="${rutas.contacto}">Ver contacto</a>
    </div>
  </div>
</section>
${bandaCotizacion(ctx)}`,
  };
}

function privacidad(ctx) {
  const e = ctx.empresa;
  const m = migas(ctx, [{ texto: 'Política de privacidad y tratamiento de datos', href: rutas.privacidad }]);
  return {
    ruta: rutas.privacidad,
    seccion: 'privacidad',
    titulo: 'Política de privacidad y tratamiento de datos personales',
    descripcion: 'Política de privacidad y tratamiento de datos personales de Ferretería Fátima, conforme a la Ley 1581 de 2012 de Colombia.',
    jsonLd: [m.jsonLd],
    cuerpo: html`${cabeceraPagina({ migasHtml: m.visible, eyebrow: 'Información legal', titulo: 'Política de privacidad y tratamiento de datos personales' })}
<section class="section section--tight">
  <div class="container container--narrow prose">
    ${pendiente(ctx, 'Documento base preparado según la Ley 1581 de 2012 y el Decreto 1074 de 2015. No ha sido revisado por un abogado: debe validarse antes de publicar. Falta un correo electrónico para el ejercicio de derechos.')}
    <p class="muted">Versión 1.0 · Vigente desde la publicación de este sitio web.</p>

    <h2>1. Responsable del tratamiento</h2>
    <p><strong>${e.nombre}</strong>, NIT ${e.nit}, con domicilio en la ${e.direccion.calle}, barrio ${e.direccion.barrio}, ${e.direccion.ciudad}, ${e.direccion.departamento}, ${e.direccion.pais}. Teléfono y WhatsApp: ${e.telefonos.celular.visible}.${e.correo ? html` Correo: ${e.correo}.` : ''}</p>

    <h2>2. Datos que recolectamos</h2>
    <p>A través de los formularios de este sitio recolectamos únicamente los datos que usted decide entregarnos:</p>
    <ul>
      <li>Nombre o razón social, NIT o documento de identificación y nombre de la persona de contacto.</li>
      <li>Teléfono, correo electrónico y ciudad.</li>
      <li>Productos, servicios, cantidades y mensajes que escriba en su solicitud.</li>
    </ul>
    <p>No solicitamos datos sensibles ni datos de niños, niñas o adolescentes.</p>

    <h2>3. Finalidades</h2>
    <ul>
      <li>Responder solicitudes de información, cotizaciones y mensajes de contacto.</li>
      <li>Elaborar y enviar cotizaciones y hacer seguimiento a la solicitud.</li>
      <li>Gestionar la venta y la facturación cuando usted decida comprar.</li>
      <li>Cumplir obligaciones legales, contables y tributarias.</li>
    </ul>
    <p>No vendemos ni alquilamos sus datos personales.</p>

    <h2>4. Terceros que intervienen</h2>
    <ul>
      <li><strong>Formspree</strong>: servicio que recibe los formularios del sitio y los reenvía a nuestro equipo. Sus servidores pueden estar fuera de Colombia, por lo que el envío implica una transmisión internacional de datos.</li>
      <li><strong>WhatsApp</strong>: si usted elige escribirnos por WhatsApp, la conversación se rige también por las condiciones de ese servicio.</li>
      <li><strong>Google Maps</strong>: el mapa de la página de contacto solo se carga si usted lo solicita; en ese momento Google puede recibir datos de navegación.</li>
      <li><strong>Proveedor de alojamiento</strong> del sitio web, que procesa datos técnicos de conexión (como la dirección IP) para entregar las páginas.</li>
    </ul>

    <h2>5. Información guardada en su navegador</h2>
    <p>La lista de productos que agrega a su solicitud se guarda solo en su navegador (almacenamiento local) para que no la pierda al cambiar de página. No se envía a nadie hasta que usted envía el formulario y puede borrarla desde la página de cotización o desde la configuración de su navegador. Este sitio no usa cookies de publicidad ni herramientas de analítica.</p>

    <h2>6. Derechos del titular</h2>
    <p>Como titular de los datos, usted tiene derecho a:</p>
    <ul>
      <li>Conocer, actualizar y rectificar sus datos personales.</li>
      <li>Solicitar prueba de la autorización otorgada.</li>
      <li>Ser informado sobre el uso que se ha dado a sus datos.</li>
      <li>Presentar quejas ante la Superintendencia de Industria y Comercio por infracciones a la ley.</li>
      <li>Revocar la autorización o solicitar la supresión de sus datos cuando no exista un deber legal o contractual de conservarlos.</li>
      <li>Acceder de forma gratuita a sus datos personales.</li>
    </ul>

    <h2>7. Consultas y reclamos</h2>
    <p>Puede ejercer sus derechos por los canales indicados en el numeral 1 o en nuestra sede. Las consultas se atienden en un plazo máximo de diez (10) días hábiles y los reclamos en un plazo máximo de quince (15) días hábiles, prorrogables en los términos de la Ley 1581 de 2012.</p>

    <h2>8. Conservación y seguridad</h2>
    <p>Conservamos los datos durante el tiempo necesario para cumplir las finalidades descritas y las obligaciones legales. Aplicamos medidas razonables para proteger la información; sin embargo, ningún sistema de transmisión o almacenamiento es completamente seguro.</p>

    <h2>9. Cambios a esta política</h2>
    <p>Cualquier cambio sustancial se publicará en esta página con su fecha de vigencia.</p>
  </div>
</section>`,
  };
}

function error404(ctx) {
  return {
    ruta: '/404.html',
    archivo: '404.html',
    seccion: '',
    titulo: 'Página no encontrada',
    descripcion: 'La página que busca no existe o cambió de dirección.',
    noIndex: true,
    cuerpo: html`<section class="error-page">
  <div class="container error-page__inner">
    <p class="error-page__code" aria-hidden="true">404</p>
    <h1 class="error-page__title">No encontramos esta página</h1>
    <p>Es posible que la dirección esté mal escrita o que la página haya cambiado de lugar.</p>
    <form class="search-box" action="${rutas.productos}" method="get" role="search">
      <label for="buscar-404" class="visually-hidden">Buscar productos</label>
      ${icono('buscar')}
      <input id="buscar-404" name="q" type="search" placeholder="Buscar productos…" maxlength="80">
      <button class="btn btn--primary" type="submit">Buscar</button>
    </form>
    <ul class="error-page__links">
      <li><a class="link-arrow" href="/">Ir al inicio${icono('flecha')}</a></li>
      <li><a class="link-arrow" href="${rutas.productos}">Ver productos${icono('flecha')}</a></li>
      <li><a class="link-arrow" href="${rutas.servicios}">Ver servicios${icono('flecha')}</a></li>
      <li><a class="link-arrow" href="${rutas.contacto}">Contacto${icono('flecha')}</a></li>
    </ul>
  </div>
</section>`,
  };
}

export default function otras(ctx) {
  return [faq(ctx), privacidad(ctx), error404(ctx)];
}
