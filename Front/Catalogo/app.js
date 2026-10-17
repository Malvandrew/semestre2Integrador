/* ==========================================================
   app.js  ->  FRONTEND (lógica de interfaz)
   Dibuja el catálogo, maneja clics y muestra el resultado.
   Los datos SIEMPRE se piden/guardan a través de `Almacen`.
   ========================================================== */

const MAX_ASIENTOS = 8;
const estado = { funcionId: null, horarioId: null, seleccionados: [] };

/* Carpeta de imágenes de las funciones: Imagenes/<nombre-de-la-funcion>.<extensión>
   Ejemplo: "Noche de Neón" busca Imagenes/noche-de-neon.jpg
   (y si no existe, prueba .png, .webp y .jpeg). Ojo: el nombre de la carpeta
   debe escribirse igual que en el disco (mayúscula inicial). */
const IMG_DIR = "Imagenes/";
const IMG_EXTS = ["jpg", "png", "webp", "jpeg"];

/* ---------- Referencias al DOM ---------- */
const $ = id => document.getElementById(id);
const el = {
  lista: $("listaFunciones"), detalle: $("detalle"), titulo: $("detTitulo"), info: $("detInfo"),
  horarios: $("listaHorarios"), zona: $("zonaAsientos"), mapa: $("mapaAsientos"),
  resAsientos: $("resAsientos"), resTotal: $("resTotal"), aviso: $("aviso"),
  btnContinuar: $("btnContinuar"), btnCerrar: $("btnCerrar"),
  precioVip: $("precioVip"), precioGeneral: $("precioGeneral"),
  btnMenu: $("btnMenu"), menu: $("menu")
};

const moneda = n => n.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });

/* "Noche de Neón" -> "noche-de-neon" (minúsculas, sin tildes, espacios -> guion) */
const nombreArchivo = titulo => titulo
  .normalize("NFD").replace(/\p{M}/gu, "")
  .toLowerCase().trim()
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-+|-+$/g, "");

/* ---------- Catálogo ---------- */
function pintarCatalogo() {
  el.lista.innerHTML = Almacen.obtenerFunciones().map(f => {
    const base = nombreArchivo(f.titulo);
    return `
    <button class="tarjeta" data-id="${f.id}" aria-label="Ver función ${f.titulo}">
      <div class="poster" style="background:${f.color}">
        <img class="poster-img" src="${IMG_DIR}${base}.${IMG_EXTS[0]}"
             data-base="${base}" data-i="0" alt="">
        <span>${f.titulo}</span>
      </div>
      <div class="tarjeta-cuerpo">
        <span class="etiqueta">${f.genero}</span>
        <p>${f.duracion} min · ${Almacen.obtenerSala(f.salaId).nombre}</p>
      </div>
    </button>`;
  }).join("");
}

/* Si la imagen no existe con una extensión, prueba la siguiente.
   Si no existe con ninguna, se quita y queda el degradado de color.
   (El evento "error" no sube por el DOM, por eso se usa la fase de captura.) */
el.lista.addEventListener("error", e => {
  const img = e.target;
  if (!img.classList || !img.classList.contains("poster-img")) return;
  const siguiente = Number(img.dataset.i) + 1;
  if (siguiente < IMG_EXTS.length) {
    img.dataset.i = siguiente;
    img.src = `${IMG_DIR}${img.dataset.base}.${IMG_EXTS[siguiente]}`;
  } else {
    img.remove();
  }
}, true);

el.lista.addEventListener("click", e => {
  const tarjeta = e.target.closest(".tarjeta");
  if (tarjeta) abrirFuncion(tarjeta.dataset.id);
});

/* ---------- Abrir una función: muestra horarios ---------- */
function abrirFuncion(id) {
  const f = Almacen.obtenerFuncion(id);
  const sala = Almacen.obtenerSala(f.salaId);
  const tarifas = Almacen.obtenerTarifas();

  estado.funcionId = id;
  estado.horarioId = null;
  estado.seleccionados = [];

  document.querySelectorAll(".tarjeta").forEach(t => t.classList.toggle("activa", t.dataset.id === id));

  el.titulo.textContent = f.titulo;
  el.info.textContent = `${f.genero} · ${f.duracion} min · ${sala.nombre} — ${f.descripcion}`;
  el.precioVip.textContent = moneda(tarifas.vip);
  el.precioGeneral.textContent = moneda(tarifas.general);

  el.horarios.innerHTML = f.horarios
    .map(h => `<button class="chip" data-id="${h.id}">${h.hora}</button>`).join("");

  el.zona.hidden = true;
  el.detalle.hidden = false;
  actualizarResumen();
  el.detalle.scrollIntoView({ behavior: "smooth", block: "start" });
}

