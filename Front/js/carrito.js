/* ==========================================================
   carrito.js -> lógica de carrito.html
   Cada producto es un tipo de entrada (VIP o General).
   ========================================================== */

/* Clase base */
class Producto {
  constructor(idProducto, nombre, descripcion, precio, stock) {
    this.idProducto = idProducto;
    this.nombre = nombre;
    this.descripcion = descripcion;
    this.precio = Number(precio);
    this.stock = stock; // Asientos elegidos en la cartelera.
  }
  mostrarInfo() {
    return this.nombre + " · " + this.descripcion;
  }
  actualizarStock(cantidad) {
    this.stock = this.stock - cantidad;
  }
}

/* Herencia: la zona (filas) sale de la configuración de la sala, no del código */
class EntradaVIP extends Producto {
  constructor(descripcion, precio, stock, filas) {
    super("vip", "Entrada VIP", descripcion, precio, stock);
    this.filas = filas;
  }
  // Polimorfismo: mostrarInfo() cambia según el tipo de entrada.
  mostrarInfo() {
    return "Entrada VIP · " + textoFilas(this.filas) + " · " + this.descripcion;
  }
}

class EntradaGeneral extends Producto {
  constructor(descripcion, precio, stock, filas) {
    super("general", "Entrada General", descripcion, precio, stock);
    this.filas = filas;
  }
  mostrarInfo() {
    return "Entrada General · " + textoFilas(this.filas) + " · " + this.descripcion;
  }
}

class ItemCarrito {
  constructor(producto, asientos) {
    this.producto = producto;
    this.asientos = asientos;
    this.cantidad = asientos.length;
  }
  obtenerSubtotal() {
    return this.producto.precio * this.cantidad;
  }
  // Solo se compran los primeros asientos, según la cantidad.
  obtenerAsientos() {
    return this.asientos.slice(0, this.cantidad);
  }
}

class CarritoCompra {
  constructor() {
    this.listaProductos = [];
    this.total = 0;
  }
  agregarProducto(producto, asientos) {
    this.listaProductos.push(new ItemCarrito(producto, asientos));
    this.calcularTotal();
  }
  eliminarProducto(idProducto) {
    this.listaProductos = this.listaProductos.filter(item => item.producto.idProducto !== idProducto);
    this.calcularTotal();
  }
  // La cantidad va de 1 hasta el stock del producto.
  actualizarCantidad(idProducto, cantidad) {
    for (const item of this.listaProductos) {
      if (item.producto.idProducto === idProducto && cantidad >= 1 && cantidad <= item.producto.stock) {
        item.cantidad = cantidad;
      }
    }
    this.calcularTotal();
  }
  calcularTotal() {
    this.total = this.listaProductos.reduce((suma, item) => suma + item.obtenerSubtotal(), 0);
    return this.total;
  }
  obtenerCantidad() {
    return this.listaProductos.reduce((suma, item) => suma + item.cantidad, 0);
  }
}

/* La orden se arma desde el carrito y se guarda con Almacen.confirmarCompra().
   Nunca incluye la contraseña del cliente. */
