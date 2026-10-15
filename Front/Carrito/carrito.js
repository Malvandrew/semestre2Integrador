/* Carrito académico: cada asiento representa una entrada. */
function buscar(id) {
  return document.getElementById(id);
}

function moneda(valor) {
  return Number(valor).toLocaleString("es-CO", {
    style: "currency", currency: "COP", maximumFractionDigits: 0
  });
}

class Producto {
  constructor(seleccion, asiento) {
    this.pelicula = seleccion.titulo;
    this.sala = seleccion.salaNombre;
    this.horario = seleccion.hora;
    this.asiento = asiento.id;
    this.tipo = asiento.tipo;
    this.precio = Number(asiento.precio);
  }
}

class ItemCarrito {
  constructor(producto) {
    this.producto = producto;
    this.cantidad = 1; // No podemos vender dos veces el mismo asiento.
  }
  obtenerSubtotal() {
    return this.producto.precio * this.cantidad;
  }
}

class CarritoCompra {
  constructor(seleccion) {
    this.seleccion = seleccion;
    this.items = [];
    if (seleccion !== null) {
      for (const asiento of seleccion.asientos) {
        const producto = new Producto(seleccion, asiento);
        this.items.push(new ItemCarrito(producto));
      }
    }
  }
  obtenerCantidad() {
    return this.items.length;
  }
  obtenerTotal() {
    let total = 0;
    for (const item of this.items) {
      total = total + item.obtenerSubtotal();
    }
    return total;
  }
}

class Orden {
  constructor(carrito) {
    this.numero = "CMX-" + Date.now();
    this.fecha = new Date().toLocaleString("es-CO");
    this.pelicula = carrito.seleccion.titulo;
    this.sala = carrito.seleccion.salaNombre;
    this.horario = carrito.seleccion.hora;
    this.asientos = [];
    for (const item of carrito.items) {
      this.asientos.push(item.producto.asiento);
    }
    this.total = carrito.obtenerTotal();
  }
}

class InterfazCarrito {
  constructor() {
    this.carrito = new CarritoCompra(Almacen.obtenerSeleccion());
    this.configurarEventos();
    this.dibujar();
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
    for (const item of this.carrito.items) {
      contenedor.appendChild(this.crearEntrada(item));
    }
    buscar("cantidadEntradas").textContent = this.carrito.obtenerCantidad();
    buscar("subtotalCarrito").textContent = moneda(this.carrito.obtenerTotal());
    buscar("totalCarrito").textContent = moneda(this.carrito.obtenerTotal());
  }

  crearEntrada(item) {
    const producto = item.producto;
    const tarjeta = document.createElement("article");
    tarjeta.className = "entrada-item";
    // Las etiquetas son fijas. Después ponemos los datos como texto.
    tarjeta.innerHTML = `<div class="entrada-asiento" aria-hidden="true"></div>
      <div class="entrada-datos"><span class="entrada-tipo"></span><h3></h3>
      <p class="entrada-funcion"></p><p class="entrada-ubicacion"></p></div>
      <div class="entrada-precio"><strong></strong>
      <button class="btn-peligro" type="button">Eliminar</button></div>`;
    tarjeta.querySelector(".entrada-asiento").textContent = producto.asiento;
    tarjeta.querySelector(".entrada-tipo").textContent = "Entrada " + producto.tipo;
    tarjeta.querySelector("h3").textContent = producto.pelicula;
    tarjeta.querySelector(".entrada-funcion").textContent = producto.sala + " · " + producto.horario;
    tarjeta.querySelector(".entrada-ubicacion").textContent = "Asiento " + producto.asiento + " · 1 entrada";
    tarjeta.querySelector("strong").textContent = moneda(item.obtenerSubtotal());
    const boton = tarjeta.querySelector("button");
    boton.setAttribute("aria-label", "Eliminar asiento " + producto.asiento);
    boton.addEventListener("click", () => this.eliminarAsiento(producto.asiento));
    return tarjeta;
  }

  eliminarAsiento(asientoId) {
    const seleccion = this.carrito.seleccion;
    const restantes = [];
    for (const asiento of seleccion.asientos) {
      if (asiento.id !== asientoId) restantes.push(asiento);
    }
    if (restantes.length === 0) {
      this.vaciar();
      return;
    }
    seleccion.asientos = restantes;
    this.carrito = new CarritoCompra(seleccion);
    seleccion.total = this.carrito.obtenerTotal();
    Almacen.actualizarSeleccion(seleccion);
    buscar("mensajeCarrito").textContent = "Se quitó el asiento " + asientoId + ".";
    this.dibujar();
  }

  vaciar() {
    Almacen.limpiarSeleccion();
    this.carrito = new CarritoCompra(null);
    buscar("mensajeCarrito").textContent = "Se quitó la selección del carrito.";
    this.dibujar();
  }

  confirmar() {
    if (this.carrito.obtenerCantidad() === 0) return;
    // Guarda la selección que estamos mostrando antes de confirmarla.
    Almacen.actualizarSeleccion(this.carrito.seleccion);
    const orden = new Orden(this.carrito);
    if (Almacen.confirmarCompra() === false) {
      buscar("mensajeCarrito").textContent = "Algún asiento ya está ocupado. Vuelve a la cartelera y elige otros.";
      return;
    }
    this.carrito = new CarritoCompra(null);
    this.dibujar();
    buscar("carritoVacio").hidden = true;
    buscar("compraConfirmada").hidden = false;
    buscar("textoConfirmacion").textContent = "Orden " + orden.numero + ". " +
      orden.pelicula + " · " + orden.sala + " · " + orden.horario +
      ". Asientos: " + orden.asientos.join(", ") + ". Total: " + moneda(orden.total) + ".";
    buscar("fechaConfirmacion").textContent = "Fecha de confirmación: " + orden.fecha;
    buscar("mensajeCarrito").textContent = "";
  }
}

new InterfazCarrito();
