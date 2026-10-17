/* Carrito académico: cada producto es un tipo de entrada (VIP o General). */
function buscar(id) {
  return document.getElementById(id);
}

function moneda(valor) {
  return Number(valor).toLocaleString("es-CO", {
    style: "currency", currency: "COP", maximumFractionDigits: 0
  });
}

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

/* Herencia: cada tipo de entrada agrega su propio dato */
class EntradaVIP extends Producto {
  constructor(descripcion, precio, stock) {
    super("vip", "Entrada VIP", descripcion, precio, stock);
    this.fila = "A";
  }
  // Polimorfismo: mostrarInfo() cambia según el tipo de entrada.
  mostrarInfo() {
    return "Entrada VIP · Fila " + this.fila + " · " + this.descripcion;
  }
}

class EntradaGeneral extends Producto {
  constructor(descripcion, precio, stock) {
    super("general", "Entrada General", descripcion, precio, stock);
    this.filas = "B y C";
  }
  mostrarInfo() {
    return "Entrada General · Filas " + this.filas + " · " + this.descripcion;
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
    const restantes = [];
    for (const item of this.listaProductos) {
      if (item.producto.idProducto !== idProducto) restantes.push(item);
    }
    this.listaProductos = restantes;
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
    let total = 0;
    for (const item of this.listaProductos) {
      total = total + item.obtenerSubtotal();
    }
    this.total = total;
    return total;
  }
  obtenerCantidad() {
    let cantidad = 0;
    for (const item of this.listaProductos) {
      cantidad = cantidad + item.cantidad;
    }
    return cantidad;
  }
}

class Orden {
  constructor(cliente) {
    this.numeroOrden = "CMX-" + Date.now();
    this.cliente = cliente;
    this.listaProductos = [];
    this.total = 0;
    this.fecha = "";
    this.estado = "Pendiente";
  }
  generarOrden(carrito) {
    for (const item of carrito.listaProductos) {
      this.listaProductos.push(item);
      item.producto.actualizarStock(item.cantidad);
    }
    this.total = carrito.calcularTotal();
    this.fecha = new Date().toLocaleString("es-CO");
    this.estado = "Confirmada";
  }
  mostrarResumen() {
    const lineas = [];
    for (const item of this.listaProductos) {
      lineas.push(item.producto.mostrarInfo() + " · Cantidad: " + item.cantidad +
        " · Asientos: " + item.obtenerAsientos().join(", ") + " · " + moneda(item.obtenerSubtotal()));
    }
    return lineas;
  }
}

