// 📁 js/panel.js
"use strict";

import { API_BASE } from "./config.js";

// ▶️ Al cargar el DOM
document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("admin_token");
  const user = JSON.parse(localStorage.getItem("admin_user") || "{}");

  // 🔒 Verificar sesión y rol
  if (!token || !user?.isAdmin) {
    location.href = "/login.html";
    return;
  }

  mostrarBienvenida(user.name || user.username || "Administrador");
  await cargarProductos();
  configurarLogout();
});

/* ───────────────────────────────────────────── */
/* 👋 Mostrar saludo personalizado               */
/* ───────────────────────────────────────────── */
function mostrarBienvenida(nombre) {
  const saludo = document.getElementById("adminSaludo");
  if (saludo) saludo.textContent = `👋 Bienvenido, ${sanitize(nombre)}`;
}

/* ───────────────────────────────────────────── */
/* 📦 Cargar y renderizar lista de productos     */
/* ───────────────────────────────────────────── */
async function cargarProductos() {
  const contenedor = document.getElementById("listaProductos");
  if (!contenedor) return;

  contenedor.innerHTML = `<p>⏳ Cargando productos...</p>`;

  try {
    const res = await fetch(`${API_BASE}/api/products?limite=50`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("admin_token")}`
      }
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.message || "Error cargando productos.");

    if (!Array.isArray(data.productos) || data.productos.length === 0) {
      contenedor.innerHTML = `<p>📭 No hay productos registrados.</p>`;
      return;
    }

    contenedor.innerHTML = ""; // Limpiar contenedor

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
      localStorage.removeItem("admin_token");
      localStorage.removeItem("admin_user");
      location.href = "/login.html";
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
