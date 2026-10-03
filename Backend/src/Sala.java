public class Sala {
    private int id;
    private String numero;
    private int capacidad;

    public Sala(int id, String numero, int capacidad) {
        if (capacidad <= 0) {
            throw new IllegalArgumentException("La capacidad debe ser mayor que cero.");
        }
        this.id = id;
        this.numero = numero;
        this.capacidad = capacidad;
    }

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public String getNumero() {
        return numero;
    }

    public void setNumero(String numero) {
        this.numero = numero;
    }

    public int getCapacidad() {
        return capacidad;
    }

    public void setCapacidad(int capacidad) {
        if (capacidad <= 0) {
            throw new IllegalArgumentException("La capacidad debe ser mayor que cero.");
        }
        this.capacidad = capacidad;
    }

    public boolean verificarDisponibilidad(int cantidad) {
        return cantidad > 0 && cantidad <= capacidad;
    }

    public void mostrarInformacion() {
        System.out.println("Sala " + numero + " | Capacidad: " + capacidad);
    }
}
