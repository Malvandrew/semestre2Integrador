# CESDEMAX — venta de entradas de cine

Proyecto académico (HTML + CSS + JavaScript, sin dependencias). Abrir `index.html`
o servir la carpeta con cualquier servidor estático. Para registrar usuarios el
navegador necesita HTTPS o `localhost` (protección de contraseñas).

## Estructura

```
index.html      pantalla principal (portada, nosotros, historia, aliados)
cartelera.html  cartelera, horarios y asientos
carrito.html  login.html     carrito/orden y cuenta (solo contenido de cada una)
css/base.css        sistema de diseño: variables, cabecera, pie, botones, paneles, formularios
css/inicio.css      solo index.html
css/cartelera.css   solo cartelera.html
css/carrito.css     solo carrito.html
css/login.css       solo login.html
js/util.js          funciones compartidas ($, moneda, escapar, Clave)
js/data.js          "backend": modelo de datos + clase Almacen (único acceso a localStorage)
js/layout.js        cabecera y pie ÚNICOS (marca, menú, contacto)
js/cartelera.js  js/carrito.js  js/login.js     lógica de cada página
img/pelicula-N.jpg  póster de la película pN
```

Orden de scripts en cada página: `util.js` → `data.js` → `layout.js` → script de la página (`index.html` solo necesita `util.js` y `layout.js`).

Flujo: Inicio → Cartelera → Carrito (pide sesión) → Orden → Mi cuenta (historial).

Al comprar tres o más asientos en total, entre VIP y General, se aplica un 10 %
de descuento al subtotal de todas las entradas.

## Reglas de diseño

- La paleta (negro, fucsia, amarillo, blanco) está en `:root` de `base.css`. **Prohibido
  escribir colores, radios, espaciados o tamaños de letra a mano** en los CSS de página:
  se usan las variables (`--fucsia`, `--e4`, `--r-md`, `--t-lg`…).
- Tipografía: títulos en **Barlow Condensed** (mayúsculas, `--fuente-titulo`) y texto en **DM Sans** (`--fuente`); se cargan de Google Fonts en el `<head>` de cada página.
- Texto sobre fucsia es **negro** (contraste 5.8:1; el blanco daba 3.6:1).
- Clases en español, kebab-case. Botones: `.boton` + `.boton-primario | .boton-secundario | .boton-tenue`
  (+ `.boton-chico`, `.boton-icono`, `.boton-bloque`).
- Cabecera y pie **no se copian** en los HTML: cambian solo en `layout.js`.
  Cada `<body>` lleva `data-pagina="inicio|cartelera|carrito|cuenta"` para marcar el menú.
- Una página nueva: `base.css` + su CSS propio, `<header id="cabecera">`, `<footer id="pie">`, y los scripts en el orden de arriba.

## Modelo de datos (ver comentario al inicio de `data.js`)

| Colección | Contenido |
|---|---|
| `salas` | id, nombre, filas, columnas, **zonas** (`vip`, `general`: qué filas son de cada tipo) |
| `tarifas` | precio VIP y General |
| `peliculas` | id, título, género, duración, descripción, imagen |
| `funciones` | id único (`p1-1430`), `peliculaId`, `salaId`, `hora` — una proyección |
| `ocupados` | `{ funcionId: ["A1","B3"] }` asientos vendidos |
| `ordenes` | número, usuario, cliente, función, ítems (tipo, asientos, subtotal), total, fecha, estado |
| `clientes` | datos + `clave {sal, hash}` (nunca la contraseña) |
| `seleccion` | temporal entre la cartelera y el carrito |
| `carritos` | `{ usuario: seleccion }` carrito guardado de cada cliente; se reanuda al volver a iniciar sesión |
| `metodos_pago` | `{ usuario: [ { id, tipo, descripcion, token? } ] }` métodos guardados: solo marca y últimos 4 dígitos, o el celular |
| `boveda` | `{ token: número }` lado de la pasarela simulada: el único lugar con el número completo de una tarjeta guardada |

## Pagos (simulados)

Métodos: **tarjeta** de crédito o débito, **PSE**, **Nequi / Daviplata** y **efectivo en taquilla**
(la orden queda "Pendiente de pago"). Las tarjetas y los celulares se pueden guardar al pagar y
se eliminan en **Mi cuenta**. Primero se revisan los asientos y después se cobra (`Almacen.confirmarCompra`).

| Tarjeta de prueba | Resultado |
|---|---|
| `4444 4444 4444 4444` | Aprobada (Visa) |
| `4242 4242 4242 4242` | Aprobada (Visa) |
| `5555 5555 5555 5555` | Rechazada (Mastercard) |

Cualquier fecha futura (MM/AA) y cualquier CVV de 3 dígitos. Otro número: "tarjeta no reconocida".
Para agregar tarjetas de prueba: `TARJETAS_PRUEBA` en `js/data.js`.

**Cambiar datos iniciales:** edita `DATOS_INICIALES` y sube `VERSION_CATALOGO`. Reemplaza el
catálogo sin borrar ventas, órdenes ni cuentas. Si cambias ids de funciones, también migra `ocupados`.
**Cambiar la forma de lo guardado:** sube `VERSION_ESQUEMA` y agrega el paso en `Almacen._migrar()`.
**Regla VIP:** se define en `salas[].zonas`, no en el código.
**Horarios:** una sala no puede tener dos proyecciones a la vez; deja ≥15 min entre una y otra.

## Limitaciones conocidas

- Todo vive en el navegador (`localStorage`): cada visitante ve sus propios datos y puede
  editarlos desde las herramientas del navegador. Las contraseñas se guardan con PBKDF2-SHA256 + sal,
  pero eso no sustituye a un servidor. Para producción: backend con autenticación real
  (la capa `Almacen` está pensada para reemplazarse sin tocar las páginas).
- La compra y la pasarela de pagos son simuladas: no se cobra nada real.
- La foto de la portada se carga desde Unsplash (como en el diseño original). Para no depender de internet, descárgala a `img/portada.jpg` y cambia la URL en `css/inicio.css`.
