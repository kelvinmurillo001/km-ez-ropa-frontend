"use strict";

/**
 * 🔐 Verifica si el usuario está autenticado y es admin.
 * Si no lo está, redirige a login y detiene ejecución.
 * @returns {string} token de autenticación
 */
export function verificarSesion() {
  const token = localStorage.getItem("admin_token");
  const userRaw = localStorage.getItem("admin_user");

  let user = {};
  try {
    user = JSON.parse(userRaw);
  } catch (err) {
    console.warn("⚠️ Datos de sesión corruptos. Limpiando...");
    localStorage.clear();
  }

  if (!token || !user?.isAdmin) {
    alert("⚠️ Acceso restringido. Debes iniciar sesión como administrador.");
    localStorage.clear();
    window.location.href = "/login.html";
    throw new Error("🚫 Usuario no autenticado o sin permisos");
  }

  return token;
}

/**
 * 💬 Muestra un mensaje accesible flotante.
 * @param {string} texto - El texto a mostrar.
 * @param {"success"|"error"|"info"} tipo - Tipo visual (para CSS).
 */
export function mostrarMensaje(texto = "", tipo = "info") {
  const mensaje = document.getElementById("adminMensaje");

  if (!mensaje) {
    console.warn("⚠️ Elemento #adminMensaje no encontrado. Usando alert()...");
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
 * 🔙 Redirige al panel de administración principal.
 */
export function goBack() {
  window.location.href = "/panel.html";
}

/**
 * 🚪 Cierra la sesión y limpia almacenamiento.
 */
export function cerrarSesion() {
  localStorage.removeItem("admin_token");
  localStorage.removeItem("admin_user");
  window.location.href = "/login.html";
}

/**
 * 🧑‍💻 Obtiene los datos del usuario autenticado.
 * @returns {Object} objeto de usuario o {} si inválido.
 */
export function getUsuarioActivo() {
  try {
    const raw = localStorage.getItem("admin_user");
    return raw ? JSON.parse(raw) : {};
  } catch (err) {
    return {};
  }
}

// 🌐 Exponer logout globalmente (para botones HTML)
window.cerrarSesion = cerrarSesion;
