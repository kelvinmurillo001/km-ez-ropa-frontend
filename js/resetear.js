"use strict";

// 🌐 API base
const API_BASE = "https://api.kmezropacatalogo.com";

// 📌 Elementos del DOM
const form = document.getElementById("resetForm");
const msgEstado = document.getElementById("msgEstado");
const btnSubmit = form?.querySelector("button[type='submit']");

if (form && msgEstado && btnSubmit) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = form.email.value.trim().toLowerCase();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return mostrarMensaje("⚠️ Ingresa un correo electrónico válido.", "warn");
    }

    mostrarMensaje("⏳ Enviando solicitud...", "info");
    btnSubmit.disabled = true;
    btnSubmit.textContent = "📤 Enviando...";

    try {
      const res = await fetch(`${API_BASE}/api/auth/reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "❌ Error inesperado al solicitar reseteo.");

      mostrarMensaje(data.message || "✅ Revisa tu correo para continuar.", "success");
      form.reset();
    } catch (err) {
      console.error("❌ Error al enviar reset:", err);
      mostrarMensaje(`❌ ${err.message}`, "error");
    } finally {
      btnSubmit.disabled = false;
      btnSubmit.textContent = "🔄 Resetear";
    }
  });
}

/**
 * 🔔 Mostrar mensaje visual y accesible
 */
function mostrarMensaje(texto, tipo = "info") {
  if (!msgEstado) return;

  msgEstado.textContent = texto;
  msgEstado.setAttribute("role", "alert");
  msgEstado.setAttribute("aria-live", "assertive");

  msgEstado.style.color = {
    success: "limegreen",
    error: "tomato",
    warn: "orange",
    info: "#888"
  }[tipo] || "#ccc";
}
