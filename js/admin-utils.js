// 📁 js/admin-utils.js
"use strict";

/**
 * 🔐 Verifica si el usuario está autenticado como administrador.
 * Redirige a login si no lo está.
 * @returns {string} token de autenticación
 */
export function verificarSesion() {
  const token = localStorage.getItem("admin_token");
  const userRaw = localStorage.getItem("admin_user");

  try {
    const user = JSON.parse(userRaw);
    if (!token || !user?.isAdmin) throw new Error();
    return token;
  } catch (err) {
    console.warn("⚠️ Sesión inválida o corrupta. Redirigiendo...");
    localStorage.clear();
    alert("⚠️ Acceso restringido. Inicia sesión como administrador.");
    window.location.href = "/login.html";
    throw new Error("🚫 Usuario no autenticado o sin permisos");
  }
}

/**
 * 💬 Muestra un mensaje accesible flotante.
 * @param {string} texto - El texto del mensaje.
 * @param {"success"|"error"|"info"|"warning"} tipo - Tipo visual.
 */
export function mostrarMensaje(texto = "", tipo = "info") {
  const mensaje = document.getElementById("adminMensaje");

  if (!mensaje) {
    console.warn("⚠️ #adminMensaje no encontrado. Usando alert...");
    alert(texto);
    return;
  }

  mensaje.textContent = texto;
  mensaje.className = `admin-message ${tipo}`;
  mensaje.setAttribute("role", "alert");
  mensaje.setAttribute("aria-live", "assertive");
  mensaje.classList.remove("oculto");

  clearTimeout(mensaje._timeout);
  mensaje._timeout = setTimeout(() => {
    mensaje.classList.add("oculto");
  }, 4000);
}

/**
 * 🔙 Redirige al panel de administración.
 */
export function goBack() {
  window.location.href = "/panel.html";
}

/**
 * 🚪 Cierra la sesión de administrador.
 */
export function cerrarSesion() {
  localStorage.removeItem("admin_token");
  localStorage.removeItem("admin_user");
  window.location.href = "/login.html";
}

/**
 * 👤 Devuelve los datos del usuario autenticado.
 * @returns {Object} Usuario autenticado o {} si no válido.
 */
export function getUsuarioActivo() {
  try {
    const raw = localStorage.getItem("admin_user");
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

// 🌐 Exponer logout en global (uso en HTML onclick)
window.cerrarSesion = cerrarSesion;