el.horarios.addEventListener("click", e => {
  const chip = e.target.closest(".chip");
  if (!chip) return;
  estado.horarioId = chip.dataset.id;
  estado.seleccionados = [];
  el.horarios.querySelectorAll(".chip").forEach(c => c.classList.toggle("activo", c === chip));
  pintarAsientos();
  el.zona.hidden = false;
  actualizarResumen();
});

/* ---------- Mapa de asientos ---------- */
function pintarAsientos() {
  const f = Almacen.obtenerFuncion(estado.funcionId);
  const sala = Almacen.obtenerSala(f.salaId);
  const ocupados = Almacen.obtenerOcupados(estado.funcionId, estado.horarioId);

  el.mapa.innerHTML = sala.filas.map(letra => {
    let fila = `<div class="fila"><span class="fila-letra">${letra}</span>`;
    for (let n = 1; n <= sala.columnas; n++) {
      const id = letra + n;
      const tipo = Almacen.tipoAsiento(id);
      const esOcupado = ocupados.includes(id);
      fila += `<button class="asiento ${tipo}${esOcupado ? " ocupado" : ""}" data-id="${id}"
                 ${esOcupado ? "disabled" : ""} aria-label="Asiento ${id} ${tipo}">${n}</button>`;
    }
    return fila + "</div>";
  }).join("");
}

el.mapa.addEventListener("click", e => {
  const btn = e.target.closest(".asiento");
  if (!btn || btn.disabled) return;
  const id = btn.dataset.id;
  const i = estado.seleccionados.indexOf(id);

  if (i >= 0) {
    estado.seleccionados.splice(i, 1);
    btn.classList.remove("seleccionado");
    el.aviso.textContent = "";
  } else {
    if (estado.seleccionados.length >= MAX_ASIENTOS) {
      el.aviso.textContent = `Máximo ${MAX_ASIENTOS} asientos por compra.`;
      return;
    }
    estado.seleccionados.push(id);
    btn.classList.add("seleccionado");
    el.aviso.textContent = "";
  }
  actualizarResumen();
});

/* ---------- Resumen y total ---------- */
function actualizarResumen() {
  const ids = [...estado.seleccionados].sort((a, b) =>
    a.charAt(0).localeCompare(b.charAt(0)) || parseInt(a.slice(1)) - parseInt(b.slice(1)));
  const total = ids.reduce((s, id) => s + Almacen.precioAsiento(id), 0);

  el.resAsientos.textContent = ids.length ? ids.join(", ") : "—";
  el.resTotal.textContent = moneda(total);
  el.btnContinuar.disabled = !(estado.horarioId && ids.length);
}

/* ---------- Guardar selección para el carrito ---------- */
el.btnContinuar.addEventListener("click", () => {
  Almacen.guardarSeleccion(estado.funcionId, estado.horarioId, estado.seleccionados);
  el.aviso.textContent = "Selección guardada. Redirigiendo al carrito…";
  setTimeout(() => { window.location.href = "carrito.html"; }, 700);
});

el.btnCerrar.addEventListener("click", () => {
  el.detalle.hidden = true;
  document.querySelectorAll(".tarjeta").forEach(t => t.classList.remove("activa"));
  $("catalogo").scrollIntoView({ behavior: "smooth" });
});

/* ---------- Menú móvil ---------- */
el.btnMenu.addEventListener("click", () => {
  const abierto = el.menu.classList.toggle("abierto");
  el.btnMenu.setAttribute("aria-expanded", abierto);
});
el.menu.addEventListener("click", e => { if (e.target.tagName === "A") el.menu.classList.remove("abierto"); });

pintarCatalogo();