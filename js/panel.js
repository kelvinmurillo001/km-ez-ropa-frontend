"use strict";

import { verificarSesion } from "./admin-utils.js";

// Validar sesión
verificarSesion();

/* 🔒 Cerrar sesión */
function cerrarSesion() {
  if (confirm("¿Deseas cerrar sesión?")) {
    sessionStorage.removeItem("admin_token");
    window.location.href = "login.html";
  }
}

// 🌐 Exponer
window.cerrarSesion = cerrarSesion;
