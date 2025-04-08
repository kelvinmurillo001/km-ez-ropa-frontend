"use strict";

/**
 * ✅ Verificación de acceso al panel de administración
 * - Comprueba token y rol "admin"
 * - Redirige a login en caso de error o acceso no autorizado
 */
document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");

  if (!esTokenValido(token)) {
    return bloquearAcceso("⚠️ Token inválido o inexistente. Inicia sesión.");
  }

  const payload = obtenerPayload(token);

  if (!payload || payload.role !== "admin") {
    return bloquearAcceso("⛔ Acceso denegado. Solo administradores.");
  }

  console.log("✅ Acceso autorizado como administrador:", payload.username || payload.email);
});

/**
 * 🔐 Verifica estructura mínima del token
 */
function esTokenValido(token) {
  return token && typeof token === "string" && token.split(".").length === 3;
}

/**
 * 🔍 Decodifica el payload del JWT
 */
function obtenerPayload(token) {
  try {
    const base64Payload = token.split('.')[1];
    return JSON.parse(atob(base64Payload));
  } catch (e) {
    console.error("❌ Error al decodificar el token:", e);
    return null;
  }
}

/**
 * 🔁 Bloquea el acceso y redirige a login
 */
function bloquearAcceso(mensaje) {
  alert(mensaje);
  localStorage.removeItem("token");
  location.href = "login.html";
}

/**
 * 🚪 Cierra sesión manualmente
 */
function logout() {
  localStorage.removeItem("token");
  location.href = "login.html";
}
