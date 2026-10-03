import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Iterator;
import java.util.List;

public class Carrito {
    private int id;
    private List<ItemCarrito> items;
    private int siguienteIdItem;

    public Carrito() {
        this.items = new ArrayList<>();
        this.siguienteIdItem = 1;
    }

    public Carrito(int id) {
        this();
        this.id = id;
    }

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }

    public List<ItemCarrito> obtenerItems() {
        return Collections.unmodifiableList(items);
    }

    // Sobrecarga: agrega una entrada por defecto.
    public void agregarFuncion(Funcion funcion) {
        agregarFuncion(funcion, 1);
    }

    // Sobrecarga: permite indicar cuántas entradas se desean.
    public void agregarFuncion(Funcion funcion, int cantidad) {
        if (funcion == null) {
            throw new IllegalArgumentException("La función no puede ser nula.");
        }
        if (cantidad <= 0) {
            throw new IllegalArgumentException("La cantidad debe ser mayor que cero.");
        }
        if (!funcion.consultarDisponibilidad()) {
            throw new IllegalArgumentException("La función no está disponible.");
        }

        ItemCarrito existente = buscarItemPorFuncion(funcion.getId());
        int cantidadFinal = cantidad;

        if (existente != null) {
            cantidadFinal += existente.getCantidad();
        }

        if (!funcion.consultarDisponibilidad(cantidadFinal)) {
            throw new IllegalArgumentException("La cantidad supera la capacidad de la sala.");
        }

        if (existente != null) {
            existente.actualizarCantidad(cantidadFinal);
        } else {
            items.add(new ItemCarrito(siguienteIdItem++, funcion, cantidad));
        }
    }

    public void actualizarCantidad(int funcionId, int nuevaCantidad) {
        if (nuevaCantidad <= 0) {
            throw new IllegalArgumentException("La cantidad debe ser mayor que cero.");
        }
        ItemCarrito item = buscarItemPorFuncion(funcionId);
        if (item == null) {
            throw new IllegalArgumentException("No existe esa función en el carrito.");
        }
        item.actualizarCantidad(nuevaCantidad);
    }

    public void eliminarFuncion(int funcionId) {
        Iterator<ItemCarrito> iterador = items.iterator();
        while (iterador.hasNext()) {
            if (iterador.next().getFuncion().getId() == funcionId) {
                iterador.remove();
                return;
            }
        }
        System.out.println("La función no se encontró en el carrito.");
    }

    public void vaciarCarrito() {
        items.clear();
    }

    public BigDecimal calcularTotal() {
        BigDecimal total = BigDecimal.ZERO;
        for (ItemCarrito item : items) {
            total = total.add(item.calcularSubtotal());
        }
        return total;
    }

    public void mostrarCarrito() {
        if (items.isEmpty()) {
            System.out.println("El carrito está vacío.");
            return;
        }

        System.out.println("----- CONTENIDO DEL CARRITO -----");
        for (ItemCarrito item : items) {
            item.mostrarDetalle();
        }
        System.out.println("TOTAL: $" + calcularTotal().toPlainString());
    }

    private ItemCarrito buscarItemPorFuncion(int funcionId) {
        for (ItemCarrito item : items) {
            if (item.getFuncion().getId() == funcionId) {
                return item;
            }
        }
        return null;
    }
}
