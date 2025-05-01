"use strict";

/* -------------------------------------------------------------------------- */
/* 🔐 Verificar sesión de administrador                                        */
/* -------------------------------------------------------------------------- */
export function verificarSesion() {
  const token = localStorage.getItem("admin_token");
  const userRaw = localStorage.getItem("admin_user");

  try {
    const user = JSON.parse(userRaw);
    if (!token || typeof user !== "object" || !user?.isAdmin) throw new Error();
    return token;
  } catch (err) {
    console.warn("⚠️ Sesión inválida. Redirigiendo a login...");
    localStorage.clear();
    alert("⚠️ Acceso restringido. Inicia sesión como administrador.");
    window.location.href = "/login.html";
    throw new Error("🚫 Usuario no autenticado o sin permisos");
  }
}

/* -------------------------------------------------------------------------- */
/* 💬 Mostrar mensaje global accesible                                         */
/* -------------------------------------------------------------------------- */
export function mostrarMensaje(texto = "", tipo = "info") {
  const mensaje = document.getElementById("adminMensaje");

  if (!mensaje) {
    console.warn("⚠️ No se encontró #adminMensaje. Usando alert como fallback...");
    alert(texto);
    return;
  }

  mensaje.textContent = texto;
  mensaje.setAttribute("role", "alert");
  mensaje.setAttribute("aria-live", "assertive");
  mensaje.className = `mensaje-global ${tipo} show`;

  // Limpiar timeout anterior si existe
  if (mensaje._timeout) clearTimeout(mensaje._timeout);

  // Ocultar después de 4 segundos
  mensaje._timeout = setTimeout(() => {
    mensaje.classList.remove("show");
  }, 4000);
}

/* -------------------------------------------------------------------------- */
/* 🔙 Redirigir al panel principal                                              */
/* -------------------------------------------------------------------------- */
export function goBack(confirmar = false) {
  if (confirmar) {
    const salir = confirm("¿Seguro que quieres volver al panel principal?");
    if (!salir) return;
  }
  window.location.href = "/panel.html";
}

/* -------------------------------------------------------------------------- */
/* 🚪 Cerrar sesión                                                            */
/* -------------------------------------------------------------------------- */
export function cerrarSesion() {
  localStorage.removeItem("admin_token");
  localStorage.removeItem("admin_user");
  window.location.href = "/login.html";
}

/* -------------------------------------------------------------------------- */
/* 👤 Obtener usuario activo                                                    */
/* -------------------------------------------------------------------------- */
export function getUsuarioActivo() {
  try {
    const raw = localStorage.getItem("admin_user");
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/* -------------------------------------------------------------------------- */
/* 🌐 Exponer logout global para HTML                                           */
/* -------------------------------------------------------------------------- */
window.cerrarSesion = cerrarSesion;
