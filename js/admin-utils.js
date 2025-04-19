"use strict";

/**
 * 🔐 Verifica si hay un token válido
 * Redirige a login si no está autenticado o no es admin
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
 * 💬 Mostrar mensaje flotante en el elemento con ID 'adminMensaje'
 * @param {string} texto - Texto del mensaje
 * @param {'success'|'error'|'info'} tipo - Tipo de mensaje
 */
export function mostrarMensaje(texto, tipo = "info") {
  const mensaje = document.getElementById("adminMensaje");

  if (!mensaje) {
    console.warn("⚠️ adminMensaje no encontrado. Usando alert como fallback.");
    alert(texto);
    return;
  }

  // Limpieza previa
  mensaje.className = `admin-message oculto ${tipo}`;
  mensaje.setAttribute("role", "status");
  mensaje.setAttribute("aria-live", "polite");
  mensaje.textContent = texto;
  mensaje.classList.remove("oculto");

  clearTimeout(mensaje._timeout);
  mensaje._timeout = setTimeout(() => {
    mensaje.classList.add("oculto");
  }, 4000);
}

/**
 * 🔙 Regresa al panel de administración
 */
export function goBack() {
  window.location.href = "/panel.html";
}

/**
 * 🚪 Cierra la sesión limpiando tokens y redirigiendo
 */
export function cerrarSesion() {
  localStorage.removeItem("admin_token");
  localStorage.removeItem("admin_user");
  window.location.href = "/login.html";
}

/**
 * 🙋‍♂️ Devuelve el usuario autenticado (o {} si falla)
 * @returns {Object}
 */
export function getUsuarioActivo() {
  try {
    return JSON.parse(localStorage.getItem("admin_user") || "{}");
  } catch {
    return {};
  }
}

// 🌍 Exponer cerrarSesion por si se invoca desde HTML
window.cerrarSesion = cerrarSesion;
