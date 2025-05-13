"use strict";

import { STORAGE_KEYS } from "./config.js";

/**
 * 🔐 Verifica una sesión activa válida para **admin**.
 * Si no es válida o el usuario no es admin, redirige.
 * @returns {Promise<string>} JWT válido
 */
export function verificarSesionAdmin() {
  return new Promise((resolve, reject) => {
    try {
      const token = localStorage.getItem(STORAGE_KEYS.token);
      const rawUser = localStorage.getItem(STORAGE_KEYS.user);

      if (!token || token.length < 20 || !rawUser) {
        throw new Error("❌ Token o usuario ausente o inválido.");
      }

      const user = JSON.parse(rawUser);
      if (!user || user.role !== "admin") {
        throw new Error("⛔ Rol no autorizado. Solo administradores.");
      }

      resolve(token);
    } catch (error) {
      console.warn("🔐 Verificación fallida (admin):", error.message);
      mostrarMensaje("⚠️ Acceso restringido. Redirigiendo...", "error");
      setTimeout(() => (window.location.href = "/login.html"), 1200);
      reject(error);
    }
  });
}

/**
 * 👤 Verifica una sesión activa válida para **cliente**.
 * Redirige al login si no es válida.
 * @returns {Promise<string>} JWT válido
 */
export function verificarSesionCliente() {
  return new Promise((resolve, reject) => {
    try {
      const token = localStorage.getItem(STORAGE_KEYS.token);
      const rawUser = localStorage.getItem(STORAGE_KEYS.user);

      if (!token || token.length < 20 || !rawUser) {
        throw new Error("❌ Token o usuario ausente o inválido.");
      }

      const user = JSON.parse(rawUser);
      if (!user || user.role !== "client") {
        throw new Error("⛔ Rol no autorizado. Solo clientes.");
      }

      resolve(token);
    } catch (error) {
      console.warn("🔐 Verificación fallida (cliente):", error.message);
      mostrarMensaje("⚠️ Sesión no válida. Redirigiendo...", "error");
      setTimeout(() => (window.location.href = "/login.html"), 1200);
      reject(error);
    }
  });
}

/**
 * 🔚 Cierra la sesión actual limpiando localStorage y cookies.
 */
export function cerrarSesion() {
  try {
    localStorage.removeItem(STORAGE_KEYS.token);
    localStorage.removeItem(STORAGE_KEYS.user);
    sessionStorage.clear();

    // 🧹 Intenta eliminar cookies del servidor también
    document.cookie = "refreshToken=; Max-Age=0; path=/; Secure; SameSite=None;";
    document.cookie = "connect.sid=; Max-Age=0; path=/; Secure; SameSite=None;";

    window.location.href = "/login.html";
  } catch (err) {
    console.error("❌ Error cerrando sesión:", err);
    alert("⚠️ No se pudo cerrar sesión correctamente.");
  }
}

/**
 * 🔁 Vuelve atrás en el historial
 */
export function goBack() {
  window.history.back();
}

/**
 * 💬 Muestra un mensaje accesible en pantalla
 * @param {string} texto 
 * @param {"info" | "success" | "error"} tipo 
 */
export function mostrarMensaje(texto, tipo = "info") {
  const box = document.getElementById("adminMensaje");
  if (!box) return alert(texto);

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
 * 🔍 Devuelve el usuario activo del localStorage
 * @returns {object|null}
 */
export function getUsuarioActivo() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.user);
    const user = JSON.parse(raw);
    return user && typeof user === "object" ? user : null;
  } catch (err) {
    console.warn("⚠️ Error al recuperar el usuario:", err);
    return null;
  }
}
