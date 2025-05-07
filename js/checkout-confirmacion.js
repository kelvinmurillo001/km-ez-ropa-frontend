"use strict";

import { API_BASE } from "./config.js";

let yaProcesado = false;

document.addEventListener("DOMContentLoaded", async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get("token");

  if (!token || token.length < 10 || !/^[a-zA-Z0-9-_]+$/.test(token)) {
    mostrarMensaje("❌ Token inválido o alterado. Por favor contacta soporte.", "error");
    return;
  }

  if (yaProcesado) return;
  yaProcesado = true;

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
      mostrarMensaje("✅ ¡Pago confirmado! 🎉 Gracias por tu compra.", "success");
      limpiarCarrito();
    } else {
      const errorMsg = data?.message || "❌ No pudimos confirmar tu pago. Si ya fue debitado, por favor contáctanos.";
      console.warn("⚠️ Error de confirmación:", data);
      mostrarMensaje(errorMsg, "error");
    }

  } catch (err) {
    console.error("❌ Error inesperado:", err);
    mostrarMensaje("❌ Error interno al confirmar el pago. Intenta más tarde o contáctanos.", "error");
  }
});

/**
 * ✅ Mostrar mensaje al usuario
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

  const timeout = tipo === "error" ? 8000 : 5000;
  setTimeout(() => msgEstado.classList.remove("fade-in"), timeout);
}

/**
 * 🧹 Limpiar localStorage tras pago exitoso
 */
function limpiarCarrito() {
  ["km_ez_cart", "km_ez_last_order", "codigoSeguimiento"].forEach(clave => {
    localStorage.removeItem(clave);
  });
}
