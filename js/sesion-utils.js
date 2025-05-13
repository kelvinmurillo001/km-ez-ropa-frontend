"use strict";

import { API_BASE } from "./config.js";

/**
 * 🔐 Obtiene información del usuario autenticado mediante cookie de sesión.
 * @returns {Promise<object|null>} Datos del usuario o null si no hay sesión válida.
 */
export async function getUsuarioSesion() {
  try {
    const res = await fetch(`${API_BASE}/auth/me`, {
      credentials: "include",
    });

    const data = await res.json();
    return res.ok && data?.user ? data.user : null;
  } catch (error) {
    console.error("❌ Error al verificar sesión del usuario:", error);
    return null;
  }
}

/**
 * 🚪 Cierra la sesión actual y redirige al login.
 */
export async function cerrarSesionCliente() {
  try {
    await fetch(`${API_BASE}/auth/logout`, {
      credentials: "include",
    });
  } catch (error) {
    console.warn("⚠️ Error al cerrar sesión (backend):", error);
  } finally {
    window.location.href = "/login.html";
  }
}

/**
 * 💬 Muestra un mensaje accesible y visible en pantalla.
 * @param {string} texto - Contenido del mensaje a mostrar.
 * @param {"info" | "success" | "error" | "warn"} tipo - Tipo visual del mensaje.
 */
export function mostrarMensaje(texto = "", tipo = "info") {
  const box = document.getElementById("adminMensaje");

  if (!box) {
    alert(texto); // Fallback si el contenedor no existe
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
