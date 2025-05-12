"use strict";

import { API_BASE, GOOGLE_LOGIN_URL } from "./config.js";

/**
 * 🔐 Sanitiza entradas básicas para evitar XSS
 */
const sanitize = (str = "") =>
  str.replace(/[<>"'`;(){}[\]]/g, "").trim();

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("formLogin");
  const btnSubmit = form?.querySelector("button[type='submit']");
  const inputUser = form?.username;
  const inputPass = form?.password;
  const googleBtn = document.getElementById("googleLoginBtn");

  if (localStorage.getItem("modoOscuro") === "true") {
    document.body.classList.add("modo-oscuro");
  }

  if (!form || !btnSubmit || !inputUser || !inputPass) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = sanitize(inputUser.value.toLowerCase());
    const password = sanitize(inputPass.value);

    if (!username || !password) {
      mostrarMensaje("⚠️ Ingresa tu usuario y contraseña.", "error");
      inputUser.focus();
      return;
    }

    btnSubmit.disabled = true;
    btnSubmit.textContent = "🔄 Iniciando...";

    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ usuario: username, password })
      });

      const result = await res.json();

      if (!res.ok || !result?.success || !result?.user) {
        const msg =
          res.status === 400
            ? "⚠️ Datos inválidos enviados. (400)"
            : res.status === 401
            ? "🔐 Usuario o contraseña incorrectos."
            : result.message || "❌ Error inesperado al iniciar sesión.";
        mostrarMensaje(msg, "error");
        return;
      }

      // Guardar datos
      localStorage.setItem("admin_user", JSON.stringify(result.user));

      mostrarMensaje("✅ Acceso concedido. Redirigiendo...", "success");

      setTimeout(() => {
        const role = result.user?.role || "client";
        const destino = role === "admin" ? "/admin.html" : "/cliente.html";
        window.location.href = destino;
      }, 1200);
    } catch (error) {
      console.error("❌ Error de red:", error);
      mostrarMensaje("❌ No se pudo conectar al servidor.", "error");
    } finally {
      btnSubmit.disabled = false;
      btnSubmit.textContent = "🔓 Ingresar";
    }
  });

  form.querySelectorAll("input").forEach((input) => {
    input.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        form.dispatchEvent(new Event("submit"));
      }
    });
  });

  if (googleBtn) {
    googleBtn.addEventListener("click", () => {
      window.location.href = GOOGLE_LOGIN_URL;
    });
  }
});

/**
 * 💬 Mostrar mensaje accesible
 */
function mostrarMensaje(texto, tipo = "info") {
  const box = document.getElementById("adminMensaje");
  if (!box) return alert(texto);

  box.textContent = texto;
  box.setAttribute("role", "alert");
  box.setAttribute("aria-live", "assertive");
  box.className = `admin-message ${tipo}`;
  box.classList.remove("oculto");

  clearTimeout(box._timeout);
  box._timeout = setTimeout(() => {
    box.classList.add("oculto");
  }, 4000);
}
