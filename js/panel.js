"use strict";

import { verificarSesion, logout } from "./admin-utils.js";

// 🌐 Comprobación de sesión y modo oscuro persistente
document.addEventListener("DOMContentLoaded", () => {
  verificarSesion(); // Redirige si el token no es válido

  const btnModo = document.getElementById("modoToggle");
  const modoOscuroActivo = localStorage.getItem("modoOscuro") === "true";

  if (modoOscuroActivo) {
    document.body.classList.add("modo-oscuro");
    if (btnModo) btnModo.textContent = "☀️ Modo Claro";
  }

  // Alternar modo oscuro
  btnModo?.addEventListener("click", () => {
    const body = document.body;
    const esOscuro = body.classList.toggle("modo-oscuro");
    localStorage.setItem("modoOscuro", esOscuro);
    btnModo.textContent = esOscuro ? "☀️ Modo Claro" : "🌙 Modo Oscuro";
  });
});

// 🔓 Exponer logout globalmente (HTML onclick)
window.logout = logout;
