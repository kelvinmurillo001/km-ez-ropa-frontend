"use strict";

import { API_BASE } from "./config.js";

/* -------------------------------------------------------------------------- */
/* 🔐 Verificar sesión de administrador desde servidor                        */
/* -------------------------------------------------------------------------- */
export async function verificarSesion() {
  const token = localStorage.getItem("admin_token");
  const userRaw = localStorage.getItem("admin_user");

  if (!token || !userRaw) {
    return redirigirLogin("⚠️ No has iniciado sesión.");
  }

  try {
    const user = JSON.parse(userRaw);
    if (!user?.isAdmin) throw new Error("No es admin");

    const res = await fetch(`${API_BASE}/api/stats`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      throw new Error("Token inválido o expirado");
    }

    return true;
  } catch (err) {
    console.warn("⚠️ Sesión inválida:", err.message);
    return redirigirLogin("⚠️ Sesión expirada o inválida. Inicia sesión nuevamente.");
  }
}

function redirigirLogin(mensaje) {
  localStorage.clear();
  alert(mensaje);
  window.location.href = "/login.html";
  return false;
}

/* -------------------------------------------------------------------------- */
/* 💬 Mostrar mensaje global accesible                                        */
/* -------------------------------------------------------------------------- */
export function mostrarMensaje(texto = "", tipo = "info") {
  const mensaje = document.getElementById("adminMensaje");

  if (!mensaje) {
    alert(texto);
    return;
  }

  mensaje.textContent = texto;
  mensaje.setAttribute("role", "alert");
  mensaje.setAttribute("aria-live", "assertive");
  mensaje.className = `admin-message ${tipo}`;
  mensaje.classList.remove("oculto");

  if (mensaje._timeout) clearTimeout(mensaje._timeout);
  mensaje._timeout = setTimeout(() => {
    mensaje.classList.add("oculto");
  }, 4000);
}

/* -------------------------------------------------------------------------- */
/* 🔙 Redirigir al panel principal                                            */
/* -------------------------------------------------------------------------- */
export function goBack(confirmar = false) {
  if (confirmar && !confirm("¿Volver al panel principal?")) return;
  window.location.href = "/panel.html";
}

/* -------------------------------------------------------------------------- */
/* 🚪 Cerrar sesión segura                                                    */
/* -------------------------------------------------------------------------- */
export function cerrarSesion() {
  localStorage.removeItem("admin_token");
  localStorage.removeItem("admin_user");
  window.location.href = "/login.html";
}

/* -------------------------------------------------------------------------- */
/* 👤 Obtener usuario activo                                                  */
/* -------------------------------------------------------------------------- */
export function getUsuarioActivo() {
  try {
    const raw = localStorage.getItem("admin_user");
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/* 🌐 Logout global por seguridad */
window.cerrarSesion = cerrarSesion;
