"use strict";

import { registrarVisitaPublica } from "./utils.js";
import { API_BASE } from "./config.js";

document.addEventListener("DOMContentLoaded", async () => {
  registrarVisitaPublica();
  mostrarSaludo();
  aplicarModoOscuro();
  await mostrarProductosDestacados();
  actualizarCarritoWidget();
});

/* ───────────────────────────────────────────── */
/* 🛍️ Productos Destacados con reintento        */
/* ───────────────────────────────────────────── */
async function mostrarProductosDestacados(reintentos = 1) {
  const catalogo = document.getElementById("catalogo");
  if (!catalogo) return;

  catalogo.innerHTML = `<p class="text-center">⏳ Cargando productos...</p>`;

  try {
    const res = await fetch(`${API_BASE}/api/products?featured=true`, {
      headers: { "Content-Type": "application/json" },
      credentials: "include"
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Error al cargar productos destacados.");

    const productos = Array.isArray(data.productos) ? data.productos : [];
    if (!productos.length) {
      catalogo.innerHTML = `<p class="text-center">😢 No hay productos destacados en este momento.</p>`;
      return;
    }

    catalogo.innerHTML = "";

    productos.forEach(producto => {
      const imagen = producto.image || producto.images?.[0]?.url || "/assets/logo.jpg";
      const nombre = sanitize(producto.name || "Producto sin nombre");
      const precio = typeof producto.price === "number" ? `$${producto.price.toFixed(2)}` : "$ --";
      const id = producto._id || "";

      const card = document.createElement("div");
      card.className = "product-card fade-in";
      card.innerHTML = `
        <img src="${imagen}" alt="Imagen de ${nombre}" loading="lazy"
          onerror="this.onerror=null;this.src='/assets/logo.jpg'" />
        <div class="product-info">
          <h3>${nombre}</h3>
          <p>${precio}</p>
          ${id ? `<button class="btn-card" data-id="${id}" aria-label="Ver detalles de ${nombre}">👁️ Ver</button>` : ""}
        </div>
      `;
      catalogo.appendChild(card);
    });

    catalogo.addEventListener("click", e => {
      if (e.target.matches(".btn-card")) {
        const id = e.target.dataset.id;
        verDetalle(id);
      }
    });

  } catch (error) {
    console.error("❌ Error cargando productos destacados:", error);

    // Intentar 1 vez más si es CSP o red
    if (reintentos > 0) {
      setTimeout(() => mostrarProductosDestacados(reintentos - 1), 1500);
      return;
    }

    const mensaje = error.message?.includes("CSP")
      ? "⚠️ El navegador bloqueó la carga por políticas de seguridad (CSP)."
      : "⚠️ No se pudieron cargar los productos. Intenta más tarde.";

    catalogo.innerHTML = `<p class="text-center" style="color:red;">${sanitize(mensaje)}</p>`;
  }
}

/* ───────────────────────────────────────────── */
function mostrarSaludo() {
  const hora = new Date().getHours();
  let saludo = "👋 ¡Bienvenido a KM & EZ ROPA!";
  if (hora >= 5 && hora < 12) saludo = "🌞 ¡Buenos días! Tu estilo comienza temprano.";
  else if (hora >= 12 && hora < 18) saludo = "☀️ ¡Buenas tardes! Descubre lo más top de la temporada.";
  else saludo = "🌙 ¡Buenas noches! Ideal para elegir tu look de mañana.";
  console.log(saludo);
}

/* ───────────────────────────────────────────── */
function aplicarModoOscuro() {
  const btn = document.getElementById("modoOscuroBtn");
  const dark = localStorage.getItem("modoOscuro") === "true";
  if (dark) document.body.classList.add("modo-oscuro");

  btn?.addEventListener("click", () => {
    const isDark = document.body.classList.toggle("modo-oscuro");
    localStorage.setItem("modoOscuro", isDark);
    btn.textContent = isDark ? "☀️" : "🌙";
    btn.setAttribute("aria-label", isDark ? "Modo claro" : "Modo oscuro");
  });

  if (btn) {
    btn.textContent = dark ? "☀️" : "🌙";
    btn.setAttribute("aria-label", dark ? "Modo claro" : "Modo oscuro");
  }
}

/* ───────────────────────────────────────────── */
function verDetalle(id) {
  if (!id || typeof id !== "string") return;
  const sanitizedId = encodeURIComponent(id);
  window.location.href = `/detalle.html?id=${sanitizedId}`;
}

/* ───────────────────────────────────────────── */
function actualizarCarritoWidget() {
  try {
    const carrito = JSON.parse(localStorage.getItem("km_ez_cart")) || [];
    const total = carrito.reduce((sum, item) => sum + (item.quantity || item.cantidad || 0), 0);
    const contador = document.getElementById("cartCount");
    if (contador) contador.textContent = total;
  } catch (err) {
    console.warn("⚠️ Error al actualizar el carrito:", err);
  }
}

/* ───────────────────────────────────────────── */
function sanitize(text = "") {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}
