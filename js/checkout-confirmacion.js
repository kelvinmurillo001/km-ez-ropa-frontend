"use strict";

// ✅ Configuración base
import { API_BASE } from "./config.js";

// ▶️ Al cargar la página
document.addEventListener("DOMContentLoaded", async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get("token");

  if (!token) {
    mostrarMensaje("❌ Token de PayPal no encontrado.", "error");
    return;
  }

  try {
    mostrarMensaje("⏳ Confirmando pago...", "info");

    // 📤 Capturar orden PayPal
    const res = await fetch(`${API_BASE}/api/paypal/capture-order`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: token })
    });
    const data = await res.json();

    if (res.ok && data.status === "COMPLETED") {
      console.log("✅ Pago capturado exitosamente:", data);
      mostrarMensaje("✅ Pago confirmado exitosamente. ¡Gracias por tu compra!", "success");
      limpiarCarrito();
    } else {
      console.error("❌ El pago no pudo completarse:", data);
      mostrarMensaje("❌ No pudimos confirmar tu pago. Contáctanos.", "error");
    }
  } catch (err) {
    console.error("❌ Error capturando la orden PayPal:", err);
    mostrarMensaje("❌ Error interno al confirmar el pago.", "error");
  }
});

// ✅ Función para mostrar mensajes en pantalla
function mostrarMensaje(texto, tipo = "info") {
  const msgEstado = document.getElementById("msgEstado");
  if (msgEstado) {
    msgEstado.textContent = texto;
    msgEstado.style.color = 
      tipo === "success" ? "limegreen" :
      tipo === "error" ? "tomato" :
      tipo === "warn" ? "orange" :
      "#666";
    msgEstado.classList.add("fade-in");

    setTimeout(() => {
      msgEstado.classList.remove("fade-in");
    }, 3000);
  }
}

// ✅ Limpiar carrito después de confirmar pago exitoso
function limpiarCarrito() {
  localStorage.removeItem("km_ez_cart");
  localStorage.removeItem("km_ez_last_order");
}
