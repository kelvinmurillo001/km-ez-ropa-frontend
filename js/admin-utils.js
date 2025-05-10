"use strict";

/**
 * 🔐 Verifica que exista una sesión válida de administrador
 * Redirige automáticamente si no es válida o no es admin
 */
export function verificarSesion() {
  const token = localStorage.getItem("admin_token");
  const user = JSON.parse(localStorage.getItem("admin_user") || "{}");

  if (!token || token.length < 20 || user.role !== "admin") {
    console.warn("❌ Acceso no autorizado o sesión inválida");
    alert("⚠️ Acceso denegado. Debes ser administrador.");
    window.location.href = "/login.html";
    return null;
  }

  return token;
}

/**
 * 🔚 Cerrar sesión completa
 */
export function cerrarSesion() {
  localStorage.removeItem("admin_token");
  localStorage.removeItem("admin_user");
  document.cookie = "refreshToken=; Max-Age=0; path=/;";
  window.location.href = "/login.html";
}

/**
 * 🔙 Regresar a la página anterior
 */
export function goBack() {
  window.history.back();
}

/**
 * 💬 Muestra un mensaje accesible en el panel admin
 * @param {string} texto - Texto del mensaje
 * @param {"info" | "success" | "error"} tipo - Tipo de mensaje
 */
export function mostrarMensaje(texto, tipo = "info") {
  const box = document.getElementById("adminMensaje");
  if (!box) {
    alert(texto); // fallback si el elemento no existe
    return;
  }

  box.textContent = texto;
  box.setAttribute("role", "alert");
  box.setAttribute("aria-live", "assertive");
  box.className = `admin-message ${tipo}`;
  box.classList.remove("oculto");

  clearTimeout(box._timeout);
  box._timeout = setTimeout(() => {
    box.classList.add("oculto");
  }, 4500);
}
