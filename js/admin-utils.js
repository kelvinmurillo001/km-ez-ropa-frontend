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
 * 💬 Muestra un mensaje visual accesible en pantalla.
 * @param {string} texto - El contenido del mensaje.
 * @param {"success"|"error"|"info"|"warning"} tipo - Tipo visual del mensaje.
 */
export function mostrarMensaje(texto = "", tipo = "info") {
  const mensaje = document.getElementById("adminMensaje");

  if (!mensaje) {
    console.warn("⚠️ #adminMensaje no encontrado. Usando alert...");
    alert(texto);
    return;
  }

  // Reiniciar clases
  mensaje.className = `mensaje-global ${tipo}`;
  mensaje.textContent = texto;
  mensaje.setAttribute("role", "alert");
  mensaje.setAttribute("aria-live", "assertive");

  // Mostrar con animación
  mensaje.classList.add("show");

  clearTimeout(mensaje._timeout);
  mensaje._timeout = setTimeout(() => {
    mensaje.classList.remove("show");
  }, 4000);
}

/**
 * 🔙 Redirige al panel principal de administrador.
 */
export function goBack() {
  window.location.href = "/panel.html";
}

/**
 * 🚪 Cierra sesión limpiando localStorage y redirigiendo.
 */
export function cerrarSesion() {
  localStorage.removeItem("admin_token");
  localStorage.removeItem("admin_user");
  window.location.href = "/login.html";
}

/**
 * 👤 Obtiene el usuario actualmente autenticado.
 * @returns {Object} Usuario o {} si no hay válido.
 */
export function getUsuarioActivo() {
  try {
    const raw = localStorage.getItem("admin_user");
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

// 🌐 Exponer logout global (uso en onclick del HTML)
window.cerrarSesion = cerrarSesion;
