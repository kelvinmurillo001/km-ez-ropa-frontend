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

    // Validación básica
    if (!username || !password) {
      return mostrarError("⚠️ Ingresa tu usuario y contraseña.");
    }

    btnSubmit.disabled = true;
    btnSubmit.textContent = "🔐 Iniciando...";

    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.toLowerCase(), password })
      });

      const data = await res.json();

      if (!res.ok) {
        const errorMsg = res.status === 401
          ? "🔐 Usuario o contraseña incorrectos."
          : data.message || "❌ Error al iniciar sesión.";
        return mostrarError(errorMsg);
      }

      // Validación de respuesta
      if (!data?.token || !data?.user) {
        throw new Error("❌ Respuesta del servidor inválida.");
      }

      // Guardar sesión en localStorage (⚠️ futuro: usar cookies httpOnly en backend)
      const userWithFlag = { ...data.user, isAdmin: true };
      localStorage.setItem("admin_token", data.token);
      localStorage.setItem("admin_user", JSON.stringify(userWithFlag));

      // Redireccionar al panel
      window.location.href = "/panel.html";

    } catch (err) {
      console.error("❌ Error al iniciar sesión:", err);
      mostrarError("❌ No se pudo conectar al servidor.");
    } finally {
      btnSubmit.disabled = false;
      btnSubmit.textContent = "Iniciar sesión";
    }
  });

  // 🌙 Activar modo oscuro si ya estaba activo
  if (localStorage.getItem("modoOscuro") === "true") {
    document.body.classList.add("modo-oscuro");
  }
});

/**
 * ⚠️ Mostrar mensaje de error
 */
function mostrarError(msg = "⚠️ Error desconocido") {
  const div = document.getElementById("errorMensaje");
  if (div) {
    div.textContent = msg;
    div.style.display = "block";
    div.setAttribute("role", "alert");
    div.setAttribute("aria-live", "assertive");
  }
}

/**
 * ✅ Ocultar mensaje de error
 */
function ocultarError() {
  const div = document.getElementById("errorMensaje");
  if (div) {
    div.textContent = "";
    div.style.display = "none";
  }
}
