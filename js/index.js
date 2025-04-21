"use strict";

// 📥 Importar utilidades
import { registrarVisitaPublica } from "./utils.js";
import { API_BASE } from "./config.js";

document.addEventListener("DOMContentLoaded", async () => {
  registrarVisitaPublica(); // 📊 Registro de visita

  const catalogo = document.getElementById("catalogo");

  try {
    const res = await fetch(`${API_BASE}/api/products?featured=true`);
    const productos = await res.json();

    if (!res.ok || !Array.isArray(productos)) {
      throw new Error(productos.message || "Error al cargar productos destacados");
    }

    if (productos.length === 0) {
      catalogo.innerHTML = "<p style='text-align:center;'>😢 No hay productos destacados en este momento.</p>";
      return;
    }

    productos.forEach(producto => {
      const imagen = producto.image || producto.images?.[0]?.url || "/assets/logo.jpg";
      const nombre = producto.name || "Producto sin nombre";
      const precio = typeof producto.price === "number" ? `$${producto.price.toFixed(2)}` : "$ --";
      const id = producto._id || "";

      const card = document.createElement("div");
      card.className = "product-card fade-in";

      card.innerHTML = `
        <img src="${imagen}" alt="${nombre}" loading="lazy" onerror="this.src='/assets/logo.jpg'" />
        <div class="product-info">
          <h3>${nombre}</h3>
          <p>${precio}</p>
          ${id ? `<button class="btn-card" onclick="verDetalle('${id}')">👁️ Ver</button>` : ""}
        </div>
      `;

      catalogo.appendChild(card);
    });

  } catch (error) {
    console.error("❌ Error cargando productos destacados:", error);
    catalogo.innerHTML = `<p style="text-align:center; color:red;">⚠️ No se pudieron cargar los productos.</p>`;
  }

  actualizarCarritoWidget();
  aplicarModoOscuro();
});

// 🌙 Modo oscuro
function aplicarModoOscuro() {
  const btn = document.getElementById("modoOscuroBtn");
  const dark = localStorage.getItem("modoOscuro") === "true";

  if (dark) document.body.classList.add("modo-oscuro");

  btn?.addEventListener("click", () => {
    const isDark = document.body.classList.toggle("modo-oscuro");
    localStorage.setItem("modoOscuro", isDark);
    btn.textContent = isDark ? "☀️" : "🌙";
  });

  // Icono inicial
  if (btn) btn.textContent = dark ? "☀️" : "🌙";
}

// 👁️ Ver detalle
function verDetalle(id) {
  if (!id || typeof id !== "string") return;
  window.location.href = `/detalle.html?id=${id}`;
}
window.verDetalle = verDetalle; // Globalizar función

// 🛒 Actualizar contador del carrito
function actualizarCarritoWidget() {
  const carrito = JSON.parse(localStorage.getItem("km_ez_cart")) || [];
  const total = carrito.reduce((sum, item) => sum + (item.quantity || item.cantidad || 0), 0);

  const contador = document.getElementById("cartCount");
  if (contador) contador.textContent = total;
}
