"use strict";

import { STORAGE_KEYS } from "./config.js";

/**
 * 🔐 Verifica que exista una sesión válida de administrador.
 * Si no es válido o el usuario no es admin, redirige al login.
 * @returns {Promise<string>} Token JWT si es válido.
 */
export function verificarSesion() {
  return new Promise((resolve, reject) => {
    try {
      const token = localStorage.getItem(STORAGE_KEYS.token);
      const rawUser = localStorage.getItem(STORAGE_KEYS.user);

      if (!token || token.length < 20 || !rawUser) {
        throw new Error("Token o usuario ausente o inválido.");
      }

      const user = JSON.parse(rawUser);
      if (!user || typeof user !== "object" || user.role !== "admin") {
        throw new Error("Rol no autorizado o formato de usuario inválido.");
      }

      resolve(token);
    } catch (error) {
      console.warn("❌ Verificación fallida:", error.message);
      mostrarMensaje("⚠️ Acceso denegado. Redirigiendo...", "error");
      setTimeout(() => {
        window.location.href = "/login.html";
      }, 1200);
      reject(error);
    }
  });
}

/**
 * 🔚 Cierra completamente la sesión actual.
 */
export function cerrarSesion() {
  try {
    localStorage.removeItem(STORAGE_KEYS.token);
    localStorage.removeItem(STORAGE_KEYS.user);
    sessionStorage.clear();

    // ⚠️ Eliminar cookies del servidor si existen (ej: refreshToken)
    document.cookie = "refreshToken=; Max-Age=0; path=/; Secure; SameSite=Strict;";

    window.location.href = "/login.html";
  } catch (err) {
    console.error("❌ Error cerrando sesión:", err);
    alert("⚠️ No se pudo cerrar sesión correctamente.");
  }
}

/**
 * 🔙 Vuelve una página atrás en el historial.
 */
export function goBack() {
  window.history.back();
}

/**
 * 💬 Muestra un mensaje accesible en el panel administrativo.
 * @param {string} texto - Texto del mensaje.
 * @param {"info" | "success" | "error"} tipo - Tipo visual del mensaje.
 */
export function mostrarMensaje(texto, tipo = "info") {
  const box = document.getElementById("adminMensaje");

  if (!box) {
    alert(texto); // Fallback si el DOM no está listo
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
 * 👤 Obtiene el usuario activo del almacenamiento local.
 * @returns {object|null} Objeto de usuario o null.
 */
export function getUsuarioActivo() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.user);
    const user = JSON.parse(raw);
    return user && typeof user === "object" && user.username ? user : null;
  } catch (err) {
    console.warn("⚠️ Error parseando datos de usuario:", err);
    return null;
  }
}