class InterfazCarrito {
  constructor() {
    // Solo los clientes con sesión iniciada pueden usar el carrito.
    if (Almacen.obtenerCliente() === null) {
      window.location.href = "login.html";
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
    const descripcion = sel.titulo + " · " + sel.salaNombre + " · " + sel.hora;
    const vip = [];
    const general = [];
    for (const asiento of sel.asientos) {
      if (asiento.tipo === "vip") vip.push(asiento.id);
      else general.push(asiento.id);
    }
    if (vip.length > 0) {
      this.carrito.agregarProducto(new EntradaVIP(descripcion, tarifas.vip, vip.length), vip);
    }
    if (general.length > 0) {
      this.carrito.agregarProducto(new EntradaGeneral(descripcion, tarifas.general, general.length), general);
    }
  }

  // Guarda en Almacen solo los asientos que quedan en el carrito.
  guardar() {
    const ids = [];
    for (const item of this.carrito.listaProductos) {
      for (const id of item.obtenerAsientos()) ids.push(id);
    }
    if (ids.length === 0) {
      Almacen.limpiarSeleccion();
      return;
    }
    this.seleccion = Almacen.guardarSeleccion(this.seleccion.funcionId, this.seleccion.horarioId, ids);
  }

  configurarEventos() {
    buscar("btnVaciar").addEventListener("click", () => this.vaciar());
    buscar("btnConfirmar").addEventListener("click", () => this.confirmar());
    buscar("btnMenu").addEventListener("click", () => {
      const abierto = buscar("menu").classList.toggle("abierto");
      buscar("btnMenu").setAttribute("aria-expanded", abierto);
    });
  }

  dibujar() {
    const hayEntradas = this.carrito.obtenerCantidad() > 0;
    buscar("carritoContenido").hidden = !hayEntradas;
    buscar("carritoVacio").hidden = hayEntradas;
    buscar("compraConfirmada").hidden = true;
    buscar("btnConfirmar").disabled = !hayEntradas;
    const contenedor = buscar("detalleEntradas");
    contenedor.innerHTML = "";
    for (const item of this.carrito.listaProductos) {
      contenedor.appendChild(this.crearEntrada(item));
    }
    buscar("cantidadEntradas").textContent = this.carrito.obtenerCantidad();
    buscar("subtotalCarrito").textContent = moneda(this.carrito.total);
    buscar("totalCarrito").textContent = moneda(this.carrito.total);
  }

  crearEntrada(item) {
    const producto = item.producto;
    const tarjeta = document.createElement("article");
    tarjeta.className = "entrada-item";
    // Las etiquetas son fijas. Después ponemos los datos como texto.
    tarjeta.innerHTML = `<div class="entrada-asiento" aria-hidden="true"></div>
      <div class="entrada-datos"><span class="entrada-tipo"></span><h3></h3>
      <p class="entrada-ubicacion"></p>
      <div class="cantidad"><button class="btn-cantidad btn-menos" type="button">−</button>
      <span class="cantidad-valor"></span>
      <button class="btn-cantidad btn-mas" type="button">+</button></div></div>
      <div class="entrada-precio"><strong></strong>
      <button class="btn-peligro btn-eliminar" type="button">Eliminar</button></div>`;
    tarjeta.querySelector(".entrada-asiento").textContent = producto.idProducto === "vip" ? "VIP" : "GEN";
    tarjeta.querySelector(".entrada-tipo").textContent = moneda(producto.precio) + " cada una";
    tarjeta.querySelector("h3").textContent = producto.mostrarInfo();
    tarjeta.querySelector(".entrada-ubicacion").textContent = "Asientos: " + item.obtenerAsientos().join(", ");
    tarjeta.querySelector(".cantidad-valor").textContent = item.cantidad;
    tarjeta.querySelector("strong").textContent = moneda(item.obtenerSubtotal());

    const menos = tarjeta.querySelector(".btn-menos");
    const mas = tarjeta.querySelector(".btn-mas");
    menos.disabled = item.cantidad === 1;
    mas.disabled = item.cantidad === producto.stock;
    menos.addEventListener("click", () => this.cambiarCantidad(producto.idProducto, item.cantidad - 1));
    mas.addEventListener("click", () => this.cambiarCantidad(producto.idProducto, item.cantidad + 1));
    tarjeta.querySelector(".btn-eliminar").addEventListener("click", () => this.eliminar(producto));
    return tarjeta;
  }

  cambiarCantidad(idProducto, cantidad) {
    this.carrito.actualizarCantidad(idProducto, cantidad);
    this.guardar();
    buscar("mensajeCarrito").textContent = "";
    this.dibujar();
  }

  eliminar(producto) {
    this.carrito.eliminarProducto(producto.idProducto);
    this.guardar();
    buscar("mensajeCarrito").textContent = "Se quitó " + producto.nombre + " del carrito.";
    this.dibujar();
  }

  vaciar() {
    Almacen.limpiarSeleccion();
    this.carrito = new CarritoCompra();
    buscar("mensajeCarrito").textContent = "Se quitó la selección del carrito.";
    this.dibujar();
  }

  confirmar() {
    if (this.carrito.obtenerCantidad() === 0) return;
    this.guardar();
    if (Almacen.confirmarCompra() === false) {
      buscar("mensajeCarrito").textContent = "Algún asiento ya está ocupado. Vuelve a la cartelera y elige otros.";
      return;
    }
    const orden = new Orden(Almacen.obtenerCliente());
    orden.generarOrden(this.carrito);
    this.carrito = new CarritoCompra();
    this.dibujar();
    buscar("carritoVacio").hidden = true;
    buscar("compraConfirmada").hidden = false;
    buscar("pasoCarrito").removeAttribute("aria-current");
    buscar("pasoOrden").setAttribute("aria-current", "step");
    buscar("mensajeCarrito").textContent = "";
    buscar("textoConfirmacion").textContent = "Orden " + orden.numeroOrden +
      " · Cliente: " + orden.cliente.nombre + " (" + orden.cliente.correo + ")" +
      " · Envío: " + orden.cliente.direccionEnvio + " · Estado: " + orden.estado;
    const lista = buscar("resumenOrden");
    lista.innerHTML = "";
    for (const linea of orden.mostrarResumen()) {
      const li = document.createElement("li");
      li.textContent = linea;
      lista.appendChild(li);
    }
    buscar("totalOrden").textContent = "Total: " + moneda(orden.total);
    buscar("fechaConfirmacion").textContent = "Fecha: " + orden.fecha;
  }
}

new InterfazCarrito();
