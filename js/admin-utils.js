"use strict";

/**
 * 🔐 Verifica que exista una sesión válida de administrador
 * Redirige automáticamente si no es válida o no es admin
 */
export function verificarSesion() {
  try {
    const token = localStorage.getItem("admin_token");
    const rawUser = localStorage.getItem("admin_user");
    if (!token || token.length < 20 || !rawUser) throw new Error("Token o usuario inválido");

    const user = JSON.parse(rawUser);
    if (user.role !== "admin") throw new Error("Rol no autorizado");

    return token;
  } catch (error) {
    console.warn("❌ Acceso no autorizado o sesión inválida:", error.message);
    alert("⚠️ Acceso denegado. Debes ser administrador.");
    window.location.href = "/login.html";
    return null;
  }
}

/**
 * 🔚 Cerrar sesión completa
 */
export function cerrarSesion() {
  try {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_user");
    document.cookie = "refreshToken=; Max-Age=0; path=/; Secure; SameSite=Strict;";
    window.location.href = "/login.html";
  } catch (err) {
    console.error("❌ Error al cerrar sesión:", err);
    alert("⚠️ No se pudo cerrar sesión correctamente.");
  }
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
    alert(texto); // Fallback si el elemento no está en el DOM
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

/**
 * 👤 Obtener datos del usuario activo
 * @returns {object|null}
 */
export function getUsuarioActivo() {
  try {
    const user = JSON.parse(localStorage.getItem("admin_user"));
    return user || null;
  } catch {
    return null;
  }
}
