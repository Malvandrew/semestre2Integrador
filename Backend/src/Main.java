import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;

public class Main {
    public static void main(String[] args) {
        // Crear salas.
        Sala sala1 = new Sala(1, "1", 40);
        Sala sala2 = new Sala(2, "2", 25);

        // Crear películas.
        Pelicula pelicula1 = new Pelicula(
                1, "Aventura espacial", "Ciencia ficción", 120,
                "Todo público", "Una aventura entre las estrellas.", ""
        );
        Pelicula pelicula2 = new Pelicula(
                2, "Misterio en la noche", "Suspenso", 105
        );

        // Crear funciones.
        Funcion funcion1 = new Funcion(
                101, pelicula1, LocalDate.of(2026, 10, 10),
                LocalTime.of(15, 30), sala1, new BigDecimal("18000")
        );
        Funcion funcion2 = new Funcion(
                102, pelicula1, LocalDate.of(2026, 10, 10),
                LocalTime.of(19, 0), sala2, new BigDecimal("22000")
        );
        Funcion funcion3 = new Funcion(
                201, pelicula2, LocalDate.of(2026, 10, 10),
                LocalTime.of(17, 15), sala1, new BigDecimal("16000")
        );

        // Relación: una película puede tener varias funciones.
        pelicula1.agregarFuncion(funcion1);
        pelicula1.agregarFuncion(funcion2);
        pelicula2.agregarFuncion(funcion3);

        // Herencia: Cliente es un Usuario y hereda su carrito.
        Cliente cliente = new Cliente(1, "Alejandra", "aleja@correo.com", "3001234567");
        cliente.mostrarPerfil();

        System.out.println("\\n===== PELÍCULAS Y FUNCIONES =====");
        pelicula1.mostrarInformacion();
        pelicula1.mostrarFunciones();
        pelicula2.mostrarInformacion();
        pelicula2.mostrarFunciones();

        System.out.println("\\n===== CONSULTAR DISPONIBILIDAD =====");
        System.out.println("¿Hay espacio para 3 entradas en la función 101? "
                + (funcion1.consultarDisponibilidad(3) ? "Sí" : "No"));

        Carrito carrito = cliente.getCarrito();

        System.out.println("\\n===== AGREGAR ENTRADAS =====");
        carrito.agregarFuncion(funcion1);       // Sobrecarga: agrega 1 entrada.
        carrito.agregarFuncion(funcion1, 2);    // Agrega 2 más a la misma función.
        carrito.agregarFuncion(funcion2, 1);    // Otra película/horario también podría agregarse.
        carrito.agregarFuncion(funcion3, 2);

        carrito.mostrarCarrito();

        System.out.println("\\n===== MODIFICAR CANTIDAD =====");
        carrito.actualizarCantidad(102, 3);
        carrito.mostrarCarrito();

        System.out.println("\\n===== ELIMINAR UNA FUNCIÓN =====");
        carrito.eliminarFuncion(201);
        carrito.mostrarCarrito();

        System.out.println("\\n===== VACIAR CARRITO =====");
        carrito.vaciarCarrito();
        carrito.mostrarCarrito();

        System.out.println("\\nNota: el carrito solo calcula una selección provisional. "
                + "No registra una compra ni descuenta entradas de la capacidad de la sala.");
    }
}
