"use strict";

import { API_BASE } from "./config.js";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("formLogin");
  const btnSubmit = form?.querySelector("button[type='submit']");
  const inputUser = form?.username;
  const inputPass = form?.password;
  const errorBox = document.getElementById("errorMensaje");

  if (!form || !btnSubmit || !inputUser || !inputPass) return;

  // 🌙 Aplicar modo oscuro si está activado
  if (localStorage.getItem("modoOscuro") === "true") {
    document.body.classList.add("modo-oscuro");
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    ocultarError();

    const username = inputUser.value.trim().toLowerCase();
    const password = inputPass.value.trim();

    if (!username || !password) {
      return mostrarError("⚠️ Ingresa tu usuario y contraseña.");
    }

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
        const msg = res.status === 401
          ? "🔐 Usuario o contraseña incorrectos."
          : data.message || "❌ Error inesperado.";
        return mostrarError(msg);
      }

      if (!data.token || !data.user) {
        return mostrarError("❌ Respuesta del servidor inválida.");
      }

      // Guardar datos en localStorage con bandera admin
      localStorage.setItem("admin_token", data.token);
      localStorage.setItem("admin_user", JSON.stringify({ ...data.user, isAdmin: true }));

      // Redirigir
      window.location.href = "/panel.html";

    } catch (err) {
      console.error("❌ Error:", err);
      mostrarError("❌ No se pudo conectar al servidor.");
    } finally {
      btnSubmit.disabled = false;
      btnSubmit.textContent = "Iniciar sesión";
    }
  });

  // Permitir Enter desde cualquier input
  form.querySelectorAll("input").forEach(input => {
    input.addEventListener("keypress", (e) => {
      if (e.key === "Enter") form.dispatchEvent(new Event("submit"));
    });
  });
});

/**
 * Mostrar mensaje de error accesible
 */
function mostrarError(msg = "⚠️ Ha ocurrido un error") {
  const box = document.getElementById("errorMensaje");
  if (box) {
    box.textContent = msg;
    box.style.display = "block";
    box.setAttribute("role", "alert");
    box.setAttribute("aria-live", "assertive");
    box.focus?.();
  } else {
    alert(msg); // fallback
  }
}

/**
 * Ocultar el mensaje de error
 */
function ocultarError() {
  const box = document.getElementById("errorMensaje");
  if (box) {
    box.textContent = "";
    box.style.display = "none";
  }
}
