"use strict";

// ✅ Protección de acceso al panel
document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");

  if (!token || typeof token !== "string" || token.length < 10) {
    bloquearAcceso("⚠️ Token ausente o inválido. Inicia sesión.");
    return;
  }

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));

    if (!payload || payload.role !== "admin") {
      bloquearAcceso("⛔ Acceso denegado. Solo administradores.");
    }

    // ✅ Si pasó todos los chequeos, puedes continuar con la carga del panel
    console.log("✅ Acceso válido como administrador:", payload.username || payload.email);

  } catch (error) {
    console.error("❌ Error al decodificar token:", error);
    bloquearAcceso("⚠️ Token corrupto o malformado. Inicia sesión nuevamente.");
  }
});

// 🔁 Función reutilizable para redirigir en caso de fallo
function bloquearAcceso(mensaje) {
  alert(mensaje);
  localStorage.removeItem("token");
  window.location.href = "login.html";
}

// 🔒 Cerrar sesión (logout seguro)
function logout() {
  localStorage.removeItem("token");
  window.location.href = "login.html";
}
