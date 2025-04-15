"use strict";

/**
 * main.js
 * Controla la carga de productos destacados en el index.html
 * y gestiona el botón de modo oscuro.
 */

// Endpoint del backend
const API_URL = "https://km-ez-ropa-backend.onrender.com/api/products";

// Elementos
const catalogo = document.getElementById("catalogo");
const modoBtn = document.getElementById("modoToggle");
const carritoWidgetContainer = document.getElementById("carrito-widget-container");

// 🌓 Alternar modo oscuro
function toggleModoOscuro() {
  document.body.classList.toggle("modo-oscuro");
  const isDark = document.body.classList.contains("modo-oscuro");
  localStorage.setItem("modoOscuro", isDark);
  modoBtn.textContent = isDark ? "☀️ Modo Claro" : "🌙 Modo Oscuro";
}

// ✅ Restaurar preferencia guardada
function verificarModoGuardado() {
  const modoOscuro = localStorage.getItem("modoOscuro") === "true";
  if (modoOscuro) {
    document.body.classList.add("modo-oscuro");
    modoBtn.textContent = "☀️ Modo Claro";
  }
}

// 🧲 Cargar productos populares
async function cargarProductos() {
  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error("Error al cargar productos");

    const productos = await res.json();

    const destacados = productos
      .filter(p => p.destacado)
      .slice(0, 12); // Limita a 12 para evitar scroll excesivo

    destacados.forEach(p => {
      const card = crearCard(p);
      catalogo.appendChild(card);
    });

  } catch (error) {
    console.error("❌ Error cargando productos:", error.message);
    catalogo.innerHTML = `<p style="color:red; text-align:center;">❌ Error al cargar productos.</p>`;
  }
}

// 🧩 Crear tarjeta de producto
function crearCard(producto) {
  const div = document.createElement("div");
  div.className = "card fade-in";

  const imagen = producto.imagen || "/assets/logo.jpg";
  const nombre = producto.nombre || "Producto";
  const precio = producto.precio || 0;

  div.innerHTML = `
    <img src="${imagen}" alt="${nombre}" loading="lazy" onerror="this.src='/assets/logo.jpg'" />
    <h3>${nombre}</h3>
    <p><strong>$${precio}</strong></p>
    ${producto.destacado ? `<span class="destacado-badge">🔥 Popular</span>` : ""}
    <button onclick="window.location.href='detalle.html?id=${producto._id}'">Ver Detalle</button>
  `;
  return div;
}

// 🛒 Agregar botón flotante del carrito y WhatsApp
function agregarWidgetsFlotantes() {
  carritoWidgetContainer.innerHTML = `
    <div id="cart-widget">
      <a href="/carrito.html">
        <img src="/assets/cart.png" alt="Carrito de Compras" />
        <span id="cart-widget-count">0</span>
      </a>
    </div>
    <div class="whatsapp-float">
      <a href="https://wa.me/593990270864" target="_blank">
        <img src="/assets/whatsapp.png" alt="WhatsApp" />
      </a>
    </div>
  `;
}

// 📦 Inicializar
document.addEventListener("DOMContentLoaded", () => {
  verificarModoGuardado();
  agregarWidgetsFlotantes();
  cargarProductos();
  updateCartWidget?.(); // desde cart.js

  modoBtn?.addEventListener("click", toggleModoOscuro);
});
