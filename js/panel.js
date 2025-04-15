"use strict";

import { verificarSesion, cerrarSesion, getUsuarioActivo } from "./admin-utils.js";

document.addEventListener("DOMContentLoaded", () => {
  const token = verificarSesion(); // 🔒 Redirige a login si no hay token válido

  // Obtener usuario activo (opcional si quieres mostrarlo en el DOM)
  const user = getUsuarioActivo();
  if (user?.nombre) {
    console.log(`👤 Administrador: ${user.nombre}`);
    // Puedes mostrarlo en pantalla si tienes un ID, ej:
    // document.getElementById("adminNombre").textContent = user.nombre;
  }

  // Botón cerrar sesión
  document.querySelector("button[onclick='cerrarSesion()']")
    ?.addEventListener("click", cerrarSesion);

  // Activar modo oscuro si está guardado
  if (localStorage.getItem("modoOscuro") === "true") {
    document.body.classList.add("modo-oscuro");
  }
});
