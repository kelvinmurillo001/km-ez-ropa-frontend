"use strict";

/* 🔐 Verifica si hay un token válido */
export function verificarSesion() {
  const token = localStorage.getItem("admin_token");

  if (!token) {
    alert("⚠️ Debes iniciar sesión primero.");
    window.location.href = "login.html";
    throw new Error("No autenticado");
  }

  return token;
}

/* 💬 Mostrar mensaje */
export function mostrarMensaje(texto, tipo = "info") {
  const mensaje = document.getElementById("adminMensaje");

  if (!mensaje) return;

  mensaje.className = "admin-message " + (tipo === "success" ? "success" : "error");
  mensaje.textContent = texto;
  mensaje.classList.remove("oculto");

  // Ocultar luego de 5s
  setTimeout(() => {
    mensaje.classList.add("oculto");
  }, 5000);
}

/* 🔙 Volver al panel */
export function goBack() {
  window.location.href = "panel.html";
}
