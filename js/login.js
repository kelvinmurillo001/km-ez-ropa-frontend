"use strict";

import { API_BASE, GOOGLE_LOGIN_URL, STORAGE_KEYS } from "./config.js";

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

  // 🌙 Modo oscuro persistente
  if (localStorage.getItem("modoOscuro") === "true") {
    document.body.classList.add("modo-oscuro");
  }

  if (!form || !btnSubmit || !inputUser || !inputPass) return;

  // ▶️ Manejar envío del formulario
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = sanitize(inputUser.value.trim().toLowerCase());
    const password = sanitize(inputPass.value.trim());

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
        body: JSON.stringify({ username, password })
      });

      const result = await res.json();

      if (!res.ok) {
        const msg =
          res.status === 400
            ? "⚠️ Datos inválidos enviados."
            : res.status === 401
            ? "🔐 Usuario o contraseña incorrectos."
            : res.status === 403
            ? "⛔ Acceso denegado. Solo administradores."
            : result.message || "❌ Error inesperado al iniciar sesión.";
        mostrarMensaje(msg, "error");
        return;
      }

      const token = result.accessToken || result.data?.accessToken;
      const user = result.user || result.data?.user;

      if (!token || !user) {
        mostrarMensaje("❌ No se recibió sesión válida del servidor.", "error");
        return;
      }

      // ✅ Guardar token y usuario
      localStorage.setItem(STORAGE_KEYS.token, token);
      localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user));

      mostrarMensaje("✅ Acceso concedido. Redirigiendo...", "success");

      setTimeout(() => {
        const destino = user.role === "admin" ? "/panel.html" : "/cliente.html";
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

  // ⌨️ Presionar Enter en inputs también envía el formulario
  form.querySelectorAll("input").forEach((input) => {
    input.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        form.dispatchEvent(new Event("submit"));
      }
    });
  });

  // 🔐 Botón de acceso con Google
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
