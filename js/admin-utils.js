"use strict";

/**
 * 🔐 Verifica si hay un token válido
 * Redirige a login si no está autenticado o no es admin
 */
export function verificarSesion() {
  const token = localStorage.getItem("admin_token");
  const user = JSON.parse(localStorage.getItem("admin_user") || "{}");

  if (!token || !user?.isAdmin) {
    alert("⚠️ Acceso denegado. Inicia sesión como administrador.");
    window.location.href = "/login.html";
    throw new Error("Usuario no autenticado o no autorizado");
  }

  return token;
}

/**
 * 💬 Mostrar mensaje flotante en el elemento con ID 'adminMensaje'
 * @param {string} texto - Texto del mensaje
 * @param {'success'|'error'|'info'} tipo - Tipo de mensaje (default: 'info')
 */
export function mostrarMensaje(texto, tipo = "info") {
  const mensaje = document.getElementById("adminMensaje");
  if (!mensaje) return;

  mensaje.className = `admin-message ${tipo}`;
  mensaje.textContent = texto;
  mensaje.classList.remove("oculto");

  setTimeout(() => {
    mensaje.classList.add("oculto");
  }, 4000);
}

/**
 * 🔙 Regresar al panel de administración
 */
export function goBack() {
  window.location.href = "/panel.html";
}

/**
 * 🚪 Cierra la sesión eliminando el token y redirigiendo a login
 */
export function cerrarSesion() {
  localStorage.removeItem("admin_token");
  localStorage.removeItem("admin_user");
  window.location.href = "/login.html";
}

/**
 * 🙋‍♂️ Retorna la información del usuario autenticado
 * @returns {Object} usuario
 */
export function getUsuarioActivo() {
  return JSON.parse(localStorage.getItem("admin_user") || "{}");
}
