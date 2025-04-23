"use strict";

// ✅ 1. Importar base de API
import { API_BASE } from "./config.js";

// 🌐 2. Definición de endpoints
const API_PRODUCTS = `${API_BASE}/api/products`;
const API_PROMOS = `${API_BASE}/api/promos`;

// 📦 3. Obtener elementos del DOM de forma segura
const catalogo = document.getElementById("catalogo");
const categoriaSelect = document.getElementById("categoriaSelect");
const subcategoriaSelect = document.getElementById("subcategoriaSelect");
const precioSelect = document.getElementById("precioSelect");
const busquedaInput = document.getElementById("busquedaInput");
const contadorCarrito = document.getElementById("cartCount");
const promoContainer = document.getElementById("promo-display-container");

// 🚀 4. Iniciar cuando el DOM esté listo
document.addEventListener("DOMContentLoaded", () => {
  aplicarModoOscuro();
  configurarFiltros();
  cargarPromocion();
  cargarProductos();
  actualizarContadorCarrito();
});

// 🌙 5. Alternancia de modo oscuro
function aplicarModoOscuro() {
  if (localStorage.getItem("modoOscuro") === "true") {
    document.body.classList.add("modo-oscuro");
  }

  const toggle = document.getElementById("modoOscuroBtn");
  toggle?.addEventListener("click", () => {
    document.body.classList.toggle("modo-oscuro");
    localStorage.setItem("modoOscuro", document.body.classList.contains("modo-oscuro"));
  });
}

// 🎯 6. Listeners de filtros
function configurarFiltros() {
  [categoriaSelect, subcategoriaSelect, precioSelect].forEach(el => {
    el?.addEventListener("change", cargarProductos);
  });
  busquedaInput?.addEventListener("input", cargarProductos);
}

// 📦 7. Cargar productos desde el backend
async function cargarProductos() {
  if (!catalogo) return;
  catalogo.innerHTML = "<p class='text-center'>⏳ Cargando productos...</p>";

  try {
    const res = await fetch(API_PRODUCTS);
    const data = await res.json();
    if (!res.ok || !Array.isArray(data)) throw new Error("Error al obtener productos");

    const productosFiltrados = aplicarFiltros(data);
    renderizarCatalogo(productosFiltrados);
    llenarSelects(data); // Llenar filtros después de cargar
  } catch (err) {
    console.error("❌", err.message);
    catalogo.innerHTML = `<p class="text-center" style="color:red;">❌ No se pudo cargar el catálogo.</p>`;
  }
}

// 🧠 8. Filtros dinámicos
function aplicarFiltros(productos) {
  const cat = categoriaSelect?.value?.toLowerCase() || "";
  const sub = subcategoriaSelect?.value?.toLowerCase() || "";
  const precio = precioSelect?.value || "";
  const busqueda = busquedaInput?.value?.toLowerCase() || "";

  return productos
    .filter(p => !cat || p.category?.toLowerCase() === cat)
    .filter(p => !sub || p.subcategory?.toLowerCase() === sub)
    .filter(p => !busqueda || p.name?.toLowerCase().includes(busqueda))
    .sort((a, b) => {
      if (precio === "low") return a.price - b.price;
      if (precio === "high") return b.price - a.price;
      return 0;
    });
}

// 🎨 9. Renderizar catálogo
function renderizarCatalogo(productos) {
  if (!catalogo) return;
  catalogo.innerHTML = "";

  if (!productos.length) {
    catalogo.innerHTML = `<p class="text-center">📭 No se encontraron productos con esos filtros.</p>`;
    return;
  }

  productos.forEach(p => {
    const imagen = p.image || p.images?.[0]?.url || "/assets/logo.jpg";
    const nombre = p.name || "Producto sin nombre";
    const precio = typeof p.price === "number" ? p.price.toFixed(2) : "0.00";

    const card = document.createElement("div");
    card.className = "product-card";
    card.innerHTML = `
      <img src="${imagen}" alt="${nombre}" loading="lazy" onerror="this.src='/assets/logo.jpg'" />
      <div class="product-info">
        <h3>${nombre}</h3>
        <p>$${precio}</p>
        <button class="btn-card" onclick="verDetalle('${p._id}')">👁️ Ver</button>
      </div>
    `;
    catalogo.appendChild(card);
  });
}

// 🔁 10. Redirigir a detalle de producto
function verDetalle(id) {
  if (!id) {
    alert("❌ ID de producto inválido");
    return;
  }
  window.location.href = `/detalle.html?id=${id}`;
}
window.verDetalle = verDetalle;

// 📂 11. Llenar los filtros select dinámicamente
function llenarSelects(productos) {
  if (!categoriaSelect || !subcategoriaSelect) return;

  const categorias = [...new Set(productos.map(p => p.category).filter(Boolean))];
  const subcategorias = [...new Set(productos.map(p => p.subcategory).filter(Boolean))];

  categoriaSelect.innerHTML = '<option value="">📂 Todas</option>' +
    categorias.map(c => `<option value="${c}">${c}</option>`).join("");

  subcategoriaSelect.innerHTML = '<option value="">📁 Todas</option>' +
    subcategorias.map(s => `<option value="${s}">${s}</option>`).join("");
}

// 🛒 12. Contador del carrito localStorage
function actualizarContadorCarrito() {
  const carrito = JSON.parse(localStorage.getItem("km_ez_cart")) || [];
  const total = carrito.reduce((acc, item) => acc + (item.cantidad || item.quantity || 0), 0);
  if (contadorCarrito) contadorCarrito.textContent = total;
}

// 🎁 13. Cargar promoción activa si está disponible
async function cargarPromocion() {
  try {
    const res = await fetch(API_PROMOS);
    const promo = await res.json();
    if (res.ok && promo?.active && promo?.message && promoContainer) {
      const banner = document.createElement("div");
      banner.id = "promoBanner";
      banner.className = "promo-banner";
      banner.style.backgroundColor = promo.color || "#ff6d00";
      banner.textContent = promo.message;
      promoContainer.appendChild(banner);
    }
  } catch (err) {
    console.warn("⚠️ No se pudo cargar la promoción activa.");
  }
}
