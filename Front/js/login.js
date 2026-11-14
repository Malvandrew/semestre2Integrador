/* ==========================================================
   login.js -> lógica de login.html
   Inicio de sesión, registro, datos del cliente y sus órdenes.
   ========================================================== */

const MAX_INTENTOS = 3;
const DESTINOS_VALIDOS = ["index.html", "cartelera.html", "carrito.html"];   // a dónde se puede volver tras iniciar sesión

class Cliente {
  constructor(nombre, correo, usuario) {
    this.nombre = nombre;
    this.correo = correo;
    this.usuario = usuario;
  }
  // Devuelve null si se registró, o "usuario" / "correo" si ya existe.
  async registrar(contrasena) {
    const sal = Clave.nuevaSal();
    const hash = await Clave.hash(contrasena, sal);
    return Almacen.registrarCliente({
      nombre: this.nombre, correo: this.correo,
      usuario: this.usuario, clave: { sal, hash }
    });
  }
  // Devuelve true si usuario y contraseña coinciden con un cliente registrado.
  async iniciarSesion(contrasena) {
    const registro = Almacen.buscarCredenciales(this.usuario);
    if (registro === null) return false;
    let correcta = false;
    if (registro.clave) {
      correcta = (await Clave.hash(contrasena, registro.clave.sal)) === registro.clave.hash;
    } else if (registro.contrasena !== undefined && registro.contrasena === contrasena) {
      // Cuenta creada con la versión anterior (contraseña en texto plano): se protege ahora.
      correcta = true;
      const sal = Clave.nuevaSal();
      Almacen.actualizarCliente(registro.usuario, { clave: { sal, hash: await Clave.hash(contrasena, sal) }, contrasena: undefined });
    }
    if (correcta) Almacen.iniciarSesion(registro.usuario);
    return correcta;
  }
  // Devuelve false si el correo ya lo usa otro cliente.
  modificarDatos(nombre, correo) {
    return Almacen.actualizarCliente(this.usuario, { nombre, correo });
  }
}

class InterfazLogin {
  constructor() {
    this.intentos = 0;
    this.configurarEventos();
    this.dibujar();
  }

  configurarEventos() {
    $("formLogin").addEventListener("submit", e => { e.preventDefault(); this.iniciarSesion(); });
    $("formRegistro").addEventListener("submit", e => { e.preventDefault(); this.registrar(); });
    $("formDatos").addEventListener("submit", e => { e.preventDefault(); this.modificarDatos(); });
    $("btnIrRegistro").addEventListener("click", () => this.mostrar("seccionRegistro"));
    $("btnIrLogin").addEventListener("click", () => this.mostrar("seccionLogin"));
    $("btnCerrarSesion").addEventListener("click", () => this.cerrarSesion());
  }

  // Muestra una sola sección: login, registro o datos.
  mostrar(id) {
    for (const seccion of ["seccionLogin", "seccionRegistro", "seccionDatos"]) {
      $(seccion).hidden = seccion !== id;
    }
    $("mensajeCuenta").textContent = "";
  }

  // Tras iniciar sesión vuelve a la página de origen (p. ej. el carrito).
  irADestino() {
    const destino = new URLSearchParams(window.location.search).get("volver");
    window.location.href = DESTINOS_VALIDOS.includes(destino) ? destino : "cartelera.html";
  }

  dibujar() {
    const cliente = Almacen.obtenerCliente();
    if (cliente === null) {
      this.mostrar("seccionLogin");
      return;
    }
    $("saludo").textContent = "Hola, " + cliente.nombre;
    $("datosUsuario").textContent = cliente.usuario;
    $("datosNombre").value = cliente.nombre;
    $("datosCorreo").value = cliente.correo;
    this.dibujarMetodos(cliente.usuario);
    this.dibujarOrdenes(cliente.usuario);
    this.mostrar("seccionDatos");
  }

