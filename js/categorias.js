"use strict";

// ✅ Importar configuración
import { API_BASE } from "./config.js";

// === 🌐 Rutas de API ===
const API_PRODUCTS = `${API_BASE}/api/products`;
const API_PROMOS = `${API_BASE}/api/promos`;

// === 📦 Elementos del DOM ===
const catalogo = document.getElementById("catalogo");
const categoriaSelect = document.getElementById("categoriaSelect");
const subcategoriaSelect = document.getElementById("subcategoriaSelect");
const precioSelect = document.getElementById("precioSelect");
const busquedaInput = document.getElementById("busquedaInput");
const promoBanner = document.getElementById("promoBanner");

// === 🚀 Inicialización ===
document.addEventListener("DOMContentLoaded", () => {
  aplicarModoOscuro();
  cargarPromocion();
  cargarProductos();
  actualizarCarritoWidget();
  configurarFiltros();
});

// === 🌙 Modo oscuro persistente ===
function aplicarModoOscuro() {
  if (localStorage.getItem("modoOscuro") === "true") {
    document.body.classList.add("modo-oscuro");
  }

  const btn = document.getElementById("modoOscuroBtn");
  btn?.addEventListener("click", () => {
    document.body.classList.toggle("modo-oscuro");
    localStorage.setItem("modoOscuro", document.body.classList.contains("modo-oscuro"));
  });
}

// === 🎯 Filtros dinámicos ===
function configurarFiltros() {
  [categoriaSelect, subcategoriaSelect, precioSelect].forEach(el => {
    el.addEventListener("change", cargarProductos);
  });

  busquedaInput.addEventListener("input", cargarProductos);
}

// === 🔄 Cargar productos desde la API ===
async function cargarProductos() {
  try {
    const res = await fetch(API_PRODUCTS);
    const data = await res.json();

    if (!res.ok || !Array.isArray(data)) throw new Error(data.message || "Error al obtener productos");

    const filtrados = aplicarFiltros(data);
    renderizarCatalogo(filtrados);
    llenarSelects(data);
  } catch (err) {
    console.error("❌ Error al cargar productos:", err.message);
    catalogo.innerHTML = `<p style="text-align:center; color:red;">⚠️ No se pudo cargar el catálogo.</p>`;
  }
}

// === 🧠 Aplicar filtros ===
function aplicarFiltros(productos) {
  const cat = categoriaSelect.value.trim().toLowerCase();
  const sub = subcategoriaSelect.value.trim().toLowerCase();
  const precio = precioSelect.value;
  const texto = busquedaInput.value.trim().toLowerCase();

  return productos
    .filter(p => !cat || p.category?.toLowerCase() === cat)
    .filter(p => !sub || p.subcategory?.toLowerCase() === sub)
    .filter(p => !texto || p.name?.toLowerCase().includes(texto))
    .sort((a, b) => {
      if (precio === "low") return a.price - b.price;
      if (precio === "high") return b.price - a.price;
      return 0;
    });
}

// === 🎨 Renderizar productos ===
function renderizarCatalogo(productos) {
  catalogo.innerHTML = "";

  if (!productos.length) {
    catalogo.innerHTML = `<p style="text-align:center;">🛑 No se encontraron productos con esos filtros.</p>`;
    return;
  }

  for (const p of productos) {
    const imagen = p.image || p.images?.[0]?.url || "/assets/logo.jpg";
    const nombre = p.name || "Producto";
    const precio = typeof p.price === "number" ? p.price.toFixed(2) : "0.00";

    const card = document.createElement("div");
    card.className = "product-card";
    card.innerHTML = `
      <img src="${imagen}" alt="${nombre}" loading="lazy" onerror="this.src='/assets/logo.jpg'" />
      <div class="product-info">
        <h3>${nombre}</h3>
        <p>$${precio}</p>
        <button onclick="verDetalle('${p._id}')" class="btn-card">👁️ Ver</button>
      </div>
    `;
    catalogo.appendChild(card);
  }
}

// === 🔁 Redirección a detalle ===
function verDetalle(id) {
  if (!id) return;
  window.location.href = `/detalle.html?id=${id}`;
}
window.verDetalle = verDetalle;

// === 📂 Llenar selectores de categorías ===
function llenarSelects(productos) {
  const categorias = [...new Set(productos.map(p => p.category).filter(Boolean))];
  const subcategorias = [...new Set(productos.map(p => p.subcategory).filter(Boolean))];

  categoriaSelect.innerHTML = '<option value="">Todas</option>' +
    categorias.map(c => `<option value="${c}">${c}</option>`).join("");

  subcategoriaSelect.innerHTML = '<option value="">Todas</option>' +
    subcategorias.map(s => `<option value="${s}">${s}</option>`).join("");
}

// === 🛒 Actualizar contador del carrito ===
function actualizarCarritoWidget() {
  const carrito = JSON.parse(localStorage.getItem("km_ez_cart")) || [];
  const total = carrito.reduce((sum, item) => sum + (item.quantity || item.cantidad || 0), 0);
  const contador = document.getElementById("cartCount");
  if (contador) contador.textContent = total;
}

// === 🎁 Cargar promo activa (si hay) ===
async function cargarPromocion() {
  try {
    const res = await fetch(API_PROMOS);
    const promo = await res.json();

    if (res.ok && promo?.active && promo.message) {
      promoBanner.style.display = "block";
      promoBanner.style.backgroundColor = promo.color || "#ff6d00";
      promoBanner.textContent = promo.message;
    }
  } catch (err) {
    console.warn("⚠️ No se pudo cargar promoción activa.");
  }
}
