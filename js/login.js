"use strict";

import { API_BASE } from "./config.js";

// 🛡️ Simple sanitizador básico
const sanitize = (str) => str.replace(/[<>"'`;]/g, "").trim();

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("formLogin");
  const btnSubmit = form?.querySelector("button[type='submit']");
  const inputUser = form?.username;
  const inputPass = form?.password;
  const googleBtn = document.getElementById("googleLoginBtn");

  if (!form || !btnSubmit || !inputUser || !inputPass) return;

  // 🌙 Activar modo oscuro si está guardado
  if (localStorage.getItem("modoOscuro") === "true") {
    document.body.classList.add("modo-oscuro");
  }

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
        credentials: "include", // Si usas cookies para refresh
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.accessToken) {
        const msg =
          res.status === 401
            ? "🔐 Usuario o contraseña incorrectos."
            : data.message || "❌ Error inesperado.";
        mostrarMensaje(msg, "error");
        return;
      }

      // ⚠️ IMPORTANTE: Usa cookies HttpOnly para token si puedes
      localStorage.setItem("admin_token", data.accessToken);
      localStorage.setItem(
        "admin_user",
        JSON.stringify({ ...data.user, isAdmin: true })
      );

      mostrarMensaje("✅ Acceso concedido. Redirigiendo...", "success");
      setTimeout(() => {
        window.location.href = "/panel.html";
      }, 800);
    } catch (err) {
      console.error("❌ Error:", err);
      mostrarMensaje("❌ No se pudo conectar al servidor.", "error");
    } finally {
      btnSubmit.disabled = false;
      btnSubmit.textContent = "🔓 Ingresar";
    }
  });

  // ⌨️ Enter directo
  form.querySelectorAll("input").forEach((input) => {
    input.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        form.dispatchEvent(new Event("submit"));
      }
    });
  });

  // 🔐 Login con Google redirigido desde backend
  if (googleBtn) {
    googleBtn.addEventListener("click", (e) => {
      e.preventDefault();
      window.location.href = `${API_BASE}/auth/google`;
    });
  }
});

/**
 * ✅ Mostrar mensaje flotante accesible
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
