import { html } from '../templates/html.js';
import { icono } from '../templates/icons.js';
import { rutas } from '../templates/rutas.js';
import { pendiente } from '../templates/layout.js';
import { cabeceraPagina, migas, encabezadoSeccion, bandaCotizacion } from '../templates/componentes.js';
import { fotoFachada } from './inicio.js';

export default function nosotros(ctx) {
  const e = ctx.empresa;
  const m = migas(ctx, [{ texto: 'Nosotros', href: rutas.nosotros }]);

  const cuerpo = html`
${cabeceraPagina({
  migasHtml: m.visible,
  eyebrow: 'Nosotros',
  titulo: 'Ferretería industrial en el barrio Fátima de Pasto',
  lead: 'Ferretería Fátima comercializa productos de ferretería industrial y suministra materiales, accesorios y servicios para instalaciones y procesos industriales en Pasto y Nariño.',
})}

<section class="section" aria-labelledby="quienes-titulo">
  <div class="container about">
    <div class="about__text">
      ${encabezadoSeccion({ eyebrow: 'Quiénes somos', titulo: 'Un proveedor cercano para la industria y la construcción', id: 'quienes-titulo' })}
      <p>${e.anioFundacion ? `Fundada en ${e.anioFundacion}, Ferretería Fátima atiende` : 'Atendemos'} desde nuestra sede en la ${e.direccion.calle}, en el barrio ${e.direccion.barrio}, a empresas, talleres, contratistas, instaladores y clientes particulares que necesitan materiales confiables para sus proyectos.</p>
      <p>Nuestro trabajo combina dos cosas: tener a mano las líneas de producto que pide la industria —tubería, válvulas, accesorios, aceros y metales, herramientas y fijación— y preparar ese material con servicios de roscado, ranurado y corte.</p>
      ${e.historia ? html`<h3 class="about__subtitulo">Nuestra historia</h3><p>${e.historia}</p>` : ''}
      ${e.trayectoria ? html`<p>${e.trayectoria}</p>` : ''}
      ${e.homenaje?.nombre
        ? html`<p class="about__homenaje">${(e.homenaje.texto || 'Ferretería Fátima es el fruto del trabajo de {nombre}, quien dedicó su vida a atender a esta comunidad. Seguimos su camino con el mismo compromiso.').replace('{nombre}', e.homenaje.nombre)}</p>`
        : pendiente(ctx, 'Homenaje: escribir el nombre del fundador en empresa.json → homenaje.nombre.')}
    </div>
    <figure class="about__figure">
      ${fotoFachada({ clase: 'about__photo', sizes: '(min-width: 1024px) 40vw, 100vw' })}
      <figcaption>Sede de Ferretería Fátima, ${e.direccion.calle}, ${e.direccion.ciudad}.</figcaption>
    </figure>
  </div>
</section>

<section class="section section--muted" aria-labelledby="actividad-titulo">
  <div class="container">
    ${encabezadoSeccion({ eyebrow: 'Actividad comercial', titulo: 'Qué ofrecemos', id: 'actividad-titulo', texto: 'Productos y servicios organizados para responder a necesidades de instalación, mantenimiento y fabricación.' })}
    <div class="activity-grid">
      <article class="activity">
        <h3>${icono('cajas')}Comercialización de ferretería industrial</h3>
        <ul class="check-list">
          ${ctx.catalogo.categorias.map((c) => html`<li><a href="${rutas.categoria(c.slug)}">${c.nombre}</a></li>`)}
        </ul>
      </article>
      <article class="activity">
        <h3>${icono('rosca')}Servicios industriales</h3>
        <ul class="check-list">
          ${ctx.servicios.servicios.map((s) => html`<li><a href="${rutas.servicio(s.slug)}">${s.nombre}</a></li>`)}
        </ul>
        <h3>${icono('personas')}A quién atendemos</h3>
        <ul class="check-list">
          <li>Empresas e industrias</li>
          <li>Talleres y metalmecánicas</li>
          <li>Contratistas e instaladores</li>
          <li>Clientes particulares</li>
        </ul>
      </article>
    </div>
  </div>
</section>

<section class="section" aria-labelledby="compromiso-titulo">
  <div class="container">
    ${encabezadoSeccion({ eyebrow: 'Nuestro compromiso', titulo: 'Cómo trabajamos con cada cliente', id: 'compromiso-titulo', centrado: true })}
    <ul class="commit-grid">
      <li class="commit">${icono('personas', 'commit__icon')}<h3>Atención personalizada</h3><p>Escuchamos qué va a instalar o fabricar para recomendarle el material adecuado.</p></li>
      <li class="commit">${icono('escudo', 'commit__icon')}<h3>Información clara</h3><p>Confirmamos disponibilidad, precio y condiciones antes de que usted tome una decisión.</p></li>
      <li class="commit">${icono('herramienta', 'commit__icon')}<h3>Soluciones industriales</h3><p>Material y servicios de preparación para que su proyecto avance con menos contratiempos.</p></li>
    </ul>
    ${e.mision || e.vision ? html`<div class="mv-grid">
      ${e.mision ? html`<article class="mv"><h3 class="mv__title">Misión</h3><p>${e.mision}</p></article>` : ''}
      ${e.vision ? html`<article class="mv"><h3 class="mv__title">Visión</h3><p>${e.vision}</p></article>` : ''}
    </div>` : pendiente(ctx, 'Misión y visión: escribirlas en empresa.json → "mision" y "vision".')}
  </div>
</section>

${bandaCotizacion(ctx, { titulo: 'Hablemos de su proyecto', texto: 'Cuéntenos qué necesita y un asesor de Ferretería Fátima le orientará sobre productos, servicios y disponibilidad.' })}`;

  return [{
    ruta: rutas.nosotros,
    seccion: 'nosotros',
    titulo: 'Nosotros: ferretería industrial en Pasto',
    descripcion: 'Conozca Ferretería Fátima, ferretería industrial en el barrio Fátima de Pasto, Nariño: suministro de materiales, accesorios, herramientas y servicios industriales.',
    jsonLd: [m.jsonLd],
    cuerpo,
  }];
}
