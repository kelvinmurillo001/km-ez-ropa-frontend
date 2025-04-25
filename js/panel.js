//panel.js
"use strict";

// ✅ Importar configuración
import { API_BASE } from "./config.js";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("formLogin");

  // 🌙 Modo oscuro persistente
  if (localStorage.getItem("modoOscuro") === "true") {
    document.body.classList.add("modo-oscuro");
  }

  if (!form) return;

  const btnSubmit = form.querySelector("button[type='submit']");
  const inputUser = form.username;
  const inputPass = form.password;

  // 📨 Escuchar envío del formulario
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    ocultarError();

    const username = inputUser.value.trim().toLowerCase();
    const password = inputPass.value.trim();

    if (!username || !password) {
      mostrarError("⚠️ Ingresa tu usuario y contraseña.");
      return;
    }

    try {
      btnSubmit.disabled = true;
      btnSubmit.textContent = "🔐 Iniciando sesión...";

      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();

      if (!res.ok) {
        const msg = res.status === 401
          ? "🔐 Usuario o contraseña incorrectos."
          : data.message || "❌ Error inesperado.";
        mostrarError(msg);
        return;
      }

      if (!data.token || !data.user) {
        mostrarError("❌ Respuesta inválida del servidor.");
        return;
      }

      // 🧠 Guardar sesión
      localStorage.setItem("admin_token", data.token);
      localStorage.setItem("admin_user", JSON.stringify(data.user));

      // 🔁 Redirigir
      window.location.href = "/panel.html";

    } catch (err) {
      console.error("❌ Error de conexión:", err);
      mostrarError("❌ No se pudo conectar al servidor.");
    } finally {
      btnSubmit.disabled = false;
      btnSubmit.textContent = "Iniciar sesión";
    }
  });

  // ⌨️ Enviar con Enter en cualquier input
  form.querySelectorAll("input").forEach(input => {
    input.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
      }
    });
  });
});

// ⚠️ Mostrar error accesible
function mostrarError(msg = "❌ Error desconocido") {
  const div = document.getElementById("errorMensaje");
  if (div) {
    div.textContent = msg;
    div.style.display = "block";
    div.setAttribute("role", "alert");
    div.setAttribute("aria-live", "assertive");
    div.focus?.();
  }
}

// ✅ Ocultar error
function ocultarError() {
  const div = document.getElementById("errorMensaje");
  if (div) {
    div.textContent = "";
    div.style.display = "none";
  }
}
