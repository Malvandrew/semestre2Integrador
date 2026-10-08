/* ==========================================================
   data.js  ->  "BACKEND SIMULADO"
   Aquí vive todo lo que en un proyecto real estaría en el
   servidor + base de datos: datos iniciales, lectura/escritura
   en localStorage y reglas de negocio (precios, ocupación).
   La interfaz NUNCA toca localStorage directamente: siempre
   pasa por el objeto `Almacen`.
   ========================================================== */

const CLAVES = {
  FUNCIONES: "cine_funciones",
  SALAS: "cine_salas",
  TARIFAS: "cine_tarifas",
  OCUPADOS: "cine_ocupados",   // asientos ya vendidos (por función + horario)
  SELECCION: "cine_seleccion", // selección actual -> la lee el carrito
  VERSION: "cine_version"
};
const VERSION_DATOS = "1";

/* ---------- Datos iniciales (seed) ---------- */
const DATOS_INICIALES = {
  salas: [
    { id: "s1", nombre: "Sala 1", filas: ["A", "B", "C"], columnas: 10 },
    { id: "s2", nombre: "Sala 2", filas: ["A", "B", "C"], columnas: 10 },
    { id: "s3", nombre: "Sala 3", filas: ["A", "B", "C"], columnas: 10 }
  ],
  // Fila A = VIP (10 asientos), filas B y C = General (20 asientos)
  tarifas: { vip: 25000, general: 15000 },
  funciones: [
    {
      id: "f1", titulo: "Funcion 01", genero: "Acción", duracion: 118,
      descripcion: "Una mensajera nocturna descubre un secreto que puede apagar toda la ciudad.",
      salaId: "s1", color: "linear-gradient(135deg,#ff00aa,#1a001a)",
      horarios: [{ id: "h1", hora: "14:00" }, { id: "h2", hora: "17:30" }, { id: "h3", hora: "20:45" }]
    },
    {
      id: "f2", titulo: "Funcion 02", genero: "Suspenso", duracion: 104,
      descripcion: "Un programador tiene 24 horas para detener un virus que él mismo escribió.",
      salaId: "s2", color: "linear-gradient(135deg,#ffd400,#1a1400)",
      horarios: [{ id: "h1", hora: "15:00" }, { id: "h2", hora: "18:00" }, { id: "h3", hora: "21:00" }]
    },
    {
      id: "f3", titulo: "Funcion 03", genero: "Aventura", duracion: 126,
      descripcion: "Cuatro amigos, una carretera sin fin y un mapa que no coincide con la realidad.",
      salaId: "s3", color: "linear-gradient(135deg,#ff00aa,#ffd400)",
      horarios: [{ id: "h1", hora: "13:30" }, { id: "h2", hora: "16:30" }, { id: "h3", hora: "19:30" }]
    },
    {
      id: "f4", titulo: "Funcion 04", genero: "Terror", duracion: 97,
      descripcion: "Un faro abandonado guarda algo que no quiere ser encontrado.",
      salaId: "s1", color: "linear-gradient(135deg,#2b0020,#ff00aa)",
      horarios: [{ id: "h1", hora: "16:00" }, { id: "h2", hora: "19:00" }, { id: "h3", hora: "22:00" }]
    },
    {
      id: "f5", titulo: "Funcion 05", genero: "Comedia", duracion: 101,
      descripcion: "Una banda de garaje compite en un festival con un solo ensayo y cero talento.",
      salaId: "s2", color: "linear-gradient(135deg,#ffd400,#ff00aa)",
      horarios: [{ id: "h1", hora: "14:30" }, { id: "h2", hora: "17:00" }, { id: "h3", hora: "20:00" }]
    }
  ],
  // Algunos asientos vendidos de ejemplo para ver el mapa en acción

};

/* ---------- API del "backend" ---------- */
const Almacen = {
  _leer(clave, defecto) {
    try {
      const crudo = localStorage.getItem(clave);
      return crudo ? JSON.parse(crudo) : defecto;
    } catch (e) {
      return defecto;
    }
  },
  _escribir(clave, valor) {
    localStorage.setItem(clave, JSON.stringify(valor));
  },

  /* Carga los datos iniciales solo si no existen (o cambió la versión) */
  iniciar() {
    if (localStorage.getItem(CLAVES.VERSION) === VERSION_DATOS &&
        localStorage.getItem(CLAVES.FUNCIONES)) return;
    this._escribir(CLAVES.SALAS, DATOS_INICIALES.salas);
    this._escribir(CLAVES.TARIFAS, DATOS_INICIALES.tarifas);
    this._escribir(CLAVES.FUNCIONES, DATOS_INICIALES.funciones);
    this._escribir(CLAVES.OCUPADOS, DATOS_INICIALES.ocupados);
    localStorage.setItem(CLAVES.VERSION, VERSION_DATOS);
  },

  /* ----- Lecturas ----- */
  obtenerFunciones() { return this._leer(CLAVES.FUNCIONES, []); },
  obtenerSalas() { return this._leer(CLAVES.SALAS, []); },
  obtenerTarifas() { return this._leer(CLAVES.TARIFAS, { vip: 0, general: 0 }); },
  obtenerFuncion(id) { return this.obtenerFunciones().find(f => f.id === id); },
  obtenerSala(id) { return this.obtenerSalas().find(s => s.id === id); },

  obtenerOcupados(funcionId, horarioId) {
    const todos = this._leer(CLAVES.OCUPADOS, {});
    return todos[`${funcionId}|${horarioId}`] || [];
  },

  /* Regla de negocio: la primera fila (A) es VIP */
  tipoAsiento(asientoId) { return asientoId.charAt(0) === "A" ? "vip" : "general"; },
  precioAsiento(asientoId) {
    const t = this.obtenerTarifas();
    return t[this.tipoAsiento(asientoId)];
  },

  /* ----- Selección temporal (la consume el carrito) ----- */
  guardarSeleccion(funcionId, horarioId, asientosIds) {
    const f = this.obtenerFuncion(funcionId);
    const h = f.horarios.find(x => x.id === horarioId);
    const sala = this.obtenerSala(f.salaId);
    const asientos = asientosIds.map(id => ({
      id, tipo: this.tipoAsiento(id), precio: this.precioAsiento(id)
    }));
    const seleccion = {
      funcionId: f.id,
      titulo: f.titulo,
      salaId: sala.id,
      salaNombre: sala.nombre,
      horarioId: h.id,
      hora: h.hora,
      asientos,
      total: asientos.reduce((suma, a) => suma + a.precio, 0),
      fecha: new Date().toISOString()
    };
    this._escribir(CLAVES.SELECCION, seleccion);
    return seleccion;
  },
  obtenerSeleccion() { return this._leer(CLAVES.SELECCION, null); },
  limpiarSeleccion() { localStorage.removeItem(CLAVES.SELECCION); },

  /* ----- Se llama SOLO cuando el pago se confirma (módulo del carrito) ----- */
  confirmarCompra() {
    const sel = this.obtenerSeleccion();
    if (!sel) return false;
    const todos = this._leer(CLAVES.OCUPADOS, {});
    const clave = `${sel.funcionId}|${sel.horarioId}`;
    const actuales = todos[clave] || [];
    const nuevos = sel.asientos.map(a => a.id);
    // Evita doble venta si alguien ya compró alguno mientras tanto
    if (nuevos.some(id => actuales.includes(id))) return false;
    todos[clave] = [...actuales, ...nuevos];
    this._escribir(CLAVES.OCUPADOS, todos);
    this.limpiarSeleccion();
    return true;
  }
};

Almacen.iniciar();
