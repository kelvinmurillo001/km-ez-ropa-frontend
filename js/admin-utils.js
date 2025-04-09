"use strict";

/**
 * 🔐 Verificar token de sesión y rol admin
 * - Redirige a login si el token no existe o no es válido
 * - Solo permite acceso a usuarios con rol "admin"
 * @returns {string|null} token válido o null si no autorizado
 */
export function verificarSesion() {
  const token = localStorage.getItem("token");

  if (!esTokenValido(token)) {
    alert("⚠️ No autorizado. Inicia sesión.");
    window.location.href = "login.html";
    return null;
  }

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    if (payload?.role !== "admin") {
      alert("⛔ Acceso denegado. Solo administradores.");
      localStorage.removeItem("token");
      window.location.href = "login.html";
      return null;
    }

    return token;
  } catch (err) {
    console.error("❌ Token inválido:", err);
    alert("⚠️ Token corrupto. Inicia sesión nuevamente.");
    localStorage.removeItem("token");
    window.location.href = "login.html";
    return null;
  }
}

/**
 * 🔍 Valida estructura básica del JWT
 * @param {string} token 
 * @returns {boolean}
 */
export function esTokenValido(token) {
  return token && typeof token === "string" && token.split(".").length === 3;
}

/**
 * 💬 Mostrar mensaje informativo temporal
 * @param {HTMLElement} elElemento Elemento HTML donde mostrar el mensaje
 * @param {string} mensaje Texto del mensaje
 * @param {string} tipo Tipo: success | error | warning | info
 */
export function mostrarMensaje(elElemento, mensaje, tipo = "info") {
  const colores = {
    success: { bg: "#e8f5e9", color: "#2e7d32" },
    error: { bg: "#ffebee", color: "#b71c1c" },
    warning: { bg: "#fff8e1", color: "#f57c00" },
    info: { bg: "#e3f2fd", color: "#0277bd" }
  };

  const { bg, color } = colores[tipo] || colores.info;

  elElemento.textContent = mensaje;
  elElemento.classList.remove("oculto");
  elElemento.style.backgroundColor = bg;
  elElemento.style.color = color;

  setTimeout(() => elElemento.classList.add("oculto"), 4000);
}

/**
 * 📅 Verifica si hoy está dentro del rango de una promoción
 * @param {string} start Fecha inicio (YYYY-MM-DD)
 * @param {string} end Fecha fin (YYYY-MM-DD)
 * @returns {boolean}
 */
export function isDateInRange(start, end) {
  const today = new Date().toISOString().split("T")[0];
  return (!start || start <= today) && (!end || end >= today);
}

/**
 * 🔐 Cierra sesión y redirige
 */
export function logout() {
  localStorage.removeItem("token");
  window.location.href = "login.html";
}

/**
 * 🔙 Navega al panel principal
 */
export function goBack() {
  window.location.href = "panel.html";
}
