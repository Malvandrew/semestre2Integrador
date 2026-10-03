import java.util.Objects;

public class Usuario {
    private int id;
    private String nombre;
    private String email;
    private Carrito carrito;

    public Usuario(int id, String nombre, String email) {
        this.id = id;
        this.nombre = Objects.requireNonNull(nombre, "El nombre no puede ser nulo.");
        this.email = Objects.requireNonNull(email, "El email no puede ser nulo.");
        this.carrito = new Carrito();
    }

    // Constructor sobrecargado: permite crear el usuario sin email.
    public Usuario(int id, String nombre) {
        this(id, nombre, "");
    }

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = Objects.requireNonNull(nombre);
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = Objects.requireNonNull(email);
    }

    public Carrito getCarrito() {
        return carrito;
    }

    public void mostrarPerfil() {
        System.out.println("Usuario: " + nombre + " | Email: " + email);
    }
}
