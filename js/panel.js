"use strict";

// ✅ Importar configuración
import { API_BASE } from "./config.js";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("formLogin");

  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    ocultarError();

    const username = form.username.value.trim();
    const password = form.password.value.trim();
    const btnSubmit = form.querySelector("button[type='submit']");

    if (!username || !password) {
      mostrarError("⚠️ Ingresa tu usuario y contraseña.");
      return;
    }

    try {
      btnSubmit.disabled = true;
      btnSubmit.textContent = "🔐 Iniciando...";

      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.toLowerCase(), password })
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          mostrarError("🔐 Usuario o contraseña incorrectos.");
        } else {
          mostrarError(data.message || "❌ Error al iniciar sesión.");
        }
        return;
      }

      if (!data.token || !data.user) {
        mostrarError("❌ Respuesta inválida del servidor.");
        return;
      }

      // ✅ Guardar sesión
      localStorage.setItem("admin_token", data.token);
      localStorage.setItem("admin_user", JSON.stringify(data.user));

      // Redireccionar al panel
      window.location.href = "/panel.html";

    } catch (err) {
      console.error("❌ Error:", err);
      mostrarError("❌ No se pudo conectar al servidor.");
    } finally {
      btnSubmit.disabled = false;
      btnSubmit.textContent = "Iniciar sesión";
    }
  });

  // 🌙 Activar modo oscuro si está guardado
  if (localStorage.getItem("modoOscuro") === "true") {
    document.body.classList.add("modo-oscuro");
  }
});

// ⚠️ Mostrar mensaje de error accesible
function mostrarError(msg) {
  const div = document.getElementById("errorMensaje");
  if (div) {
    div.textContent = msg;
    div.style.display = "block";
    div.setAttribute("role", "alert");
    div.setAttribute("aria-live", "assertive");
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
