"use strict";

import { STORAGE_KEYS } from "./config.js";

/**
 * 🔐 Verifica que exista una sesión válida de administrador.
 * Redirige automáticamente si no es válida o no es admin.
 * Devuelve el token si todo está correcto.
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
 * 🔚 Cerrar sesión completa
 */
export function cerrarSesion() {
  try {
    localStorage.removeItem(STORAGE_KEYS.token);
    localStorage.removeItem(STORAGE_KEYS.user);
    sessionStorage.clear();

    // Elimina cualquier cookie de sesión (ej: refreshToken)
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
    alert(texto); // Fallback si no existe el DOM aún
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
    const raw = localStorage.getItem(STORAGE_KEYS.user);
    const user = JSON.parse(raw);
    if (typeof user === "object" && user && user.username) {
      return user;
    }
    return null;
  } catch {
    return null;
  }
}
