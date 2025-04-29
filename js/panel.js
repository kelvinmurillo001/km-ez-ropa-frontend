// 📁 js/panel.js
"use strict";

import { API_BASE } from "./config.js";

// ▶️ Al cargar el DOM
document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("admin_token");
  const user = JSON.parse(localStorage.getItem("admin_user") || "{}");

  // 🔒 Si no hay token o no es admin, redirigir
  if (!token || !user.isAdmin) {
    window.location.href = "/login.html";
    return;
  }

  mostrarBienvenida(user.name || user.username || "Admin");
  await cargarProductos();
  configurarLogout();
});

/* ───────────────────────────────────────────── */
/* 👋 Mostrar bienvenida                         */
/* ───────────────────────────────────────────── */
function mostrarBienvenida(nombre) {
  const saludo = document.getElementById("adminSaludo");
  if (saludo) {
    saludo.textContent = `👋 Bienvenido, ${nombre}`;
  }
}

/* ───────────────────────────────────────────── */
/* 📦 Cargar productos y mostrarlos              */
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
      contenedor.innerHTML = `<p>😢 No hay productos cargados.</p>`;
      return;
    }

    contenedor.innerHTML = ""; // Limpiar

    data.productos.forEach(prod => {
      const card = document.createElement("div");
      card.className = "producto-card";
      card.innerHTML = `
        <h3>${sanitize(prod.name)}</h3>
        <p>💲 ${prod.price ? `$${prod.price.toFixed(2)}` : "--"}</p>
        <p>📦 ${sanitize(prod.category)}</p>
        <p>⭐ ${prod.featured ? "Destacado" : "Normal"}</p>
      `;
      contenedor.appendChild(card);
    });
  } catch (err) {
    console.error("❌ Error cargando productos:", err.message);
    contenedor.innerHTML = `<p style="color:red;">❌ ${err.message}</p>`;
  }
}

/* ───────────────────────────────────────────── */
/* 🚪 Logout seguro                              */
/* ───────────────────────────────────────────── */
function configurarLogout() {
  const btnLogout = document.getElementById("btnLogout");
  if (!btnLogout) return;

  btnLogout.addEventListener("click", () => {
    if (confirm("¿Seguro que quieres salir?")) {
      localStorage.removeItem("admin_token");
      localStorage.removeItem("admin_user");
      window.location.href = "/login.html";
    }
  });
}

/* ───────────────────────────────────────────── */
/* 🧼 Sanitizar texto                            */
/* ───────────────────────────────────────────── */
function sanitize(text = "") {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}
