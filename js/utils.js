"use strict";

/**
 * 🔤 Capitalizar una cadena
 * @param {string} str
 * @returns {string}
 */
export function capitalizar(str) {
  return typeof str === "string"
    ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
    : str;
}

/**
 * 🔢 Actualiza el contador del carrito visual (ícono)
 */
export function actualizarContadorCarrito() {
  const carrito = JSON.parse(localStorage.getItem("km_ez_cart") || "[]");
  const total = carrito.reduce((acc, item) => acc + item.cantidad, 0);
  const contador = document.getElementById("cart-widget-count");
  if (contador) contador.textContent = total;
}

/**
 * 🧹 Limpia un contenedor HTML
 * @param {HTMLElement} contenedor
 */
export function limpiarContenedor(contenedor) {
  if (contenedor) contenedor.innerHTML = "";
}

/**
 * ⏱️ Retardo simple
 * @param {number} ms - Milisegundos
 */
export function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
