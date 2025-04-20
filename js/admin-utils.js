"use strict";

/**
 * 🔐 Verifica si el token y el usuario son válidos.
 * Redirige a login si no está autenticado o no es administrador.
 * @returns {string} token
 */
export function verificarSesion() {
  const token = localStorage.getItem("admin_token");
  const userRaw = localStorage.getItem("admin_user");
  let user = {};

  try {
    user = JSON.parse(userRaw);
  } catch (e) {
    console.warn("⚠️ admin_user malformado, limpiando localStorage...");
    localStorage.clear();
  }

  if (!token || !user?.isAdmin) {
    alert("⚠️ Acceso denegado. Inicia sesión como administrador.");
    localStorage.clear();
    window.location.href = "/login.html";
    throw new Error("Usuario no autenticado o no autorizado");
  }

  return token;
}

/**
 * 💬 Muestra un mensaje flotante con estilos y accesibilidad.
 * @param {string} texto - Contenido del mensaje.
 * @param {"success"|"error"|"info"} tipo - Tipo visual.
 */
export function mostrarMensaje(texto, tipo = "info") {
  const mensaje = document.getElementById("adminMensaje");

  if (!mensaje) {
    console.warn("⚠️ adminMensaje no encontrado. Usando alert como fallback.");
    alert(texto);
    return;
  }

  mensaje.className = `admin-message ${tipo}`;
  mensaje.setAttribute("role", "alert");
  mensaje.setAttribute("aria-live", "assertive");
  mensaje.textContent = texto;

  mensaje.classList.remove("oculto");

  clearTimeout(mensaje._timeout);
  mensaje._timeout = setTimeout(() => {
    mensaje.classList.add("oculto");
  }, 4000);
}

/**
 * 🔙 Regresa al panel principal de administración.
 */
export function goBack() {
  window.location.href = "/panel.html";
}

/**
 * 🚪 Cierra sesión, limpia localStorage y redirige.
 */
export function cerrarSesion() {
  localStorage.removeItem("admin_token");
  localStorage.removeItem("admin_user");
  window.location.href = "/login.html";
}

/**
 * 🙋‍♂️ Devuelve el usuario autenticado o un objeto vacío.
 * @returns {Object}
 */
export function getUsuarioActivo() {
  try {
    return JSON.parse(localStorage.getItem("admin_user") || "{}");
  } catch {
    return {};
  }
}

// 🌍 Exponer cerrarSesion globalmente
window.cerrarSesion = cerrarSesion;
