"use strict";
import { verificarSesion, logout } from "./admin-utils.js";

/**
 * ✅ Verificación de acceso al panel de administración
 * - Comprueba token y rol "admin"
 * - Redirige a login en caso de error o acceso no autorizado
 */
document.addEventListener("DOMContentLoaded", () => {
  const token = verificarSesion(); // Esto valida token + rol

  if (token) {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      console.log("✅ Acceso autorizado como administrador:", payload.username || payload.email);
    } catch (err) {
      console.error("❌ Error decodificando token:", err);
    }
  }
});

/**
 * 🔒 Logout manual (expuesto para botón)
 */
window.logout = logout;
