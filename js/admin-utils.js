"use strict";

/**
 * 🔐 Verificar token de sesión
 * - Redirige al login si no hay token o si es inválido
 * - Retorna el token si es válido
 */
export function verificarSesion() {
  const token = localStorage.getItem("token");

  if (!token || typeof token !== "string" || token.length < 10) {
    alert("⚠️ No autorizado. Inicia sesión.");
    window.location.href = "login.html";
    return null;
  }

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    if (!payload || payload.role !== "admin") {
      alert("⛔ Acceso denegado. Solo administradores.");
      localStorage.removeItem("token");
      window.location.href = "login.html";
      return null;
    }

    return token;
  } catch (err) {
    console.error("❌ Token malformado:", err);
    alert("⚠️ Sesión inválida. Vuelve a iniciar sesión.");
    localStorage.removeItem("token");
    window.location.href = "login.html";
    return null;
  }
}

/**
 * 💬 Mostrar mensaje de estado (éxito, error, advertencia, info)
 * @param {HTMLElement} elElemento DOM donde se muestra el mensaje
 * @param {string} mensaje Texto del mensaje
 * @param {string} tipo success | error | warning | info
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

  setTimeout(() => elElemento.classList.add("oculto"), 3000);
}

/**
 * 📅 Verifica si la fecha actual está dentro del rango de promoción
 * @param {string} start Fecha inicio (YYYY-MM-DD)
 * @param {string} end Fecha fin (YYYY-MM-DD)
 * @returns {boolean}
 */
export function isDateInRange(start, end) {
  const today = new Date().toISOString().split("T")[0];
  return (!start || start <= today) && (!end || end >= today);
}

/**
 * 🔐 Cerrar sesión
 */
export function logout() {
  localStorage.removeItem("token");
  window.location.href = "login.html";
}

/**
 * 🔙 Volver al panel principal
 */
export function goBack() {
  window.location.href = "panel.html";
}
