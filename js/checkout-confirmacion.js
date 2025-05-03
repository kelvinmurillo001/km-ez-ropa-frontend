"use strict";

// ✅ Configuración base
import { API_BASE } from "./config.js";

// ▶️ Al cargar la página
document.addEventListener("DOMContentLoaded", async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get("token");

  if (!token || token.length < 10) {
    mostrarMensaje("❌ Token de PayPal inválido o no encontrado.", "error");
    return;
  }

  try {
    mostrarMensaje("⏳ Confirmando pago...", "info");

    const res = await fetch(`${API_BASE}/api/paypal/capture-order`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: token })
    });

    const data = await res.json();

    if (res.ok && data?.status?.toUpperCase() === "COMPLETED") {
      console.log("✅ Pago capturado exitosamente:", data);
      mostrarMensaje("✅ Pago confirmado. ¡Gracias por tu compra!", "success");
      limpiarCarrito();
    } else {
      console.error("❌ Error en respuesta de PayPal:", data);
      mostrarMensaje("❌ No pudimos confirmar tu pago. Contáctanos.", "error");
    }
  } catch (err) {
    console.error("❌ Error de red o inesperado:", err);
    mostrarMensaje("❌ Error interno al confirmar el pago. Intenta nuevamente o contáctanos.", "error");
  }
});

/**
 * ✅ Mostrar mensaje visual
 */
function mostrarMensaje(texto, tipo = "info") {
  const msgEstado = document.getElementById("msgEstado");
  if (!msgEstado) return;

  msgEstado.textContent = texto;
  msgEstado.style.color = {
    success: "limegreen",
    error: "tomato",
    warn: "orange",
    info: "#666"
  }[tipo] || "#666";

  msgEstado.classList.add("fade-in");

  // Opcional: mantener el mensaje más tiempo si es error
  const delay = tipo === "error" ? 6000 : 3000;
  setTimeout(() => msgEstado.classList.remove("fade-in"), delay);
}

/**
 * ✅ Limpiar localStorage de pedido
 */
function limpiarCarrito() {
  localStorage.removeItem("km_ez_cart");
  localStorage.removeItem("km_ez_last_order");
  localStorage.removeItem("codigoSeguimiento");
}
