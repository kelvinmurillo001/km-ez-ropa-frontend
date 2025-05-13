"use strict";

import { STORAGE_KEYS } from "./config.js";

/**
 * 🔐 Verifica una sesión activa de administrador.
 * Si no es válida o el usuario no es admin, redirige al login.
 * @returns {Promise<string>} JWT válido.
 */
export function verificarSesion() {
  return new Promise((resolve, reject) => {
    try {
      const token = localStorage.getItem(STORAGE_KEYS.token);
      const rawUser = localStorage.getItem(STORAGE_KEYS.user);

      if (!token || token.length < 20 || !rawUser) {
        throw new Error("❌ Token o usuario ausente o inválido.");
      }

      const user = JSON.parse(rawUser);
      if (!user || typeof user !== "object" || user.role !== "admin") {
        throw new Error("⛔ Rol no autorizado. Solo administradores.");
      }

      resolve(token);
    } catch (error) {
      console.warn("🔐 Verificación fallida:", error.message);
      mostrarMensaje("⚠️ Sesión no válida. Redirigiendo...", "error");
      setTimeout(() => {
        window.location.href = "/login.html";
      }, 1200);
      reject(error);
    }
  });
}

/**
 * 🔚 Cierra la sesión actual limpiando datos locales y cookies.
 */
export function cerrarSesion() {
  try {
    localStorage.removeItem(STORAGE_KEYS.token);
    localStorage.removeItem(STORAGE_KEYS.user);
    sessionStorage.clear();

    // 🧹 Elimina posibles cookies del servidor
    document.cookie = "refreshToken=; Max-Age=0; path=/; Secure; SameSite=Strict;";

    window.location.href = "/login.html";
  } catch (err) {
    console.error("❌ Error cerrando sesión:", err);
    alert("⚠️ No se pudo cerrar sesión correctamente.");
  }
}

/**
 * 🔁 Vuelve a la página anterior del historial.
 */
export function goBack() {
  window.history.back();
}

/**
 * 💬 Muestra un mensaje visual accesible para el usuario.
 * @param {string} texto - Contenido textual.
 * @param {"info" | "success" | "error"} tipo - Estilo visual.
 */
export function mostrarMensaje(texto, tipo = "info") {
  const box = document.getElementById("adminMensaje");

  if (!box) {
    alert(texto); // fallback básico
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
 * 👤 Devuelve el objeto del usuario activo si está bien formado.
 * @returns {object|null}
 */
export function getUsuarioActivo() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.user);
    const user = JSON.parse(raw);
    return user && typeof user === "object" && user.username ? user : null;
  } catch (err) {
    console.warn("⚠️ Error al recuperar el usuario:", err);
    return null;
  }
}
