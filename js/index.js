"use strict";

// 📥 Importar utilidades
import { registrarVisitaPublica } from "./utils.js";
import { API_BASE } from "./config.js";

document.addEventListener("DOMContentLoaded", async () => {
  registrarVisitaPublica(); // 📊 Registro

  const catalogo = document.getElementById("catalogo");

  try {
    const res = await fetch(`${API_BASE}/api/products?featured=true`);
    const productos = await res.json();

    if (!res.ok) throw new Error(productos.message || "Error al cargar productos destacados");

    if (!Array.isArray(productos) || productos.length === 0) {
      catalogo.innerHTML = "<p style='text-align:center;'>😢 No hay productos destacados en este momento.</p>";
      return;
    }

    productos.forEach(p => {
      const imagen = p.image || p.images?.[0]?.url || "/assets/logo.jpg";
      const nombre = p.name || "Producto";
      const precio = typeof p.price === "number" ? `$${p.price.toFixed(2)}` : "$--";
      const id = p._id || "";

      const card = document.createElement("div");
      card.className = "product-card";
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

  } catch (err) {
    console.error("❌ Error cargando productos destacados:", err);
    catalogo.innerHTML = `<p style="text-align:center; color:red;">⚠️ No se pudieron cargar los productos.</p>`;
  }

  actualizarCarritoWidget();
  aplicarModoOscuro();
});

// 🌙 Modo oscuro
function aplicarModoOscuro() {
  const dark = localStorage.getItem("modoOscuro") === "true";
  if (dark) document.body.classList.add("modo-oscuro");

  const toggleBtn = document.getElementById("modoOscuroBtn");
  toggleBtn?.addEventListener("click", () => {
    document.body.classList.toggle("modo-oscuro");
    localStorage.setItem("modoOscuro", document.body.classList.contains("modo-oscuro"));
  });
}

// 👁️ Navegar a detalle
function verDetalle(id) {
  if (!id) return;
  window.location.href = `/detalle.html?id=${id}`;
}
window.verDetalle = verDetalle; // 💡 Exponer función globalmente

// 🛒 Actualizar contador del carrito
function actualizarCarritoWidget() {
  const carrito = JSON.parse(localStorage.getItem("km_ez_cart")) || [];
  const total = carrito.reduce((acc, item) => acc + (item.quantity || item.cantidad || 0), 0);
  const contador = document.getElementById("cartCount");
  if (contador) contador.textContent = total;
}
