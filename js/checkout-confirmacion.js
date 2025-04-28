"use strict";

// ✅ Configuración base
import { API_BASE } from "./config.js";

// ▶️ Al cargar la página
document.addEventListener("DOMContentLoaded", async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get("token");

  if (!token) {
    console.error("❌ Token de PayPal no encontrado en la URL.");
    return;
  }

  try {
    // 📤 Capturar orden PayPal
    const res = await fetch(`${API_BASE}/api/paypal/capture-order`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: token })
    });
    const data = await res.json();

    if (res.ok && data.status === "COMPLETED") {
      console.log("✅ Pago capturado exitosamente:", data);
      mostrarMensaje("✅ Pago confirmado. ¡Gracias por tu compra!", "success");
    } else {
      console.error("❌ El pago no pudo ser completado:", data);
      mostrarMensaje("❌ Hubo un problema confirmando tu pago.", "error");
    }
  } catch (err) {
    console.error("❌ Error capturando la orden PayPal:", err);
    mostrarMensaje("❌ Error interno al capturar el pago.", "error");
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
  }
}
