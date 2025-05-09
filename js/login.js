"use strict";

import { API_BASE } from "./config.js";

// 🛡️ Sanitiza campos para prevenir inyecciones simples
const sanitize = (str = "") => str.replace(/[<>"'`;]/g, "").trim();

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("formLogin");
  const btnSubmit = form?.querySelector("button[type='submit']");
  const inputUser = form?.username;
  const inputPass = form?.password;
  const googleBtn = document.getElementById("googleLoginBtn");

  // 🌙 Activar modo oscuro si fue guardado
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
      return;
    }

    btnSubmit.disabled = true;
    btnSubmit.textContent = "🔄 Iniciando...";

    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.accessToken) {
        const msg = res.status === 401
          ? "🔐 Usuario o contraseña incorrectos."
          : data.message || "❌ Error inesperado al iniciar sesión.";
        mostrarMensaje(msg, "error");
        return;
      }

      // ⚠️ Almacenar token y usuario
      localStorage.setItem("admin_token", data.accessToken);
      localStorage.setItem(
        "admin_user",
        JSON.stringify({ ...data.user, isAdmin: true })
      );

      mostrarMensaje("✅ Acceso concedido. Redirigiendo...", "success");
      setTimeout(() => {
        window.location.href = "/panel.html";
      }, 900);
    } catch (err) {
      console.error("❌ Error de red:", err);
      mostrarMensaje("❌ No se pudo conectar al servidor.", "error");
    } finally {
      btnSubmit.disabled = false;
      btnSubmit.textContent = "🔓 Ingresar";
    }
  });

  // ⌨️ Enter para inputs
  form.querySelectorAll("input").forEach((input) => {
    input.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        form.dispatchEvent(new Event("submit"));
      }
    });
  });

  // 🔐 Login con Google
  googleBtn?.addEventListener("click", () => {
    window.location.href = `${API_BASE}/auth/google`;
  });
});

/**
 * ✅ Mostrar mensaje flotante accesible
 */
function mostrarMensaje(texto, tipo = "info") {
  const box = document.getElementById("adminMensaje");
  if (!box) return alert(texto);

  box.textContent = texto;
  box.className = "admin-message";
  box.classList.add(tipo);
  box.classList.remove("oculto");

  clearTimeout(box._timeout);
  box._timeout = setTimeout(() => {
    box.classList.add("oculto");
  }, 4000);
}
