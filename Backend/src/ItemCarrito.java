import java.math.BigDecimal;
import java.util.Objects;

public class ItemCarrito {
    private int id;
    private Funcion funcion;
    private int cantidad;
    private BigDecimal subtotal;

    public ItemCarrito(int id, Funcion funcion, int cantidad) {
        this.id = id;
        this.funcion = Objects.requireNonNull(funcion, "La función es obligatoria.");
        validarCantidad(cantidad);
        if (!funcion.consultarDisponibilidad(cantidad)) {
            throw new IllegalArgumentException("La cantidad supera la capacidad disponible de la sala.");
        }
        this.cantidad = cantidad;
        calcularSubtotal();
    }

    // Constructor sobrecargado: crea un elemento con una entrada.
    public ItemCarrito(int id, Funcion funcion) {
        this(id, funcion, 1);
    }

    private void validarCantidad(int cantidad) {
        if (cantidad <= 0) {
            throw new IllegalArgumentException("La cantidad debe ser mayor que cero.");
        }
    }

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }

    public Funcion getFuncion() { return funcion; }
    public void setFuncion(Funcion funcion) {
        this.funcion = Objects.requireNonNull(funcion);
        calcularSubtotal();
    }

    public int getCantidad() { return cantidad; }

    public BigDecimal getSubtotal() { return subtotal; }

    public BigDecimal calcularSubtotal() {
        subtotal = funcion.getPrecio().multiply(BigDecimal.valueOf(cantidad));
        return subtotal;
    }

    public void actualizarCantidad(int cantidad) {
        validarCantidad(cantidad);
        if (!funcion.consultarDisponibilidad(cantidad)) {
            throw new IllegalArgumentException("La cantidad supera la capacidad disponible de la sala.");
        }
        this.cantidad = cantidad;
        calcularSubtotal();
    }

    public void mostrarDetalle() {
        System.out.println("Función " + funcion.getId()
                + " - " + funcion.getPelicula().getTitulo()
                + " | " + funcion.getFecha() + " " + funcion.getHora()
                + " | Entradas: " + cantidad
                + " | Subtotal: $" + subtotal.toPlainString());
    }
}
