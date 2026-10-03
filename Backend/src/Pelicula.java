import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class Pelicula {
    private int id;
    private String titulo;
    private String genero;
    private int duracion;
    private String clasificacion;
    private String descripcion;
    private String imagenUrl;
    private List<Funcion> funciones;

    public Pelicula(int id, String titulo, String genero, int duracion,
                    String clasificacion, String descripcion, String imagenUrl) {
        this.id = id;
        this.titulo = titulo;
        this.genero = genero;
        this.duracion = duracion;
        this.clasificacion = clasificacion;
        this.descripcion = descripcion;
        this.imagenUrl = imagenUrl;
        this.funciones = new ArrayList<>();
    }

    // Constructor sobrecargado con los datos esenciales.
    public Pelicula(int id, String titulo, String genero, int duracion) {
        this(id, titulo, genero, duracion, "Sin clasificar", "", "");
    }

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }

    public String getTitulo() { return titulo; }
    public void setTitulo(String titulo) { this.titulo = titulo; }

    public String getGenero() { return genero; }
    public void setGenero(String genero) { this.genero = genero; }

    public int getDuracion() { return duracion; }
    public void setDuracion(int duracion) { this.duracion = duracion; }

    public String getClasificacion() { return clasificacion; }
    public void setClasificacion(String clasificacion) { this.clasificacion = clasificacion; }

    public String getDescripcion() { return descripcion; }
    public void setDescripcion(String descripcion) { this.descripcion = descripcion; }

    public String getImagenUrl() { return imagenUrl; }
    public void setImagenUrl(String imagenUrl) { this.imagenUrl = imagenUrl; }

    public void agregarFuncion(Funcion funcion) {
        if (funcion == null) {
            throw new IllegalArgumentException("La función no puede ser nula.");
        }
        if (!funciones.contains(funcion)) {
            funciones.add(funcion);
        }
    }

    public List<Funcion> obtenerFunciones() {
        return Collections.unmodifiableList(funciones);
    }

    public void mostrarInformacion() {
        System.out.println("Película: " + titulo + " | Género: " + genero
                + " | Duración: " + duracion + " minutos"
                + " | Clasificación: " + clasificacion);
        if (!descripcion.isBlank()) {
            System.out.println("Descripción: " + descripcion);
        }
    }

    public void mostrarFunciones() {
        System.out.println("Funciones de: " + titulo);
        if (funciones.isEmpty()) {
            System.out.println("No hay funciones registradas.");
            return;
        }
        for (Funcion funcion : funciones) {
            funcion.mostrarDetalles();
        }
    }
}