class Orden {
  constructor(cliente, seleccion) {
    this.numeroOrden = "CDM-" + Date.now().toString(36).toUpperCase();
    this.cliente = cliente;
    this.seleccion = seleccion;
    this.items = [];
    this.productos = [];
    this.total = 0;
    this.fecha = "";
    this.estado = "Pendiente";
  }
  generarOrden(carrito) {
    for (const item of carrito.listaProductos) {
      this.productos.push(item);
      this.items.push({
        tipo: item.producto.idProducto,
        precioUnitario: item.producto.precio,
        cantidad: item.cantidad,
        asientos: item.obtenerAsientos(),
        subtotal: item.obtenerSubtotal()
      });
    }
    this.total = carrito.calcularTotal();
    this.fecha = new Date().toISOString();
    this.estado = "Confirmada";
  }
  // Se llama solo cuando la compra ya quedó guardada.
  descontarStock() {
    for (const item of this.productos) item.producto.actualizarStock(item.cantidad);
  }
  mostrarResumen() {
    return this.productos.map(item =>
      item.producto.mostrarInfo() + " · Cantidad: " + item.cantidad +
      " · Asientos: " + item.obtenerAsientos().join(", ") + " · " + moneda(item.obtenerSubtotal()));
  }
  /* Registro plano que se guarda en Almacen */
  aRegistro() {
    return {
      numero: this.numeroOrden,
      usuario: this.cliente.usuario,
      cliente: { nombre: this.cliente.nombre, correo: this.cliente.correo, direccionEnvio: this.cliente.direccionEnvio },
      funcionId: this.seleccion.funcionId,
      titulo: this.seleccion.titulo,
      salaNombre: this.seleccion.salaNombre,
      hora: this.seleccion.hora,
      items: this.items,
      total: this.total,
      fecha: this.fecha,
      estado: this.estado
    };
  }
}

class InterfazCarrito {
  constructor() {
    // Solo los clientes con sesión iniciada pueden usar el carrito.
    if (Almacen.obtenerCliente() === null) {
      window.location.href = "login.html?volver=carrito.html";
      return;
    }
    this.seleccion = Almacen.obtenerSeleccion();
    this.carrito = new CarritoCompra();
    if (this.seleccion !== null) this.llenarCarrito();
    this.configurarEventos();
    this.dibujar();
  }

  // Separa los asientos de la cartelera en VIP y General.
  llenarCarrito() {
    const sel = this.seleccion;
    const tarifas = Almacen.obtenerTarifas();
    const sala = Almacen.obtenerSala(sel.salaId);
    const descripcion = sel.titulo + " · " + sel.salaNombre + " · " + sel.hora;
    const vip = sel.asientos.filter(a => a.tipo === "vip").map(a => a.id);
    const general = sel.asientos.filter(a => a.tipo !== "vip").map(a => a.id);
    if (vip.length > 0) {
      this.carrito.agregarProducto(new EntradaVIP(descripcion, tarifas.vip, vip.length, sala.zonas.vip), vip);
    }
    if (general.length > 0) {
      this.carrito.agregarProducto(new EntradaGeneral(descripcion, tarifas.general, general.length, sala.zonas.general), general);
    }
  }

  // Guarda en Almacen solo los asientos que quedan en el carrito.
  guardar() {
    const ids = this.carrito.listaProductos.flatMap(item => item.obtenerAsientos());
    if (ids.length === 0) {
      Almacen.limpiarSeleccion();
      return;
    }
    this.seleccion = Almacen.guardarSeleccion(this.seleccion.funcionId, ids);
  }

  configurarEventos() {
    $("btnVaciar").addEventListener("click", () => this.vaciar());
    $("btnConfirmar").addEventListener("click", () => this.confirmar());
  }

  dibujar() {
    const hayEntradas = this.carrito.obtenerCantidad() > 0;
    $("carritoContenido").hidden = !hayEntradas;
    $("carritoVacio").hidden = hayEntradas;
    $("compraConfirmada").hidden = true;
    $("btnConfirmar").disabled = !hayEntradas;
    const contenedor = $("detalleEntradas");
    contenedor.innerHTML = "";
    for (const item of this.carrito.listaProductos) {
      contenedor.appendChild(this.crearEntrada(item));
    }
    $("cantidadEntradas").textContent = this.carrito.obtenerCantidad();
    $("subtotalCarrito").textContent = moneda(this.carrito.total);
    $("totalCarrito").textContent = moneda(this.carrito.total);
  }

