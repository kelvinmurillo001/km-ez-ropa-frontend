"use strict";

import { API_BASE } from "./config.js";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("formLogin");
  const btnSubmit = form?.querySelector("button[type='submit']");

  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    ocultarError();

    const username = form.username.value.trim();
    const password = form.password.value.trim();

    if (!username || !password) {
      mostrarError("⚠️ Ingresa tu usuario y contraseña.");
      return;
    }

    // Bloquear botón
    btnSubmit.disabled = true;
    btnSubmit.textContent = "🔐 Iniciando...";

    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
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

      if (!data?.token || !data?.user) {
        throw new Error("❌ Respuesta del servidor inválida");
      }

      const userWithAdminFlag = { ...data.user, isAdmin: true };
      localStorage.setItem("admin_token", data.token);
      localStorage.setItem("admin_user", JSON.stringify(userWithAdminFlag));

      window.location.href = "/panel.html";

    } catch (err) {
      console.error("❌ Error:", err);
      mostrarError("❌ No se pudo conectar al servidor.");
    } finally {
      btnSubmit.disabled = false;
      btnSubmit.textContent = "Iniciar sesión";
    }
  });

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
