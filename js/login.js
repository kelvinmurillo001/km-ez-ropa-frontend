"use strict";

// ✅ Importar configuración
import { API_BASE } from "./config.js";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("formLogin");

  form?.addEventListener("submit", async (e) => {
    e.preventDefault();

    // 👇 CAMBIO aquí
    const username = form.username.value.trim();
    const password = form.password.value.trim();

    if (!username || !password) {
      mostrarError("⚠️ Ingresa tu usuario y contraseña.");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }) // 👈 CAMBIO aquí
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          mostrarError("🔐 Credenciales incorrectas.");
        } else {
          mostrarError(data.message || "❌ Error al iniciar sesión.");
        }
        return;
      }

      // ✅ Ocultar errores si todo va bien
      ocultarError();

      // ✅ Guardar token y redirigir
      localStorage.setItem("km_ez_token", data.token);
      localStorage.setItem("km_ez_user", JSON.stringify(data.usuario));
      window.location.href = "/panel.html";

    } catch (err) {
      console.error("❌ Error:", err);
      mostrarError("❌ No se pudo conectar al servidor.");
    }
  });

  // 🌙 Modo oscuro
  if (localStorage.getItem("modoOscuro") === "true") {
    document.body.classList.add("modo-oscuro");
  }
});

// ⚠️ Mostrar mensaje de error
function mostrarError(msg) {
  const div = document.getElementById("errorMensaje");
  if (div) {
    div.textContent = msg;
    div.style.display = "block";
  }
}

// ✅ Ocultar mensaje de error
function ocultarError() {
  const div = document.getElementById("errorMensaje");
  if (div) {
    div.textContent = "";
    div.style.display = "none";
  }
}
