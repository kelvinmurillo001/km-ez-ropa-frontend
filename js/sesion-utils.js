"use strict";

import { API_BASE } from "./config.js";

/**
 * ✅ Obtener usuario autenticado usando cookie de sesión
 */
export async function getUsuarioSesion() {
  try {
    const res = await fetch(`${API_BASE}/auth/me`, {
      credentials: "include"
    });
    const data = await res.json();
    return res.ok ? data.user : null;
  } catch (err) {
    console.error("❌ Error al verificar sesión:", err);
    return null;
  }
}

/**
 * 🚪 Cerrar sesión limpia desde backend y frontend
 */
export async function cerrarSesionCliente() {
  try {
    await fetch(`${API_BASE}/auth/logout`, {
      credentials: "include"
    });
  } catch (err) {
    console.warn("⚠️ Error cerrando sesión en backend:", err);
  }

  window.location.href = "/login.html";
}

/**
 * 💬 Mostrar mensaje global accesible
 */
export function mostrarMensaje(texto = "", tipo = "info") {
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
  }, 4000);
}
