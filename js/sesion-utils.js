"use strict";

import { API_BASE } from "./config.js";

/**
 * 🔐 Obtiene información del usuario autenticado mediante cookie de sesión.
 * @returns {Promise<object|null>} Usuario o null si no hay sesión válida.
 */
export async function getUsuarioSesion() {
  try {
    const res = await fetch(`${API_BASE}/auth/me`, {
      credentials: "include",
    });

    const data = await res.json();
    if (res.ok && data?.user) {
      localStorage.setItem("user", JSON.stringify(data.user));
      return data.user;
    }

    return null;
  } catch (error) {
    console.error("❌ Error al verificar sesión del usuario:", error);
    return null;
  }
}

/**
 * 🔐 Igual que getUsuarioSesion pero redirige si no hay sesión.
 * @returns {Promise<object|null>}
 */
export async function getUsuarioSesionSeguro() {
  const user = await getUsuarioSesion();
  if (!user) {
    mostrarMensaje("🔒 Debes iniciar sesión para continuar.", "error");
    setTimeout(() => {
      window.location.href = "/login.html";
    }, 1000);
  }
  return user;
}

/**
 * 🚪 Cierra la sesión actual, limpia localStorage y redirige al login.
 */
export async function cerrarSesionCliente() {
  try {
    await fetch(`${API_BASE}/auth/logout`, {
      credentials: "include",
    });
  } catch (error) {
    console.warn("⚠️ Error al cerrar sesión (backend):", error);
  } finally {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    sessionStorage.clear();
    window.location.href = "/login.html";
  }
}

/**
 * 💬 Muestra un mensaje accesible en pantalla
 * @param {string} texto 
 * @param {"info" | "success" | "error" | "warn"} tipo 
 */
export function mostrarMensaje(texto = "", tipo = "info") {
  const box = document.getElementById("adminMensaje");
  if (!box) {
    alert(texto);
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
  }, 4000);
}
