"use strict";

import { STORAGE_KEYS } from "./config.js";

/**
 * 🔐 Verifica que exista una sesión válida de administrador.
 * Si la sesión no es válida o el usuario no es admin, redirige al login.
 * @returns {Promise<string>} - El token de sesión si es válido.
 */
export function verificarSesion() {
  return new Promise((resolve, reject) => {
    try {
      const token = localStorage.getItem(STORAGE_KEYS.token);
      const rawUser = localStorage.getItem(STORAGE_KEYS.user);

      if (!token || token.length < 20 || !rawUser) {
        throw new Error("Token o usuario inválido");
      }

      const user = JSON.parse(rawUser);
      if (!user || user.role !== "admin") {
        throw new Error("Rol no autorizado");
      }

      resolve(token);
    } catch (error) {
      console.warn("❌ Acceso no autorizado o sesión inválida:", error.message);
      alert("⚠️ Acceso denegado. Debes ser administrador.");
      window.location.href = "/login.html";
      reject(error);
    }
  });
}

/**
 * 🔚 Cierra completamente la sesión del usuario.
 * Limpia el almacenamiento local, la sesión y cookies.
 */
export function cerrarSesion() {
  try {
    localStorage.removeItem(STORAGE_KEYS.token);
    localStorage.removeItem(STORAGE_KEYS.user);
    sessionStorage.clear();

    // Elimina cookies relacionadas (como refreshToken si fue seteado por el backend)
    document.cookie = "refreshToken=; Max-Age=0; path=/; Secure; SameSite=Strict;";

    window.location.href = "/login.html";
  } catch (err) {
    console.error("❌ Error al cerrar sesión:", err);
    alert("⚠️ No se pudo cerrar sesión correctamente.");
  }
}

/**
 * 🔙 Regresa a la página anterior del historial.
 */
export function goBack() {
  window.history.back();
}

/**
 * 💬 Muestra un mensaje de sistema visible para el administrador.
 * @param {string} texto - Contenido del mensaje.
 * @param {"info" | "success" | "error"} tipo - Tipo de alerta.
 */
export function mostrarMensaje(texto, tipo = "info") {
  const box = document.getElementById("adminMensaje");

  if (!box) {
    alert(texto); // Fallback si no hay contenedor visible.
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
 * 👤 Obtiene los datos del usuario activo desde el localStorage.
 * @returns {object|null} - Objeto de usuario o null si no hay sesión válida.
 */
export function getUsuarioActivo() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.user);
    const user = JSON.parse(raw);
    if (user && typeof user === "object" && user.username) {
      return user;
    }
    return null;
  } catch {
    return null;
  }
}
