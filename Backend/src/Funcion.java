import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Objects;

public class Funcion {
    private int id;
    private LocalDate fecha;
    private LocalTime hora;
    private Sala sala;
    private BigDecimal precio;
    private Pelicula pelicula;
    private boolean disponible;

    public Funcion(int id, Pelicula pelicula, LocalDate fecha, LocalTime hora,
                   Sala sala, BigDecimal precio) {
        if (precio == null || precio.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("El precio no puede ser negativo ni nulo.");
        }
        this.id = id;
        this.pelicula = Objects.requireNonNull(pelicula, "La película es obligatoria.");
        this.fecha = Objects.requireNonNull(fecha, "La fecha es obligatoria.");
        this.hora = Objects.requireNonNull(hora, "La hora es obligatoria.");
        this.sala = Objects.requireNonNull(sala, "La sala es obligatoria.");
        this.precio = precio;
        this.disponible = true;
    }

    // Constructor sobrecargado que usa la fecha y hora actuales.
    public Funcion(int id, Pelicula pelicula, Sala sala, BigDecimal precio) {
        this(id, pelicula, LocalDate.now(), LocalTime.now().withSecond(0).withNano(0), sala, precio);
    }

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }

    public LocalDate getFecha() { return fecha; }
    public void setFecha(LocalDate fecha) { this.fecha = Objects.requireNonNull(fecha); }

    public LocalTime getHora() { return hora; }
    public void setHora(LocalTime hora) { this.hora = Objects.requireNonNull(hora); }

    public Sala getSala() { return sala; }
    public void setSala(Sala sala) { this.sala = Objects.requireNonNull(sala); }

    public BigDecimal getPrecio() { return precio; }
    public void setPrecio(BigDecimal precio) {
        if (precio == null || precio.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("El precio no puede ser negativo ni nulo.");
        }
        this.precio = precio;
    }

    public Pelicula getPelicula() { return pelicula; }
    public void setPelicula(Pelicula pelicula) { this.pelicula = Objects.requireNonNull(pelicula); }

    public boolean isDisponible() { return disponible; }
    public void setDisponible(boolean disponible) { this.disponible = disponible; }

    public boolean consultarDisponibilidad() {
        return disponible && sala.getCapacidad() > 0;
    }

    public boolean consultarDisponibilidad(int cantidad) {
        return consultarDisponibilidad() && sala.verificarDisponibilidad(cantidad);
    }

    public void mostrarDetalles() {
        System.out.println("  Función " + id + " | Fecha: " + fecha
                + " | Hora: " + hora + " | Sala: " + sala.getNumero()
                + " | Precio: $" + precio.toPlainString()
                + " | Disponible: " + (consultarDisponibilidad() ? "Sí" : "No"));
    }
}