  // Métodos de pago guardados: solo marca y últimos 4 dígitos (o el celular).
  dibujarMetodos(usuario) {
    const metodos = Almacen.obtenerMetodosPago(usuario);
    $("sinMetodos").hidden = metodos.length > 0;
    const lista = $("listaMetodos");
    lista.innerHTML = "";
    for (const m of metodos) {
      const li = document.createElement("li");
      li.innerHTML = '<span></span><button class="boton boton-tenue boton-chico" type="button">Eliminar</button>';
      li.querySelector("span").textContent = m.descripcion;
      li.querySelector("button").setAttribute("aria-label", "Eliminar " + m.descripcion);
      li.querySelector("button").addEventListener("click", () => {
        Almacen.eliminarMetodoPago(usuario, m.id);
        this.dibujarMetodos(usuario);
        $("mensajeCuenta").textContent = "Se eliminó " + m.descripcion + ".";
      });
      lista.appendChild(li);
    }
  }

  dibujarOrdenes(usuario) {
    const ordenes = Almacen.obtenerOrdenes(usuario);
    $("sinOrdenes").hidden = ordenes.length > 0;
    const lista = $("listaOrdenes");
    lista.innerHTML = "";
    for (const o of ordenes) {
      const cantidad = o.items.reduce((s, i) => s + i.cantidad, 0);
      const li = document.createElement("li");
      li.innerHTML = "<strong></strong><span></span> <span class=\"resalte\"></span>";
      li.querySelector("strong").textContent = o.numero + " · " + o.titulo;
      li.children[1].textContent = o.salaNombre + " · " + o.hora + " · " + cantidad + (cantidad === 1 ? " entrada" : " entradas") + " · " + fechaLegible(o.fecha) + " · " +
        (o.metodoPago ? o.metodoPago + " · " : "") + o.estado + " · ";
      li.children[2].textContent = moneda(o.total);
      lista.appendChild(li);
    }
  }

  async iniciarSesion() {
    if (!this.verificarSeguridad()) return;
    const cliente = new Cliente("", "", $("loginUsuario").value.trim());
    if (await cliente.iniciarSesion($("loginContrasena").value)) {
      this.irADestino();
      return;
    }
    this.intentos = this.intentos + 1;
    if (this.intentos >= MAX_INTENTOS) {
      $("btnIniciar").disabled = true;
      $("mensajeCuenta").textContent = "Superaste el máximo de " + MAX_INTENTOS + " intentos. Recarga la página para volver a intentar.";
      return;
    }
    $("mensajeCuenta").textContent = "Usuario o contraseña incorrectos. Intento " + this.intentos + " de " + MAX_INTENTOS + ".";
  }

  async registrar() {
    if (!this.verificarSeguridad()) return;
    const cliente = new Cliente(
      $("regNombre").value.trim(), $("regCorreo").value.trim(), $("regUsuario").value.trim()
    );
    const contrasena = $("regContrasena").value;
    const repetido = await cliente.registrar(contrasena);
    if (repetido !== null) {
      $("mensajeCuenta").textContent = repetido === "usuario"
        ? "Ese usuario ya existe. Elige otro."
        : "Ese correo ya tiene una cuenta registrada.";
      return;
    }
    await cliente.iniciarSesion(contrasena);
    this.irADestino();
  }

  modificarDatos() {
    const datos = Almacen.obtenerCliente();
    const cliente = new Cliente(datos.nombre, datos.correo, datos.usuario);
    const guardado = cliente.modificarDatos(
      $("datosNombre").value.trim(), $("datosCorreo").value.trim()
    );
    this.dibujar();
    $("mensajeCuenta").textContent = guardado ? "Datos actualizados." : "Ese correo ya lo usa otra cuenta.";
  }

  cerrarSesion() {
    Almacen.cerrarSesion();
    this.dibujar();
    $("mensajeCuenta").textContent = "Sesión cerrada.";
  }

  // La protección de contraseñas necesita HTTPS o localhost.
  verificarSeguridad() {
    if (Clave.disponible()) return true;
    $("mensajeCuenta").textContent = "Este navegador no permite proteger contraseñas en esta dirección. Abre el sitio con HTTPS.";
    return false;
  }
}

new InterfazLogin();
