"use strict";

// 🌐 API base
const API_BASE = "https://api.kmezropacatalogo.com";

// 📌 Elementos del DOM
const form = document.getElementById("resetForm");
const msgEstado = document.getElementById("msgEstado");

// 📤 Enviar solicitud de reseteo
form?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = form.email.value.trim().toLowerCase();

  // 📋 Validación básica de email
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    return mostrarMensaje("⚠️ Ingresa un correo electrónico válido.", "warn");
  }

  mostrarMensaje("⏳ Enviando solicitud...", "info");

  try {
    const res = await fetch(`${API_BASE}/api/auth/reset`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "❌ Ocurrió un error inesperado.");

    mostrarMensaje(data.message || "✅ Verifica tu correo para continuar.", "success");
    form.reset();
  } catch (err) {
    console.error("❌ Error:", err);
    mostrarMensaje(`❌ ${err.message}`, "error");
  }
});

// 🔔 Mostrar mensaje en pantalla
function mostrarMensaje(texto, tipo = "info") {
  msgEstado.textContent = texto;
  msgEstado.style.color = {
    success: "limegreen",
    error: "tomato",
    warn: "orange"
  }[tipo] || "#ccc";
}
