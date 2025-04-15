"use strict";

const API_LOGIN = "https://km-ez-ropa-backend.onrender.com/api/auth/login";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");
  const errorBox = document.getElementById("mensajeError");

  form?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email")?.value.trim();
    const password = document.getElementById("password")?.value.trim();

    if (!email || !password) {
      mostrarError("⚠️ Completa ambos campos.");
      return;
    }

    try {
      const res = await fetch(API_LOGIN, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.token) {
        mostrarError(data.message || "❌ Credenciales incorrectas");
        return;
      }

      sessionStorage.setItem("admin_token", data.token);
      window.location.href = "panel.html";
    } catch (err) {
      mostrarError("❌ Error de conexión. Intenta más tarde.");
      console.error("Login error:", err);
    }
  });

  function mostrarError(msg) {
    if (!errorBox) return;
    errorBox.textContent = msg;
    errorBox.classList.remove("oculto");
  }
});
