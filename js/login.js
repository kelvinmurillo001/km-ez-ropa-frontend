"use strict";

const API_BASE = "https://km-ez-ropa-backend.onrender.com/api";
const API_LOGIN = `${API_BASE}/login`;

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");
  const email = document.getElementById("email");
  const password = document.getElementById("password");
  const mensaje = document.getElementById("mensajeLogin");

  form?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const correo = email.value.trim();
    const clave = password.value.trim();

    if (!correo || !clave) {
      mostrarMensaje("⚠️ Ingresa correo y contraseña", "error");
      return;
    }

    try {
      const res = await fetch(API_LOGIN, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: correo, password: clave })
      });

      const data = await res.json();
      if (!res.ok) {
        const msg = data.message || "Credenciales incorrectas";
        mostrarMensaje(`❌ ${msg}`, "error");
        return;
      }

      // Guardar token y redirigir
      localStorage.setItem("adminToken", data.token);
      window.location.href = "/admin.html";
    } catch (err) {
      mostrarMensaje("❌ Error al conectar con el servidor", "error");
    }
  });

  function mostrarMensaje(texto, tipo = "error") {
    mensaje.textContent = texto;
    mensaje.className = tipo === "error" ? "error fade-in" : "success fade-in";
    mensaje.classList.remove("oculto");
  }
});
