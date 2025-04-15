"use strict";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("formLogin");
  const email = document.getElementById("email");
  const password = document.getElementById("password");
  const mensaje = document.getElementById("loginMensaje");

  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const emailVal = email.value.trim();
    const passVal = password.value.trim();

    if (!emailVal || !passVal) {
      mostrarMensaje("⚠️ Por favor, completa todos los campos.", "error");
      return;
    }

    try {
      const res = await fetch("https://km-ez-ropa-backend.onrender.com/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailVal, password: passVal })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Error desconocido");
      }

      localStorage.setItem("admin_token", data.token);
      mostrarMensaje("✅ Acceso correcto. Redirigiendo...", "success");

      setTimeout(() => {
        window.location.href = "panel.html";
      }, 1500);
    } catch (error) {
      console.error("❌ Error de login:", error);
      mostrarMensaje(`❌ ${error.message}`, "error");
    }
  });
});

/* 💬 Mostrar mensaje de login */
function mostrarMensaje(texto, tipo = "info") {
  const mensaje = document.getElementById("loginMensaje");
  if (!mensaje) return;

  mensaje.className = tipo === "success" ? "login-message success" : "login-message error";
  mensaje.textContent = texto;
  mensaje.classList.remove("oculto");

  setTimeout(() => mensaje.classList.add("oculto"), 5000);
}
