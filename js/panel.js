"use strict";

/**
 * ✅ Verificación de token al cargar el panel
 * - Impide acceso si el token no existe o es inválido
 * - Redirige a login si el rol no es "admin"
 */
document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");

  // ❌ Token ausente o inválido
  if (!token || typeof token !== "string" || token.length < 10) {
    return bloquearAcceso("⚠️ Token ausente o inválido. Inicia sesión.");
  }

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));

    // ❌ Rol incorrecto
    if (!payload || payload.role !== "admin") {
      return bloquearAcceso("⛔ Acceso denegado. Solo administradores.");
    }

    // ✅ Acceso autorizado
    console.log("✅ Acceso válido como administrador:", payload.username || payload.email);

  } catch (error) {
    console.error("❌ Error al decodificar token:", error);
    bloquearAcceso("⚠️ Token corrupto o malformado. Inicia sesión nuevamente.");
  }
});

/**
 * 🔁 Función para bloquear acceso no autorizado
 * - Elimina token y redirige a login
 */
function bloquearAcceso(mensaje) {
  alert(mensaje);
  localStorage.removeItem("token");
  window.location.href = "login.html";
}

/**
 * 🔒 Logout manual
 * - Limpia token y vuelve a login
 */
function logout() {
  localStorage.removeItem("token");
  window.location.href = "login.html";
}
