"use strict";

/** @const {string} */
const ADMIN_ROLE = "admin";

/**
 * 🔐 Verifica si el token de sesión pertenece a un administrador.
 * Redirige al login si no es válido.
 * @returns {string|null}
 */
export function verificarSesion() {
  const token = localStorage.getItem("token");

  if (!esTokenValido(token)) {
    redirigirLogin("⚠️ No autorizado. Inicia sesión.");
    return null;
  }

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));

    if (!payload || payload.role !== ADMIN_ROLE) {
      redirigirLogin("⛔ Acceso denegado. Solo administradores.");
      return null;
    }

    return token;
  } catch (err) {
    console.error("❌ Token inválido:", err);
    redirigirLogin("⚠️ Sesión corrupta. Inicia nuevamente.");
    return null;
  }
}

/**
 * ✅ Verifica estructura mínima del token JWT
 * @param {string} token 
 * @returns {boolean}
 */
export function esTokenValido(token) {
  return typeof token === "string" && token.split(".").length === 3;
}

/**
 * 💬 Muestra un mensaje visual temporal en el elemento indicado.
 * @param {HTMLElement} elElemento 
 * @param {string} mensaje 
 * @param {"success" | "error" | "warning" | "info"} tipo 
 * @param {number} duracionMS 
 */
export function mostrarMensaje(elElemento, mensaje, tipo = "info", duracionMS = 4000) {
  const colores = {
    success: { bg: "#e8f5e9", color: "#2e7d32" },
    error:   { bg: "#ffebee", color: "#b71c1c" },
    warning: { bg: "#fff8e1", color: "#f57c00" },
    info:    { bg: "#e3f2fd", color: "#0277bd" }
  };

  const { bg, color } = colores[tipo] || colores.info;

  elElemento.textContent = mensaje;
  elElemento.classList.remove("oculto");
  elElemento.style.backgroundColor = bg;
  elElemento.style.color = color;

  // Accesibilidad + Scroll a la vista
  elElemento.setAttribute("role", "alert");
  elElemento.setAttribute("aria-live", "assertive");
  elElemento.tabIndex = -1;

  if (typeof elElemento.scrollIntoView === "function") {
    elElemento.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  elElemento.focus?.();

  setTimeout(() => {
    elElemento.classList.add("oculto");
  }, duracionMS);
}

/**
 * 📅 Verifica si la fecha actual está dentro del rango dado.
 * @param {string} start - Fecha de inicio en formato YYYY-MM-DD
 * @param {string} end - Fecha de fin en formato YYYY-MM-DD
 * @returns {boolean}
 */
export function isDateInRange(start, end) {
  const hoy = new Date().toISOString().split("T")[0];
  return (!start || start <= hoy) && (!end || end >= hoy);
}

/**
 * 🔐 Cierra sesión eliminando token y redirige al login.
 */
export function logout() {
  localStorage.removeItem("token");
  window.location.href = "login.html";
}

/**
 * 🔙 Redirige al panel principal del administrador.
 */
export function goBack() {
  window.location.href = "panel.html";
}

/**
 * 🚪 Redirige al login con mensaje emergente.
 * @param {string} mensaje 
 */
export function redirigirLogin(mensaje = "🔐 Debes iniciar sesión.") {
  alert(mensaje);
  localStorage.removeItem("token");
  window.location.href = "login.html";
}
