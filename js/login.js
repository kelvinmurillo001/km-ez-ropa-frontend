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

  // 🌙 Aplicar modo oscuro si está activado
  if (localStorage.getItem("modoOscuro") === "true") {
    document.body.classList.add("modo-oscuro");
  }

  if (!form || !btnSubmit || !inputUser || !inputPass) return;

  // 🧾 Enviar formulario
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
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok || !data?.accessToken) {
        const msg = res.status === 401
          ? "🔐 Usuario o contraseña incorrectos."
          : data.message || "❌ Error inesperado al iniciar sesión.";
        mostrarMensaje(msg, "error");
        return;
      }

      // ✅ Guardar token y usuario
      localStorage.setItem("admin_token", data.accessToken);
      localStorage.setItem("admin_user", JSON.stringify(data.user));

      mostrarMensaje("✅ Acceso concedido. Redirigiendo...", "success");

      // 🔁 Redirigir según rol
      setTimeout(() => {
        if (data.user?.role === "admin") {
          window.location.href = "/panel.html";
        } else {
          window.location.href = "/cliente.html";
        }
      }, 1000);
    } catch (err) {
      console.error("❌ Error de red:", err);
      mostrarMensaje("❌ No se pudo conectar al servidor.", "error");
    } finally {
      btnSubmit.disabled = false;
      btnSubmit.textContent = "🔓 Ingresar";
    }
  });

  // ⌨️ Soporte tecla Enter
  form.querySelectorAll("input").forEach((input) => {
    input.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        form.dispatchEvent(new Event("submit"));
      }
    });
  });

  // 🔐 Acceso con Google
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
