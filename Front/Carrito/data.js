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
  CLIENTES: "cine_clientes",   // clientes registrados
  SESION: "cine_sesion",       // usuario con sesión iniciada
  VERSION: "cine_version"
};

/* Cada vez que cambies los datos iniciales, sube este número.
   Los navegadores que tengan guardada otra versión se reinician
   con los datos de abajo (ver Almacen.iniciar). */
const VERSION_DATOS = "3";

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
      id: "f1", titulo: "Noche de Neón", genero: "Acción", duracion: 118,
      descripcion: "Dos agentes persiguen a una red criminal por una ciudad que nunca apaga sus luces.",
      imagen: "Imagenes/funcion-02.jpg",
      salaId: "s1", color: "linear-gradient(135deg,#ff00aa,#1a001a)",
      horarios: [{ id: "h1", hora: "14:00" }, { id: "h2", hora: "17:30" }, { id: "h3", hora: "20:45" }]
    },
    {
      id: "f2", titulo: "Tierra Roja", genero: "Ciencia ficción", duracion: 104,
      descripcion: "Una astronauta queda sola en Marte y debe volver a casa antes de que se acabe el oxígeno.",
      imagen: "Imagenes/funcion-04.jpg",
      salaId: "s2", color: "linear-gradient(135deg,#ffd400,#1a1400)",
      horarios: [{ id: "h1", hora: "15:00" }, { id: "h2", hora: "18:00" }, { id: "h3", hora: "21:00" }]
    },
    {
      id: "f3", titulo: "El Último Reino", genero: "Aventura", duracion: 126,
      descripcion: "Un guerrero solitario defiende la ciudad que lo vio nacer de un ejército invasor.",
      imagen: "Imagenes/funcion-01.jpg",
      salaId: "s3", color: "linear-gradient(135deg,#ff00aa,#ffd400)",
      horarios: [{ id: "h1", hora: "13:30" }, { id: "h2", hora: "16:30" }, { id: "h3", hora: "19:30" }]
    },
    {
      id: "f4", titulo: "El Pasillo", genero: "Terror", duracion: 97,
      descripcion: "Una joven vuelve a la casa de su infancia y descubre que no está sola.",
      imagen: "Imagenes/funcion-05.jpg",
      salaId: "s1", color: "linear-gradient(135deg,#2b0020,#ff00aa)",
      horarios: [{ id: "h1", hora: "16:00" }, { id: "h2", hora: "19:00" }, { id: "h3", hora: "22:00" }]
    },
    {
      id: "f5", titulo: "Lluvia en París", genero: "Romance", duracion: 101,
      descripcion: "Dos desconocidos comparten un paraguas y una noche que les cambia la vida.",
      imagen: "Imagenes/funcion-03.jpg",
      salaId: "s2", color: "linear-gradient(135deg,#ffd400,#ff00aa)",
      horarios: [{ id: "h1", hora: "14:30" }, { id: "h2", hora: "17:00" }, { id: "h3", hora: "20:00" }]
    }
  ],
  // Asientos vendidos al inicio: ninguno (todos los mapas arrancan libres).
  // Formato cuando haya ventas: { "f1|h2": ["A1", "A2"] }
  ocupados: {}
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

  /* Carga los datos iniciales solo si no existen (o cambió la versión).
     Al reiniciar también se descarta cualquier selección pendiente. */
  iniciar() {
    if (localStorage.getItem(CLAVES.VERSION) === VERSION_DATOS &&
        localStorage.getItem(CLAVES.FUNCIONES)) return;
    this._escribir(CLAVES.SALAS, DATOS_INICIALES.salas);
    this._escribir(CLAVES.TARIFAS, DATOS_INICIALES.tarifas);
    this._escribir(CLAVES.FUNCIONES, DATOS_INICIALES.funciones);
    this._escribir(CLAVES.OCUPADOS, DATOS_INICIALES.ocupados);
    localStorage.removeItem(CLAVES.SELECCION);
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

  /* ----- Clientes y sesión (los usa la pantalla de inicio de sesión) ----- */
  obtenerClientes() { return this._leer(CLAVES.CLIENTES, []); },
  guardarClientes(clientes) { this._escribir(CLAVES.CLIENTES, clientes); },
  iniciarSesion(usuario) { localStorage.setItem(CLAVES.SESION, usuario); },
  cerrarSesion() { localStorage.removeItem(CLAVES.SESION); },
  /* Cliente con sesión iniciada, o null si nadie ha iniciado sesión */
  obtenerCliente() {
    const usuario = localStorage.getItem(CLAVES.SESION);
    return this.obtenerClientes().find(c => c.usuario === usuario) || null;
  },

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
