"use strict";
import { verificarSesion, logout } from "./admin-utils.js";

document.addEventListener("DOMContentLoaded", () => {
  const token = verificarSesion();

  const btn = document.getElementById("modoToggle");
  const isDark = localStorage.getItem("modoOscuro") === "true";

  if (isDark) {
    document.body.classList.add("modo-oscuro");
    btn.textContent = "☀️ Modo Claro";
  }

  btn?.addEventListener("click", () => {
    document.body.classList.toggle("modo-oscuro");
    const oscuro = document.body.classList.contains("modo-oscuro");
    localStorage.setItem("modoOscuro", oscuro);
    btn.textContent = oscuro ? "☀️ Modo Claro" : "🌙 Modo Oscuro";
  });
});

window.logout = logout;
