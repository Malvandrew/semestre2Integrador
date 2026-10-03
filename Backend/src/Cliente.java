public class Cliente extends Usuario {
    private String telefono;

    public Cliente(int id, String nombre, String email, String telefono) {
        super(id, nombre, email);
        this.telefono = telefono;
    }

    // Constructor sobrecargado.
    public Cliente(int id, String nombre, String email) {
        this(id, nombre, email, "");
    }

    public String getTelefono() {
        return telefono;
    }

    public void setTelefono(String telefono) {
        this.telefono = telefono;
    }

    @Override
    public void mostrarPerfil() {
        super.mostrarPerfil();
        System.out.println("Teléfono: " + telefono);
    }
}
