"use strict";

import { API_BASE } from "./config.js";

document.addEventListener("DOMContentLoaded", async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get("token");

  if (!token || token.length < 10) {
    mostrarMensaje("❌ Token de PayPal inválido o no encontrado.", "error");
    return;
  }

  try {
    mostrarMensaje("⏳ Confirmando pago con PayPal...", "info");

    const res = await fetch(`${API_BASE}/api/paypal/capture-order`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: token })
    });

    const data = await res.json();

    if (res.ok && data?.data?.status?.toUpperCase() === "COMPLETED") {
      console.log("✅ Pago capturado exitosamente:", data.data);
      mostrarMensaje("✅ ¡Pago confirmado correctamente! 🎉 Gracias por tu compra.", "success");
      limpiarCarrito();
    } else {
      const errorMsg = data?.message || "❌ No pudimos confirmar tu pago. Contáctanos si el problema persiste.";
      console.warn("⚠️ Error de confirmación:", data);
      mostrarMensaje(errorMsg, "error");
    }

  } catch (err) {
    console.error("❌ Error de red o inesperado:", err);
    mostrarMensaje("❌ Error interno al confirmar el pago. Intenta nuevamente o contáctanos.", "error");
  }
});

/**
 * Muestra un mensaje visual al usuario
 * @param {string} texto - Texto del mensaje
 * @param {'success'|'error'|'info'|'warn'} tipo - Tipo visual del mensaje
 */
function mostrarMensaje(texto, tipo = "info") {
  const msgEstado = document.getElementById("msgEstado");
  if (!msgEstado) return;

  msgEstado.textContent = texto;
  msgEstado.style.color = {
    success: "limegreen",
    error: "tomato",
    warn: "orange",
    info: "#555"
  }[tipo] || "#555";

  msgEstado.classList.add("fade-in");

  const tiempoDesaparicion = tipo === "error" ? 7000 : 4000;
  setTimeout(() => {
    msgEstado.classList.remove("fade-in");
  }, tiempoDesaparicion);
}

/**
 * Limpia el carrito y los datos del pedido en localStorage tras una compra exitosa
 */
function limpiarCarrito() {
  ["km_ez_cart", "km_ez_last_order", "codigoSeguimiento"].forEach(localStorage.removeItem.bind(localStorage));
}
