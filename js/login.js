"use strict";

import { API_BASE } from "./config.js";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("formLogin");
  const btnSubmit = form?.querySelector("button[type='submit']");
  const inputUser = form?.username;
  const inputPass = form?.password;

  if (!form || !btnSubmit || !inputUser || !inputPass) return;

  // 🌙 Activar modo oscuro si está guardado
  if (localStorage.getItem("modoOscuro") === "true") {
    document.body.classList.add("modo-oscuro");
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = inputUser.value.trim().toLowerCase();
    const password = inputPass.value.trim();

    if (!username || !password) {
      return mostrarMensaje("⚠️ Ingresa tu usuario y contraseña.", "error");
    }

    btnSubmit.disabled = true;
    btnSubmit.textContent = "🔄 Iniciando...";

    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.accessToken) {
        const msg =
          res.status === 401
            ? "🔐 Usuario o contraseña incorrectos."
            : data.message || "❌ Error inesperado.";
        return mostrarMensaje(msg, "error");
      }

      // ✅ Guardar en localStorage
      localStorage.setItem("admin_token", data.accessToken);
      localStorage.setItem(
        "admin_user",
        JSON.stringify({ ...data.user, isAdmin: true })
      );

      mostrarMensaje("✅ Acceso concedido. Redirigiendo...", "success");

      setTimeout(() => {
        if (document.readyState === "complete") {
          window.location.href = "/panel.html";
        } else {
          location.assign("/panel.html"); // fallback
        }
      }, 800);
    } catch (err) {
      console.error("❌ Error:", err);
      mostrarMensaje("❌ No se pudo conectar al servidor.", "error");
    } finally {
      btnSubmit.disabled = false;
      btnSubmit.textContent = "🔓 Ingresar";
    }
  });

  // Tecla Enter para inputs
  form.querySelectorAll("input").forEach((input) => {
    input.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        form.dispatchEvent(new Event("submit"));
      }
    });
  });
});

/**
 * ✅ Mostrar mensaje flotante
 */
function mostrarMensaje(texto, tipo = "info") {
  const box = document.getElementById("adminMensaje");
  if (!box) return alert(texto);

  box.textContent = texto;
  box.className = "";
  box.classList.add(tipo);
  box.classList.remove("oculto");

  clearTimeout(box._timeout);
  box._timeout = setTimeout(() => {
    box.classList.add("oculto");
  }, 4000);
}
