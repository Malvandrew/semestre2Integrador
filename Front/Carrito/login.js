/* Inicio de sesión, registro y modificación de datos del cliente. */
const MAX_INTENTOS = 3;

function buscar(id) {
  return document.getElementById(id);
}

class Cliente {
  constructor(nombre, correo, direccionEnvio, usuario, contrasena) {
    this.nombre = nombre;
    this.correo = correo;
    this.direccionEnvio = direccionEnvio;
    this.usuario = usuario;
    this.contrasena = contrasena;
  }
  // Devuelve false si el usuario ya existe.
  registrar() {
    const clientes = Almacen.obtenerClientes();
    for (const c of clientes) {
      if (c.usuario === this.usuario) return false;
    }
    clientes.push(this);
    Almacen.guardarClientes(clientes);
    return true;
  }
  // Devuelve true si el usuario y la contraseña coinciden con un cliente registrado.
  iniciarSesion() {
    for (const c of Almacen.obtenerClientes()) {
      if (c.usuario === this.usuario && c.contrasena === this.contrasena) {
        Almacen.iniciarSesion(c.usuario);
        return true;
      }
    }
    return false;
  }
  modificarDatos(nombre, correo, direccionEnvio) {
    this.nombre = nombre;
    this.correo = correo;
    this.direccionEnvio = direccionEnvio;
    const clientes = Almacen.obtenerClientes();
    for (const c of clientes) {
      if (c.usuario === this.usuario) {
        c.nombre = nombre;
        c.correo = correo;
        c.direccionEnvio = direccionEnvio;
      }
    }
    Almacen.guardarClientes(clientes);
  }
}

class InterfazLogin {
  constructor() {
    this.intentos = 0;
    this.configurarEventos();
    this.dibujar();
  }

  configurarEventos() {
    buscar("formLogin").addEventListener("submit", e => { e.preventDefault(); this.iniciarSesion(); });
    buscar("formRegistro").addEventListener("submit", e => { e.preventDefault(); this.registrar(); });
    buscar("formDatos").addEventListener("submit", e => { e.preventDefault(); this.modificarDatos(); });
    buscar("btnIrRegistro").addEventListener("click", () => this.mostrar("seccionRegistro"));
    buscar("btnIrLogin").addEventListener("click", () => this.mostrar("seccionLogin"));
    buscar("btnCerrarSesion").addEventListener("click", () => this.cerrarSesion());
    buscar("btnMenu").addEventListener("click", () => {
      const abierto = buscar("menu").classList.toggle("abierto");
      buscar("btnMenu").setAttribute("aria-expanded", abierto);
    });
  }

  // Muestra una sola sección: login, registro o datos.
  mostrar(id) {
    for (const seccion of ["seccionLogin", "seccionRegistro", "seccionDatos"]) {
      buscar(seccion).hidden = seccion !== id;
    }
  }

  dibujar() {
    const cliente = Almacen.obtenerCliente();
    if (cliente === null) {
      this.mostrar("seccionLogin");
      return;
    }
    buscar("saludo").textContent = "Hola, " + cliente.nombre;
    buscar("datosUsuario").textContent = cliente.usuario;
    buscar("datosNombre").value = cliente.nombre;
    buscar("datosCorreo").value = cliente.correo;
    buscar("datosDireccion").value = cliente.direccionEnvio;
    this.mostrar("seccionDatos");
  }

  iniciarSesion() {
    const cliente = new Cliente("", "", "", buscar("loginUsuario").value.trim(), buscar("loginContrasena").value);
    if (cliente.iniciarSesion()) {
      window.location.href = "index.html";
      return;
    }
    this.intentos = this.intentos + 1;
    if (this.intentos >= MAX_INTENTOS) {
      buscar("btnIniciar").disabled = true;
      buscar("mensajeCuenta").textContent = "Superaste el máximo de " + MAX_INTENTOS + " intentos. Recarga la página para volver a intentar.";
      return;
    }
    buscar("mensajeCuenta").textContent = "Usuario o contraseña incorrectos. Intento " + this.intentos + " de " + MAX_INTENTOS + ".";
  }

  registrar() {
    const cliente = new Cliente(
      buscar("regNombre").value.trim(),
      buscar("regCorreo").value.trim(),
      buscar("regDireccion").value.trim(),
      buscar("regUsuario").value.trim(),
      buscar("regContrasena").value
    );
    if (cliente.registrar() === false) {
      buscar("mensajeCuenta").textContent = "Ese usuario ya existe. Elige otro.";
      return;
    }
    cliente.iniciarSesion();
    window.location.href = "index.html";
  }

  modificarDatos() {
    const datos = Almacen.obtenerCliente();
    const cliente = new Cliente(datos.nombre, datos.correo, datos.direccionEnvio, datos.usuario, datos.contrasena);
    cliente.modificarDatos(
      buscar("datosNombre").value.trim(),
      buscar("datosCorreo").value.trim(),
      buscar("datosDireccion").value.trim()
    );
    buscar("mensajeCuenta").textContent = "Datos actualizados.";
    this.dibujar();
  }

  cerrarSesion() {
    Almacen.cerrarSesion();
    buscar("mensajeCuenta").textContent = "Sesión cerrada.";
    this.dibujar();
  }
}

new InterfazLogin();
