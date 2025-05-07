// 📁 js/panel.js
"use strict";

import { API_BASE } from "./config.js";
import { mostrarMensaje, cerrarSesion, getUsuarioActivo, verificarSesion } from "./admin-utils.js";

document.addEventListener("DOMContentLoaded", async () => {
  try {
    await verificarSesion(); // 🔐 Verificación segura vía backend
    const user = getUsuarioActivo();
    mostrarBienvenida(user.name || user.username || "Administrador");
    await cargarProductos();
    configurarLogout();
  } catch (err) {
    console.error("❌ Error al verificar sesión:", err.message);
  }
});

/* ───────────────────────────────────────────── */
/* 👋 Mostrar saludo personalizado               */
/* ───────────────────────────────────────────── */
function mostrarBienvenida(nombre) {
  const saludo = document.getElementById("adminSaludo");
  if (saludo) saludo.textContent = `👋 Bienvenido, ${sanitize(nombre)}`;
}

/* ───────────────────────────────────────────── */
/* 📦 Cargar productos protegidos por token      */
/* ───────────────────────────────────────────── */
async function cargarProductos() {
  const contenedor = document.getElementById("listaProductos");
  if (!contenedor) return;

  contenedor.innerHTML = `<p>⏳ Cargando productos...</p>`;
  const token = localStorage.getItem("admin_token");

  try {
    const res = await fetch(`${API_BASE}/api/products?limite=50`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Error cargando productos");

    if (!Array.isArray(data.productos) || data.productos.length === 0) {
      contenedor.innerHTML = `<p>📭 No hay productos registrados.</p>`;
      return;
    }

    contenedor.innerHTML = "";
    data.productos.forEach(prod => {
      const card = document.createElement("div");
      card.className = "producto-card";
      card.innerHTML = `
        <h3>${sanitize(prod.name)}</h3>
        <p>💲 ${prod.price ? `$${parseFloat(prod.price).toFixed(2)}` : "--"}</p>
        <p>📦 ${sanitize(prod.category || "Sin categoría")}</p>
        <p>⭐ ${prod.featured ? "Destacado" : "Normal"}</p>
      `;
      contenedor.appendChild(card);
    });
  } catch (err) {
    console.error("❌ Error cargando productos:", err);
    mostrarMensaje("❌ Error cargando productos. Verifica conexión.", "error");
    contenedor.innerHTML = `<p style="color:red;">❌ ${sanitize(err.message)}</p>`;
  }
}

/* ───────────────────────────────────────────── */
/* 🚪 Cerrar sesión con confirmación             */
/* ───────────────────────────────────────────── */
function configurarLogout() {
  const btnLogout = document.getElementById("btnLogout") || document.getElementById("btnCerrarSesion");
  if (!btnLogout) return;

  btnLogout.addEventListener("click", () => {
    if (confirm("¿Estás seguro de cerrar sesión?")) {
      cerrarSesion();
    }
  });
}

/* ───────────────────────────────────────────── */
/* 🧼 Sanitizar texto para evitar XSS            */
/* ───────────────────────────────────────────── */
function sanitize(text = "") {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML.trim();
}