  crearEntrada(item) {
    const producto = item.producto;
    const tarjeta = document.createElement("article");
    tarjeta.className = "entrada";
    // Las etiquetas son fijas. Después ponemos los datos como texto.
    tarjeta.innerHTML = `<div class="entrada-insignia" aria-hidden="true"></div>
      <div class="entrada-datos"><span class="etiqueta etiqueta-fucsia entrada-tipo"></span><h3></h3>
      <p class="entrada-ubicacion"></p>
      <div class="cantidad"><button class="boton boton-icono boton-menos" type="button" aria-label="Quitar una entrada">−</button>
      <span class="cantidad-valor" aria-live="polite"></span>
      <button class="boton boton-icono boton-mas" type="button" aria-label="Agregar una entrada">+</button></div></div>
      <div class="entrada-precio"><strong></strong>
      <button class="boton boton-tenue boton-chico boton-eliminar" type="button">Eliminar</button></div>`;
    tarjeta.querySelector(".entrada-insignia").textContent = producto.idProducto === "vip" ? "VIP" : "GEN";
    tarjeta.querySelector(".entrada-tipo").textContent = moneda(producto.precio) + " cada una";
    tarjeta.querySelector("h3").textContent = producto.mostrarInfo();
    tarjeta.querySelector(".entrada-ubicacion").textContent = "Asientos: " + item.obtenerAsientos().join(", ");
    tarjeta.querySelector(".cantidad-valor").textContent = item.cantidad;
    tarjeta.querySelector("strong").textContent = moneda(item.obtenerSubtotal());

    const menos = tarjeta.querySelector(".boton-menos");
    const mas = tarjeta.querySelector(".boton-mas");
    menos.disabled = item.cantidad === 1;
    mas.disabled = item.cantidad === producto.stock;
    menos.addEventListener("click", () => this.cambiarCantidad(producto.idProducto, item.cantidad - 1));
    mas.addEventListener("click", () => this.cambiarCantidad(producto.idProducto, item.cantidad + 1));
    tarjeta.querySelector(".boton-eliminar").addEventListener("click", () => this.eliminar(producto));
    return tarjeta;
  }

  cambiarCantidad(idProducto, cantidad) {
    this.carrito.actualizarCantidad(idProducto, cantidad);
    this.guardar();
    $("mensajeCarrito").textContent = "";
    this.dibujar();
  }

  eliminar(producto) {
    this.carrito.eliminarProducto(producto.idProducto);
    this.guardar();
    $("mensajeCarrito").textContent = "Se quitó " + producto.nombre + " del carrito.";
    this.dibujar();
  }

  vaciar() {
    Almacen.limpiarSeleccion();
    this.carrito = new CarritoCompra();
    $("mensajeCarrito").textContent = "Se quitó la selección del carrito.";
    this.dibujar();
  }

  confirmar() {
    if (this.carrito.obtenerCantidad() === 0) return;
    this.guardar();
    const orden = new Orden(Almacen.obtenerCliente(), this.seleccion);
    orden.generarOrden(this.carrito);
    const resultado = Almacen.confirmarCompra(orden.aRegistro());   // marca asientos + guarda la orden
    if (!resultado.ok) {
      $("mensajeCarrito").textContent = resultado.motivo;
      return;
    }
    orden.descontarStock();
    this.carrito = new CarritoCompra();
    this.dibujar();
    $("carritoVacio").hidden = true;
    $("compraConfirmada").hidden = false;
    $("pasoCarrito").removeAttribute("aria-current");
    $("pasoOrden").setAttribute("aria-current", "step");
    $("mensajeCarrito").textContent = "";
    $("textoConfirmacion").textContent = "Orden " + orden.numeroOrden +
      " · Cliente: " + orden.cliente.nombre + " (" + orden.cliente.correo + ")" +
      " · Envío: " + orden.cliente.direccionEnvio + " · Estado: " + orden.estado;
    const lista = $("resumenOrden");
    lista.innerHTML = "";
    for (const linea of orden.mostrarResumen()) {
      const li = document.createElement("li");
      li.textContent = linea;
      lista.appendChild(li);
    }
    $("totalOrden").textContent = "Total: " + moneda(orden.total);
    $("fechaConfirmacion").textContent = "Fecha: " + fechaLegible(orden.fecha);
  }
}

new InterfazCarrito();
