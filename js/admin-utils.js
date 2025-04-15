"use strict";

/**
 * 🔐 Verifica si hay un token válido
 * Redirige a login si no está autenticado
 */
export function verificarSesion() {
  const token = localStorage.getItem("admin_token");
  const user = JSON.parse(localStorage.getItem("admin_user") || "{}");

  if (!token || !user?.isAdmin) {
    alert("⚠️ Acceso denegado. Inicia sesión como administrador.");
    window.location.href = "login.html";
    throw new Error("Usuario no autenticado o no autorizado");
  }

  return token;
}

/**
 * 💬 Mostrar mensaje flotante
 */
export function mostrarMensaje(texto, tipo = "info") {
  const mensaje = document.getElementById("adminMensaje");
  if (!mensaje) return;

  mensaje.className = "admin-message " + (tipo === "success" ? "success" : "error");
  mensaje.textContent = texto;
  mensaje.classList.remove("oculto");

  setTimeout(() => {
    mensaje.classList.add("oculto");
  }, 5000);
}

/**
 * 🔙 Volver al panel
 */
export function goBack() {
  window.location.href = "panel.html";
}

/**
 * 🚪 Cerrar sesión (elimina token y redirige)
 */
export function cerrarSesion() {
  localStorage.removeItem("admin_token");
  localStorage.removeItem("admin_user");
  window.location.href = "login.html";
}

/**
 * 🙋‍♂️ Obtener info del usuario autenticado
 */
export function getUsuarioActivo() {
  return JSON.parse(localStorage.getItem("admin_user") || "{}");
}
