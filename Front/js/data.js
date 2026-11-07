/* ==========================================================
   data.js  ->  "BACKEND SIMULADO" (capa de datos)
   Todo lo que en un proyecto real estaría en servidor + base
   de datos vive aquí. La interfaz NUNCA toca localStorage:
   siempre pasa por el objeto `Almacen`. Si algún día se cambia
   a un backend real, solo se reescribe este archivo.

   MODELO DE DATOS (cada colección = una clave de localStorage)
   ─────────────────────────────────────────────────────────────
   CATÁLOGO (se siembra, solo lectura para la interfaz)
     salas      { id, nombre, filas[], columnas, zonas:{vip[],general[]} }
     tarifas    { vip, general }
     peliculas  { id, titulo, genero, duracion, descripcion, imagen }
     funciones  { id, peliculaId, salaId, hora }     <- una proyección
   VENTAS (las escribe la interfaz)
     ocupados   { [funcionId]: ["A1","B3",…] }       <- asientos vendidos
     ordenes    [ { numero, usuario, cliente, funcionId, titulo,
                    salaNombre, hora, items[], total, fecha, estado } ]
   CUENTAS
     clientes   [ { nombre, correo, direccionEnvio, usuario,
                    clave:{sal,hash} } ]
     sesion     "usuario" con sesión iniciada
   TEMPORAL
     seleccion  asientos elegidos que consume el carrito
   ========================================================== */

const CLAVES = {
  PELICULAS: "cine_peliculas",
  SALAS: "cine_salas",
  TARIFAS: "cine_tarifas",
  FUNCIONES: "cine_funciones",
  OCUPADOS: "cine_ocupados",
  ORDENES: "cine_ordenes",
  CLIENTES: "cine_clientes",
  SESION: "cine_sesion",
  SELECCION: "cine_seleccion",
  ESQUEMA: "cine_esquema",       // versión de la ESTRUCTURA de los datos
  CATALOGO: "cine_catalogo",     // versión de los datos iniciales
  VERSION_ANTIGUA: "cine_version"
};

/* Sube VERSION_ESQUEMA cuando cambie la FORMA de lo guardado
   y agrega su migración en Almacen._migrar().
   Sube VERSION_CATALOGO cuando cambies películas, salas, funciones
   o tarifas: reemplaza el catálogo SIN tocar ventas, órdenes ni cuentas.
   (Si cambias ids de funciones, también hay que migrar `ocupados`.) */
const VERSION_ESQUEMA = 4;
const VERSION_CATALOGO = "1";

/* ---------- Datos iniciales (catálogo) ---------- */
const proyeccion = (peliculaId, h) => ({ id: `${peliculaId}-${h.replace(":", "")}`, peliculaId, hora: h });

const DATOS_INICIALES = {
  tarifas: { vip: 25000, general: 15000 },
  // Fila A = VIP (10 asientos), filas B y C = General (20 asientos).
  // La regla vive AQUÍ (zonas) y no en el código.
  salas: [
    { id: "s1", nombre: "Sala 1", filas: ["A", "B", "C"], columnas: 10, zonas: { vip: ["A"], general: ["B", "C"] } },
    { id: "s2", nombre: "Sala 2", filas: ["A", "B", "C"], columnas: 10, zonas: { vip: ["A"], general: ["B", "C"] } },
    { id: "s3", nombre: "Sala 3", filas: ["A", "B", "C"], columnas: 10, zonas: { vip: ["A"], general: ["B", "C"] } }
  ],
  peliculas: [
    { id: "p1", titulo: "Noche de Neón", genero: "Acción", duracion: 118, imagen: "img/pelicula-1.jpg",
      descripcion: "Dos agentes persiguen a una red criminal por una ciudad que nunca apaga sus luces." },
    { id: "p2", titulo: "Tierra Roja", genero: "Ciencia ficción", duracion: 104, imagen: "img/pelicula-2.jpg",
      descripcion: "Una astronauta queda sola en Marte y debe volver a casa antes de que se acabe el oxígeno." },
    { id: "p3", titulo: "El Último Reino", genero: "Aventura", duracion: 126, imagen: "img/pelicula-3.jpg",
      descripcion: "Un guerrero solitario defiende la ciudad que lo vio nacer de un ejército invasor." },
    { id: "p4", titulo: "El Pasillo", genero: "Terror", duracion: 97, imagen: "img/pelicula-4.jpg",
      descripcion: "Una joven vuelve a la casa de su infancia y descubre que no está sola." },
    { id: "p5", titulo: "Lluvia en París", genero: "Romance", duracion: 101, imagen: "img/pelicula-5.jpg",
      descripcion: "Dos desconocidos comparten un paraguas y una noche que les cambia la vida." }
  ],
  // Una sala no puede tener dos proyecciones a la vez: se deja ≥15 min entre una y otra.
  funciones: [
    // Sala 1: El Pasillo (97 min) y Noche de Neón (118 min) alternados
    { ...proyeccion("p4", "12:30"), salaId: "s1" }, { ...proyeccion("p1", "14:30"), salaId: "s1" },
    { ...proyeccion("p4", "16:45"), salaId: "s1" }, { ...proyeccion("p1", "18:45"), salaId: "s1" },
    { ...proyeccion("p4", "21:00"), salaId: "s1" },
    // Sala 2: Lluvia en París (101 min) y Tierra Roja (104 min) alternados
    { ...proyeccion("p5", "13:00"), salaId: "s2" }, { ...proyeccion("p2", "15:00"), salaId: "s2" },
    { ...proyeccion("p5", "17:00"), salaId: "s2" }, { ...proyeccion("p2", "19:00"), salaId: "s2" },
    { ...proyeccion("p5", "21:00"), salaId: "s2" },
    // Sala 3: El Último Reino (126 min)
    { ...proyeccion("p3", "13:30"), salaId: "s3" }, { ...proyeccion("p3", "16:30"), salaId: "s3" },
    { ...proyeccion("p3", "19:30"), salaId: "s3" }
  ]
};

