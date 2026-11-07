/* ==========================================================
   util.js — funciones compartidas por TODAS las páginas.
   Se carga primero. Antes estaban copiadas en cada archivo.
   ========================================================== */

const $ = id => document.getElementById(id);

const moneda = n => Number(n).toLocaleString("es-CO", {
  style: "currency", currency: "COP", maximumFractionDigits: 0
});

const fechaLegible = iso => new Date(iso).toLocaleString("es-CO");

/* Escapa texto antes de meterlo en un innerHTML */
const escapar = t => String(t).replace(/[&<>"']/g, c =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

/* "Fila A" / "Filas B y C" / "Filas A, B y C" */
function textoFilas(filas) {
  if (filas.length === 1) return "Fila " + filas[0];
  return "Filas " + filas.slice(0, -1).join(", ") + " y " + filas[filas.length - 1];
}

/* ----- Protección de contraseñas (PBKDF2-SHA256 con sal) -----
   Mejora frente a guardar la contraseña en texto plano, pero NO
   reemplaza a un servidor: todo corre en el navegador del usuario. */
const Clave = {
  disponible() { return !!(window.crypto && window.crypto.subtle); },
  _hex(bytes) { return Array.from(new Uint8Array(bytes), b => b.toString(16).padStart(2, "0")).join(""); },
  nuevaSal() { return this._hex(crypto.getRandomValues(new Uint8Array(16))); },
  async hash(contrasena, sal) {
    const codificar = t => new TextEncoder().encode(t);
    const base = await crypto.subtle.importKey("raw", codificar(contrasena), "PBKDF2", false, ["deriveBits"]);
    const bits = await crypto.subtle.deriveBits(
      { name: "PBKDF2", hash: "SHA-256", salt: codificar(sal), iterations: 100000 }, base, 256);
    return this._hex(bits);
  }
};
