/* ==========================================================
   layout.js — cabecera y pie ÚNICOS para todas las páginas.
   Cada HTML solo declara <header id="cabecera"> y <footer id="pie">;
   el contenido vive aquí, así no se pueden desincronizar.
   La página actual se marca con <body data-pagina="inicio|cartelera|carrito|cuenta">.
   ========================================================== */

const MARCA = { nombre: "CESDE", acento: "MAX" };

const ENLACES_MENU = [
  { id: "inicio",    texto: "Inicio",    href: "index.html" },
  { id: "cartelera", texto: "Cartelera", href: "cartelera.html" },
  { id: "nosotros",  texto: "Nosotros",  href: "index.html#nosotros" },
  { id: "Contacto",   texto: "Contacto",   href: "index.html#aliados" },
  { id: "carrito",   texto: "Carrito",   href: "carrito.html" },
  { id: "cuenta",    texto: "Mi cuenta", href: "login.html" }
];

(function pintarLayout() {
  const actual = document.body.dataset.pagina;

  const menu = ENLACES_MENU.map(e =>
    `<a href="${e.href}"${e.id === actual ? ' aria-current="page"' : ""}>${e.texto}</a>`).join("");

  $("cabecera").innerHTML = `
    <div class="contenedor barra">
      <a href="index.html" class="marca" aria-label="${MARCA.nombre}${MARCA.acento}, ir al inicio"><span class="marca-sello" aria-hidden="true">C</span><span class="marca-texto">${MARCA.nombre}<b>${MARCA.acento}</b></span></a>
      <button class="boton-menu" id="btnMenu" type="button" aria-label="Abrir menú" aria-expanded="false" aria-controls="menu">☰</button>
      <nav class="menu" id="menu" aria-label="Principal">${menu}</nav>
    </div>`;

  $("pie").innerHTML = `
    <div class="contenedor pie-grid">
      <div>
        <h4>${MARCA.nombre}${MARCA.acento}</h4>
      </div>
      <div>
        <h4>Navegación</h4>
        <p><a href="index.html">Inicio</a></p>
        <p><a href="cartelera.html">Cartelera</a></p>
        <p><a href="carrito.html">Carrito</a></p>
        <p><a href="login.html">Mi cuenta</a></p>
      </div>
      <div>
        <h4>Contacto</h4>
        <p><a href="mailto:cinemaxcesde@gmail.com">cinemaxcesde@gmail.com</a></p>
        <p>Medellín, Colombia</p>
      </div>
    </div>
    <p class="pie-copy">© 2026 ${MARCA.nombre}${MARCA.acento} · Todos los derechos reservados</p>`;

  /* Menú móvil */
  const boton = $("btnMenu"), nav = $("menu");
  boton.addEventListener("click", () => {
    const abierto = nav.classList.toggle("abierto");
    boton.setAttribute("aria-expanded", abierto);
  });
  nav.addEventListener("click", e => { if (e.target.tagName === "A") nav.classList.remove("abierto"); });
})();
