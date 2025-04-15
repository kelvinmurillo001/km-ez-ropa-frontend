"use strict";

/**
 * 🔤 Capitaliza una cadena de texto.
 * Ejemplo: "ropa" → "Ropa"
 * @param {string} str - Texto a capitalizar
 * @returns {string}
 */
export function capitalizar(str) {
  return typeof str === "string"
    ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
    : "";
}

/**
 * 🔢 Actualiza visualmente el contador del widget del carrito.
 * Usa el ID #cart-widget-count y obtiene los datos del localStorage.
 */
export function actualizarContadorCarrito() {
  try {
    const carrito = JSON.parse(localStorage.getItem("km_ez_cart") || "[]");
    const total = Array.isArray(carrito)
      ? carrito.reduce((acc, item) => acc + (item.cantidad || 0), 0)
      : 0;

    const contador = document.getElementById("cart-widget-count");
    if (contador) {
      contador.textContent = total;
      contador.setAttribute("aria-label", `Tienes ${total} productos en el carrito`);
    }
  } catch (err) {
    console.warn("❌ Error actualizando contador del carrito:", err);
  }
}

/**
 * 🧹 Limpia completamente un contenedor HTML
 * @param {HTMLElement} contenedor - Elemento que deseas limpiar
 */
export function limpiarContenedor(contenedor) {
  if (contenedor && contenedor instanceof HTMLElement) {
    contenedor.innerHTML = "";
  }
}

/**
 * ⏱️ Pausa simple usando promesas (await delay(ms))
 * @param {number} ms - Milisegundos a esperar
 * @returns {Promise<void>}
 */
export function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
