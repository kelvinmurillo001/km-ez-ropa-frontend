"use strict";

import { verificarSesion } from "./admin-utils.js";

// Validar token al cargar
verificarSesion();

/* 🚪 Cerrar sesión */
function cerrarSesion() {
  localStorage.removeItem("admin_token");
  alert("👋 Sesión cerrada");
  window.location.href = "login.html";
}

// Global para el botón
window.cerrarSesion = cerrarSesion;
