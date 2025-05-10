"use strict";

/**
 * 🔐 Verifica y obtiene el token de administrador desde localStorage
 * Redirige si no existe.
 * @returns {string|null}
 */
export function verificarSesion() {
  const token = localStorage.getItem("admin_token");

  if (!token || token.length < 20) {
    console.warn("⚠️ Token de sesión inválido o ausente");
    return null;
  }

  return token;
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
