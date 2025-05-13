// 📁 js/panel.js
"use strict";

import { API_BASE, STORAGE_KEYS } from "./config.js";
import {
  mostrarMensaje,
  cerrarSesion,
  getUsuarioActivo,
  verificarSesion,
} from "./admin-utils.js";

document.addEventListener("DOMContentLoaded", async () => {
  try {
    await verificarSesion(); // 🔐 Sesión segura

    const user = getUsuarioActivo();
    mostrarBienvenida(user?.name || user?.username || "Administrador");

    await cargarProductos();
    configurarLogout();
  } catch (err) {
    console.error("❌ Error de sesión:", err.message);
    mostrarMensaje("❌ Sesión inválida. Redirigiendo...", "error");
    setTimeout(() => (window.location.href = "/login.html"), 1500);
  }
});

/* ───────────────────────────────────────────── */
/* 👋 Mostrar saludo personalizado               */
/* ───────────────────────────────────────────── */
function mostrarBienvenida(nombre = "Administrador") {
  const saludo = document.getElementById("adminSaludo");
  if (saludo) {
    saludo.textContent = `👋 Bienvenido, ${sanitize(nombre)}`;
  }
}

/* ───────────────────────────────────────────── */
/* 📦 Cargar productos protegidos                */
/* ───────────────────────────────────────────── */
async function cargarProductos() {
  const contenedor = document.getElementById("listaProductos");
  if (!contenedor) return;

  contenedor.innerHTML = `<p>⏳ Cargando productos...</p>`;

  const token = localStorage.getItem(STORAGE_KEYS.token);
  if (!token) {
    contenedor.innerHTML = `<p style="color:red;">❌ Token no encontrado.</p>`;
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/api/products?limite=50`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const data = await res.json();

    if (res.status === 401 || res.status === 403) {
      mostrarMensaje("⛔ Acceso no autorizado. Redirigiendo...", "error");
      setTimeout(() => (window.location.href = "/login.html"), 1500);
      return;
    }

    if (!res.ok) {
      throw new Error(data.message || "❌ Error cargando productos.");
    }

    if (!Array.isArray(data.productos) || data.productos.length === 0) {
      contenedor.innerHTML = `<p>📭 No hay productos registrados.</p>`;
      return;
    }

    contenedor.innerHTML = "";
    data.productos.forEach((producto) => contenedor.appendChild(crearTarjetaProducto(producto)));
  } catch (err) {
    console.error("❌ Error obteniendo productos:", err);
    mostrarMensaje("❌ Error cargando productos. Intenta más tarde.", "error");
    contenedor.innerHTML = `<p style="color:red;">${sanitize(err.message)}</p>`;
  }
}

/**
 * 🧾 Crea un elemento HTML para el producto
 * @param {object} producto 
 * @returns {HTMLElement}
 */
function crearTarjetaProducto(producto) {
  const card = document.createElement("div");
  card.className = "producto-card";
  card.innerHTML = `
    <h3>${sanitize(producto.name)}</h3>
    <p>💲 ${producto.price ? `$${parseFloat(producto.price).toFixed(2)}` : "--"}</p>
    <p>📦 ${sanitize(producto.category || "Sin categoría")}</p>
    <p>⭐ ${producto.featured ? "Destacado" : "Normal"}</p>
  `;
  return card;
}

/* ───────────────────────────────────────────── */
/* 🚪 Configurar botón de logout                 */
/* ───────────────────────────────────────────── */
function configurarLogout() {
  const btn = document.getElementById("btnLogout") || document.getElementById("btnCerrarSesion");
  if (!btn) return;

  btn.addEventListener("click", () => {
    if (confirm("¿Estás seguro de cerrar sesión?")) {
      cerrarSesion();
    }
  });
}

/* ───────────────────────────────────────────── */
/* 🧼 Sanitizador seguro contra XSS              */
/* ───────────────────────────────────────────── */
function sanitize(text = "") {
  const div = document.createElement("div");
  div.textContent = String(text);
  return div.innerHTML.trim();
}
