"use strict";

import { API_BASE } from "./config.js";

/**
 * ✅ Obtiene información del usuario autenticado por cookie de sesión
 * @returns {Object|null} Usuario o null si no hay sesión
 */
export async function getUsuarioSesion() {
  try {
    const res = await fetch(`${API_BASE}/auth/me`, {
      credentials: "include"
    });
    const data = await res.json();
    return res.ok && data?.user ? data.user : null;
  } catch (err) {
    console.error("❌ Error al verificar sesión:", err);
    return null;
  }
}

/**
 * 🚪 Cierra sesión del usuario y redirige a login
 */
export async function cerrarSesionCliente() {
  try {
    await fetch(`${API_BASE}/auth/logout`, {
      credentials: "include"
    });
  } catch (err) {
    console.warn("⚠️ Error al cerrar sesión en backend:", err);
  } finally {
    window.location.href = "/login.html";
  }
}

/**
 * 💬 Muestra un mensaje global accesible para el usuario
 * @param {string} texto - Contenido del mensaje
 * @param {string} tipo - Tipo visual ('info', 'success', 'error', 'warn')
 */
export function mostrarMensaje(texto = "", tipo = "info") {
  const box = document.getElementById("adminMensaje");

  // Fallback visual si no existe el elemento
  if (!box) {
    alert(texto);
    return;
  }

  box.textContent = texto;
  box.setAttribute("role", "alert");
  box.setAttribute("aria-live", "assertive");
  box.className = `admin-message ${tipo}`;
  box.classList.remove("oculto");

  if (box._timeout) clearTimeout(box._timeout);
  box._timeout = setTimeout(() => {
    box.classList.add("oculto");
  }, 4000);
}