/* ---------- Almacenamiento: localStorage con respaldo en memoria ----------
   Si el navegador bloquea localStorage (modo privado, cuota llena) la app
   sigue funcionando durante la visita en vez de romperse. */
const Almacenamiento = (() => {
  const memoria = new Map();
  let enMemoria = false;
  try {
    localStorage.setItem("__prueba", "1");
    localStorage.removeItem("__prueba");
  } catch (e) { enMemoria = true; }
  return {
    leer(clave) {
      if (enMemoria) return memoria.has(clave) ? memoria.get(clave) : null;
      try { return localStorage.getItem(clave); } catch (e) { return null; }
    },
    escribir(clave, texto) {
      if (!enMemoria) {
        try { localStorage.setItem(clave, texto); return; } catch (e) { enMemoria = true; }
      }
      memoria.set(clave, texto);
    },
    borrar(clave) {
      memoria.delete(clave);
      try { localStorage.removeItem(clave); } catch (e) { /* sin acceso */ }
    }
  };
})();

/* ---------- API del "backend" ---------- */
const Almacen = {
  _leer(clave, defecto) {
    try {
      const crudo = Almacenamiento.leer(clave);
      return crudo ? JSON.parse(crudo) : defecto;
    } catch (e) { return defecto; }
  },
  _escribir(clave, valor) { Almacenamiento.escribir(clave, JSON.stringify(valor)); },
  _quitar(clave) { Almacenamiento.borrar(clave); },

  /* Prepara los datos al abrir cualquier página */
  iniciar() {
    const esquema = Number(Almacenamiento.leer(CLAVES.ESQUEMA)) || 0;
    if (esquema < VERSION_ESQUEMA) this._migrar(esquema);
    if (Almacenamiento.leer(CLAVES.CATALOGO) !== VERSION_CATALOGO || !Almacenamiento.leer(CLAVES.PELICULAS)) {
      this._sembrarCatalogo();
    }
  },

  /* Migraciones por versión. Siempre conservan cuentas y sesión. */
  _migrar(desde) {
    if (desde < 4) {
      // Antes (v3) las películas y funciones estaban mezcladas y las ventas
      // usaban claves "f1|h2". Se reinician catálogo, ventas y selección;
      // se conservan clientes (aún con contraseña antigua: se protege al iniciar sesión).
      this._quitar(CLAVES.SELECCION);
      this._quitar(CLAVES.VERSION_ANTIGUA);
      this._quitar(CLAVES.CATALOGO);
      this._escribir(CLAVES.OCUPADOS, {});
      this._escribir(CLAVES.ORDENES, []);
    }
    Almacenamiento.escribir(CLAVES.ESQUEMA, String(VERSION_ESQUEMA));
  },

  _sembrarCatalogo() {
    this._escribir(CLAVES.SALAS, DATOS_INICIALES.salas);
    this._escribir(CLAVES.TARIFAS, DATOS_INICIALES.tarifas);
    this._escribir(CLAVES.PELICULAS, DATOS_INICIALES.peliculas);
    this._escribir(CLAVES.FUNCIONES, DATOS_INICIALES.funciones);
    if (!Almacenamiento.leer(CLAVES.OCUPADOS)) this._escribir(CLAVES.OCUPADOS, {});
    if (!Almacenamiento.leer(CLAVES.ORDENES)) this._escribir(CLAVES.ORDENES, []);
    Almacenamiento.escribir(CLAVES.CATALOGO, VERSION_CATALOGO);
  },

  /* ----- Catálogo ----- */
  obtenerPeliculas() { return this._leer(CLAVES.PELICULAS, []); },
  obtenerPelicula(id) { return this.obtenerPeliculas().find(p => p.id === id); },
  obtenerSalas() { return this._leer(CLAVES.SALAS, []); },
  obtenerSala(id) { return this.obtenerSalas().find(s => s.id === id); },
  obtenerTarifas() { return this._leer(CLAVES.TARIFAS, { vip: 0, general: 0 }); },
  /* Funciones (proyecciones), de una película o todas, ordenadas por hora */
  obtenerFunciones(peliculaId) {
    return this._leer(CLAVES.FUNCIONES, [])
      .filter(f => !peliculaId || f.peliculaId === peliculaId)
      .sort((a, b) => a.hora.localeCompare(b.hora));
  },
  obtenerFuncion(id) { return this._leer(CLAVES.FUNCIONES, []).find(f => f.id === id); },

  /* ----- Reglas de negocio: tipo y precio según las zonas de la sala ----- */
  tipoAsiento(sala, asientoId) { return sala.zonas.vip.includes(asientoId.charAt(0)) ? "vip" : "general"; },
  precioAsiento(sala, asientoId) { return this.obtenerTarifas()[this.tipoAsiento(sala, asientoId)]; },
  obtenerOcupados(funcionId) { return this._leer(CLAVES.OCUPADOS, {})[funcionId] || []; },

  /* ----- Selección temporal (la consume el carrito) ----- */
  guardarSeleccion(funcionId, asientosIds) {
    const f = this.obtenerFuncion(funcionId);
    const pelicula = this.obtenerPelicula(f.peliculaId);
    const sala = this.obtenerSala(f.salaId);
    const asientos = asientosIds.map(id => ({
      id, tipo: this.tipoAsiento(sala, id), precio: this.precioAsiento(sala, id)
    }));
    const seleccion = {
      funcionId: f.id,
      titulo: pelicula.titulo,
      salaId: sala.id,
      salaNombre: sala.nombre,
      hora: f.hora,
      asientos,
      total: asientos.reduce((suma, a) => suma + a.precio, 0),
      fecha: new Date().toISOString()
    };
    this._escribir(CLAVES.SELECCION, seleccion);
    return seleccion;
  },
  obtenerSeleccion() { return this._leer(CLAVES.SELECCION, null); },
  limpiarSeleccion() { this._quitar(CLAVES.SELECCION); },

  /* ----- Clientes y sesión ----- */
  _clientes() { return this._leer(CLAVES.CLIENTES, []); },
  _mismo(a, b) { return String(a).toLowerCase() === String(b).toLowerCase(); },

  /* Devuelve null si se registró, o "usuario" / "correo" si ya existe */
  registrarCliente(registro) {
    const clientes = this._clientes();
    if (clientes.some(c => this._mismo(c.usuario, registro.usuario))) return "usuario";
    if (clientes.some(c => this._mismo(c.correo, registro.correo))) return "correo";
    clientes.push(registro);
    this._escribir(CLAVES.CLIENTES, clientes);
    return null;
  },
  /* Registro completo con credenciales: SOLO lo usa la pantalla de login */
  buscarCredenciales(usuario) { return this._clientes().find(c => this._mismo(c.usuario, usuario)) || null; },
  /* Devuelve false si el nuevo correo ya lo usa otro cliente */
  actualizarCliente(usuario, cambios) {
    const clientes = this._clientes();
    const cliente = clientes.find(c => c.usuario === usuario);
    if (!cliente) return false;
    if (cambios.correo && clientes.some(c => c !== cliente && this._mismo(c.correo, cambios.correo))) return false;
    Object.assign(cliente, cambios);
    this._escribir(CLAVES.CLIENTES, clientes);
    return true;
  },
  iniciarSesion(usuario) { Almacenamiento.escribir(CLAVES.SESION, usuario); },
  cerrarSesion() { this._quitar(CLAVES.SESION); },
  /* Cliente con sesión iniciada (SIN contraseña), o null */
  obtenerCliente() {
    const usuario = Almacenamiento.leer(CLAVES.SESION);
    const c = this._clientes().find(x => x.usuario === usuario);
    if (!c) return null;
    return { nombre: c.nombre, correo: c.correo, direccionEnvio: c.direccionEnvio, usuario: c.usuario };
  },

  /* ----- Órdenes ----- */
  obtenerOrdenes(usuario) {
    return this._leer(CLAVES.ORDENES, []).filter(o => o.usuario === usuario).reverse();
  },

  /* Se llama SOLO cuando el cliente confirma la compra.
     Marca los asientos como vendidos y guarda la orden en un solo paso.
     Devuelve { ok:true } o { ok:false, motivo }. */
  confirmarCompra(orden) {
    const todos = this._leer(CLAVES.OCUPADOS, {});
    const actuales = todos[orden.funcionId] || [];
    const nuevos = orden.items.flatMap(i => i.asientos);
    if (nuevos.some(id => actuales.includes(id))) {
      return { ok: false, motivo: "Algún asiento ya está ocupado. Vuelve a la cartelera y elige otros." };
    }
    todos[orden.funcionId] = [...actuales, ...nuevos];
    this._escribir(CLAVES.OCUPADOS, todos);
    const ordenes = this._leer(CLAVES.ORDENES, []);
    ordenes.push(orden);
    this._escribir(CLAVES.ORDENES, ordenes);
    this.limpiarSeleccion();
    return { ok: true };
  }
};

Almacen.iniciar();
