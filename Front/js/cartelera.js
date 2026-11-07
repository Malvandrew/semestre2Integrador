/* ==========================================================
   cartelera.js -> lógica de cartelera.html
   Dibuja el catálogo, maneja clics y guarda la selección.
   Los datos SIEMPRE se piden/guardan a través de `Almacen`.
   ========================================================== */

const MAX_ASIENTOS = 8;
const estado = { peliculaId: null, funcionId: null, seleccionados: [] };

const el = {
  lista: $("listaPeliculas"), detalle: $("detalle"), titulo: $("detTitulo"), info: $("detInfo"),
  horarios: $("listaHorarios"), zona: $("zonaAsientos"), mapa: $("mapaAsientos"),
  resAsientos: $("resAsientos"), resTotal: $("resTotal"), aviso: $("aviso"),
  btnContinuar: $("btnContinuar"), btnCerrar: $("btnCerrar"),
  precioVip: $("precioVip"), precioGeneral: $("precioGeneral")
};

const salaActual = () => Almacen.obtenerSala(Almacen.obtenerFuncion(estado.funcionId).salaId);

/* ---------- Catálogo ---------- */
function pintarCatalogo() {
  el.lista.innerHTML = Almacen.obtenerPeliculas().map(p => {
    const salas = [...new Set(Almacen.obtenerFunciones(p.id).map(f => Almacen.obtenerSala(f.salaId).nombre))].join(", ");
    return `
    <article class="tarjeta" data-id="${escapar(p.id)}">
      <div class="afiche">
        <img src="${escapar(p.imagen)}" alt="Póster de ${escapar(p.titulo)}" loading="lazy">
        <h3 class="afiche-titulo"><button type="button" class="tarjeta-accion" aria-controls="detalle">${escapar(p.titulo)}</button></h3>
      </div>
      <div class="tarjeta-cuerpo">
        <span class="etiqueta">${escapar(p.genero)}</span>
        <p>${p.duracion} min · ${escapar(salas)}</p>
        <p class="tarjeta-desc">${escapar(p.descripcion)}</p>
      </div>
    </article>`;
  }).join("");
}

el.lista.addEventListener("click", e => {
  const tarjeta = e.target.closest(".tarjeta");
  if (tarjeta) abrirPelicula(tarjeta.dataset.id);
});

/* ---------- Abrir una película: muestra sus horarios ---------- */
function abrirPelicula(id) {
  const p = Almacen.obtenerPelicula(id);
  const tarifas = Almacen.obtenerTarifas();

  estado.peliculaId = id;
  estado.funcionId = null;
  estado.seleccionados = [];

  document.querySelectorAll(".tarjeta").forEach(t => t.classList.toggle("activa", t.dataset.id === id));

  el.titulo.textContent = p.titulo;
  el.info.textContent = `${p.genero} · ${p.duracion} min — ${p.descripcion}`;
  el.precioVip.textContent = moneda(tarifas.vip);
  el.precioGeneral.textContent = moneda(tarifas.general);

  el.horarios.innerHTML = Almacen.obtenerFunciones(id).map(f => `
    <button type="button" class="horario" data-id="${escapar(f.id)}" aria-pressed="false">
      <strong>${escapar(f.hora)}</strong><small>${escapar(Almacen.obtenerSala(f.salaId).nombre)}</small>
    </button>`).join("");

  el.zona.hidden = true;
  el.detalle.hidden = false;
  actualizarResumen();
  el.detalle.scrollIntoView({ behavior: "smooth", block: "start" });
}

el.horarios.addEventListener("click", e => {
  const boton = e.target.closest(".horario");
  if (!boton) return;
  estado.funcionId = boton.dataset.id;
  estado.seleccionados = [];
  el.aviso.textContent = "";
  el.horarios.querySelectorAll(".horario").forEach(b => b.setAttribute("aria-pressed", b === boton));
  pintarAsientos();
  el.zona.hidden = false;
  actualizarResumen();
});

/* ---------- Mapa de asientos ---------- */
function pintarAsientos() {
  const sala = salaActual();
  const ocupados = Almacen.obtenerOcupados(estado.funcionId);

  el.mapa.innerHTML = sala.filas.map(letra => {
    let fila = `<div class="fila" style="--columnas:${sala.columnas}"><span class="fila-letra">${escapar(letra)}</span>`;
    for (let n = 1; n <= sala.columnas; n++) {
      const id = letra + n;
      const tipo = Almacen.tipoAsiento(sala, id);
      const ocupado = ocupados.includes(id);
      fila += `<button type="button" class="asiento ${tipo}" data-id="${id}" aria-pressed="false"
                 ${ocupado ? "disabled" : ""} aria-label="Asiento ${id}, ${tipo === "vip" ? "VIP" : "General"}${ocupado ? ", ocupado" : ""}">${n}</button>`;
    }
    return fila + "</div>";
  }).join("");
}

el.mapa.addEventListener("click", e => {
  const boton = e.target.closest(".asiento");
  if (!boton || boton.disabled) return;
  const id = boton.dataset.id;
  const i = estado.seleccionados.indexOf(id);

  if (i >= 0) {
    estado.seleccionados.splice(i, 1);
    boton.setAttribute("aria-pressed", "false");
    el.aviso.textContent = "";
  } else {
    if (estado.seleccionados.length >= MAX_ASIENTOS) {
      el.aviso.textContent = `Máximo ${MAX_ASIENTOS} asientos por compra.`;
      return;
    }
    estado.seleccionados.push(id);
    boton.setAttribute("aria-pressed", "true");
    el.aviso.textContent = "";
  }
  actualizarResumen();
});

/* ---------- Resumen y total ---------- */
function actualizarResumen() {
  const ids = [...estado.seleccionados].sort((a, b) =>
    a.charAt(0).localeCompare(b.charAt(0)) || parseInt(a.slice(1)) - parseInt(b.slice(1)));
  const total = estado.funcionId ? ids.reduce((s, id) => s + Almacen.precioAsiento(salaActual(), id), 0) : 0;

  el.resAsientos.textContent = ids.length ? ids.join(", ") : "—";
  el.resTotal.textContent = moneda(total);
  el.btnContinuar.disabled = !(estado.funcionId && ids.length);
}

/* ---------- Guardar selección para el carrito ---------- */
el.btnContinuar.addEventListener("click", () => {
  Almacen.guardarSeleccion(estado.funcionId, estado.seleccionados);
  el.aviso.textContent = "Selección guardada. Redirigiendo al carrito…";
  setTimeout(() => { window.location.href = "carrito.html"; }, 700);
});

el.btnCerrar.addEventListener("click", () => {
  el.detalle.hidden = true;
  document.querySelectorAll(".tarjeta").forEach(t => t.classList.remove("activa"));
  $("catalogo").scrollIntoView({ behavior: "smooth" });
});

pintarCatalogo();
