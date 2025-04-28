"use strict";

// 📥 Importar utilidades
import { registrarVisitaPublica } from "./utils.js";
import { API_BASE } from "./config.js";

// ▶️ Al cargar el DOM
document.addEventListener("DOMContentLoaded", async () => {
  registrarVisitaPublica(); // 📊 Registro de visita
  mostrarSaludo(); // 👋 Saludo dinámico
  aplicarModoOscuro(); // 🌙 Oscuro

  await mostrarProductosDestacados();
  actualizarCarritoWidget();
});

/* ───────────────────────────────────────────── */
/* 🛍️ Mostrar productos destacados              */
/* ───────────────────────────────────────────── */
async function mostrarProductosDestacados() {
  const catalogo = document.getElementById("catalogo");
  if (!catalogo) return;

  catalogo.innerHTML = `<p class="text-center">⏳ Cargando productos...</p>`;

  try {
    const res = await fetch(`${API_BASE}/api/products?featured=true`);
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Error al cargar productos destacados");
    }

    // Si el servidor devuelve directamente un array:
    const productos = Array.isArray(data) ? data : (data.productos || []);

    if (!productos.length) {
      catalogo.innerHTML = `<p class="text-center">😢 No hay productos destacados en este momento.</p>`;
      return;
    }

    catalogo.innerHTML = ""; // Limpiar catálogo antes de renderizar

    productos.forEach(producto => {
      const imagen = producto.image || producto.images?.[0]?.url || "/assets/logo.jpg";
      const nombre = sanitize(producto.name || "Producto sin nombre");
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
    catalogo.innerHTML = `<p class="text-center" style="color:red;">⚠️ No se pudieron cargar los productos destacados.</p>`;
  }
}

/* ───────────────────────────────────────────── */
/* 👋 Mostrar saludo por hora del día            */
/* ───────────────────────────────────────────── */
function mostrarSaludo() {
  const hora = new Date().getHours();
  let saludo = "👋 ¡Bienvenido a KM & EZ ROPA!";

  if (hora >= 5 && hora < 12) saludo = "🌞 ¡Buenos días, tu estilo comienza temprano!";
  else if (hora >= 12 && hora < 18) saludo = "☀️ ¡Buenas tardes! Descubre lo más top para esta temporada.";
  else saludo = "🌙 ¡Buenas noches! Ideal para elegir tu look de mañana.";

  console.log(saludo);
}

/* ───────────────────────────────────────────── */
/* 🌙 Modo oscuro persistente                    */
/* ───────────────────────────────────────────── */
function aplicarModoOscuro() {
  const btn = document.getElementById("modoOscuroBtn");
  const dark = localStorage.getItem("modoOscuro") === "true";

  if (dark) document.body.classList.add("modo-oscuro");

  btn?.addEventListener("click", () => {
    const isDark = document.body.classList.toggle("modo-oscuro");
    localStorage.setItem("modoOscuro", isDark);
    btn.textContent = isDark ? "☀️" : "🌙";
  });

  if (btn) btn.textContent = dark ? "☀️" : "🌙";
}

/* ───────────────────────────────────────────── */
/* 👁️ Navegación a detalle                      */
/* ───────────────────────────────────────────── */
function verDetalle(id) {
  if (!id || typeof id !== "string") return;
  window.location.href = `/detalle.html?id=${id}`;
}
window.verDetalle = verDetalle; // Globalizar

/* ───────────────────────────────────────────── */
/* 🛒 Widget del carrito                         */
/* ───────────────────────────────────────────── */
function actualizarCarritoWidget() {
  const carrito = JSON.parse(localStorage.getItem("km_ez_cart")) || [];
  const total = carrito.reduce((sum, item) => sum + (item.quantity || item.cantidad || 0), 0);

  const contador = document.getElementById("cartCount");
  if (contador) contador.textContent = total;
}

/* ───────────────────────────────────────────── */
/* 🧼 Sanitizar texto para evitar XSS            */
/* ───────────────────────────────────────────── */
function sanitize(text = "") {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}
