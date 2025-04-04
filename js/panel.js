"use strict";

// ✅ Protección de acceso al panel
document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");

  if (!token || typeof token !== "string" || token.length < 10) {
    alert("⚠️ Acceso no autorizado. Por favor, inicia sesión.");
    window.location.href = "login.html";
  }
});

// 🔒 Cerrar sesión (logout seguro)
function logout() {
  localStorage.removeItem("token");
  window.location.href = "login.html";
}
