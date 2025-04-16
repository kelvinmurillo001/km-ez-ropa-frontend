"use strict";

// 📥 Importar utilidades de administración
import { verificarSesion, cerrarSesion, getUsuarioActivo } from "./admin-utils.js";

// ▶️ Al cargar el DOM
document.addEventListener("DOMContentLoaded", () => {
  // 🔒 Verificar sesión activa
  const token = verificarSesion(); // Redirige si no hay token

  // 👤 Mostrar nombre del administrador (opcional)
  const user = getUsuarioActivo();
  if (user?.nombre) {
    console.log(`👤 Administrador: ${user.nombre}`);
    // document.getElementById("adminNombre")?.textContent = user.nombre;
  }

  // 🌑 Aplicar modo oscuro si está activado
  if (localStorage.getItem("modoOscuro") === "true") {
    document.body.classList.add("modo-oscuro");
  }

  // 🚪 Cerrar sesión al hacer clic
  const cerrarBtn = document.querySelector("button[onclick='cerrarSesion()']");
  cerrarBtn?.addEventListener("click", cerrarSesion);
});
