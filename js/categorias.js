"use strict";

// ✅ Base API
import { API_BASE } from "./config.js";

const API_PRODUCTS = `${API_BASE}/api/products`;
const API_PROMOS = `${API_BASE}/api/promos`;
const API_CATEGORIES = `${API_BASE}/api/categories`;

// 📦 DOM Elements
const catalogo = document.getElementById("catalogo");
const categoriaSelect = document.getElementById("categoriaSelect");
const subcategoriaSelect = document.getElementById("subcategoriaSelect");
const precioSelect = document.getElementById("precioSelect");
const busquedaInput = document.getElementById("busquedaInput");
const contadorCarrito = document.getElementById("cartCount");
const promoContainer = document.getElementById("promo-display-container");

let categoriasData = [];

// 🚀 Inicialización
document.addEventListener("DOMContentLoaded", () => {
  aplicarModoOscuro();
  cargarCategoriasDesdeAPI();
  configurarFiltros();
  cargarPromocion();
  cargarProductos();
  actualizarContadorCarrito();
});

/* 🌙 Modo Oscuro */
function aplicarModoOscuro() {
  if (localStorage.getItem("modoOscuro") === "true") {
    document.body.classList.add("modo-oscuro");
  }
  document.getElementById("modoOscuroBtn")?.addEventListener("click", () => {
    const dark = document.body.classList.toggle("modo-oscuro");
    localStorage.setItem("modoOscuro", dark);
  });
}

/* 🎯 Filtros */
function configurarFiltros() {
  categoriaSelect?.addEventListener("change", () => {
    llenarSubcategorias();
    cargarProductos();
  });
  [subcategoriaSelect, precioSelect].forEach(el =>
    el?.addEventListener("change", cargarProductos)
  );
  busquedaInput?.addEventListener("input", debounce(cargarProductos, 500));
}

/* 📁 Cargar categorías desde el backend */
async function cargarCategoriasDesdeAPI() {
  try {
    const res = await fetch(API_CATEGORIES);
    const data = await res.json();
    if (!res.ok || !data.ok || !Array.isArray(data.data)) throw new Error(data.message || "Error al cargar categorías");

    categoriasData = data.data;
    llenarCategorias();
    llenarSubcategorias();
  } catch (err) {
    console.error("❌ Error categorías:", err.message);
  }
}

/* 📂 Llenar select de categorías */
function llenarCategorias() {
  categoriaSelect.innerHTML = '<option value="">📂 Todas</option>';
  categoriasData.forEach(cat => {
    categoriaSelect.innerHTML += `<option value="${sanitize(cat.name)}">${sanitize(cat.name)}</option>`;
  });
}

/* 📁 Llenar subcategorías según categoría */
function llenarSubcategorias() {
  const seleccionada = categoriaSelect.value;
  const cat = categoriasData.find(c => c.name === seleccionada);
  subcategoriaSelect.innerHTML = '<option value="">📁 Todas</option>';
  if (cat?.subcategories?.length) {
    cat.subcategories.forEach(sub => {
      subcategoriaSelect.innerHTML += `<option value="${sanitize(sub)}">${sanitize(sub)}</option>`;
    });
    subcategoriaSelect.disabled = false;
  } else {
    subcategoriaSelect.disabled = true;
  }
}

/* 📦 Cargar productos desde API */
async function cargarProductos() {
  if (!catalogo) return;
  catalogo.innerHTML = "<p class='text-center'>⏳ Cargando productos...</p>";

  try {
    const params = new URLSearchParams();
    const cat = categoriaSelect?.value?.trim();
    const sub = subcategoriaSelect?.value?.trim();
    const busqueda = busquedaInput?.value?.trim();

    if (cat) params.append("categoria", cat);
    if (sub) params.append("subcategoria", sub);
    if (busqueda) params.append("nombre", busqueda);

    const res = await fetch(`${API_PRODUCTS}?${params.toString()}`);
    const data = await res.json();

    if (!res.ok) throw new Error(data.message || "❌ Error al obtener productos.");
    const productos = Array.isArray(data.productos) ? data.productos : [];

    renderizarCatalogo(aplicarFiltros(productos));
  } catch (err) {
    catalogo.innerHTML = `<p class="text-center" style="color:red;">${err.message}</p>`;
  }
}

/* 🧠 Aplicar filtros */
function aplicarFiltros(productos) {
  const cat = categoriaSelect?.value?.toLowerCase() || "";
  const sub = subcategoriaSelect?.value?.toLowerCase() || "";
  const precio = precioSelect?.value || "";
  const busqueda = busquedaInput?.value?.toLowerCase() || "";

  return productos
    .filter(p => (!cat || p.category?.toLowerCase() === cat))
    .filter(p => (!sub || p.subcategory?.toLowerCase() === sub))
    .filter(p => (!busqueda || p.name?.toLowerCase().includes(busqueda)))
    .sort((a, b) => {
      if (precio === "low") return a.price - b.price;
      if (precio === "high") return b.price - a.price;
      return 0;
    });
}

/* 🎨 Renderizar catálogo */
function renderizarCatalogo(productos) {
  catalogo.innerHTML = "";
  catalogo.setAttribute("role", "list");

  if (!productos.length) {
    catalogo.innerHTML = `<p class="text-center">📭 No hay productos que coincidan con los filtros seleccionados.</p>`;
    return;
  }

  productos.forEach(p => {
    const imagen = p.image || p.images?.[0]?.url || "/assets/logo.jpg";
    const nombre = sanitize(p.name || "Producto sin nombre");
    const precio = typeof p.price === "number" ? p.price.toFixed(2) : "0.00";
    const id = p._id;

    const card = document.createElement("div");
    card.className = "product-card fade-in";
    card.setAttribute("role", "listitem");
    card.setAttribute("aria-label", nombre);
    card.innerHTML = `
      <img src="${imagen}" alt="Imagen de ${nombre}" loading="lazy" onerror="this.src='/assets/logo.jpg'" />
      <div class="product-info">
        <h3>${nombre}</h3>
        <p>$${precio}</p>
        <button class="btn-card" onclick="verDetalle('${id}')">👁️ Ver</button>
      </div>
    `;
    catalogo.appendChild(card);
  });
}

/* 🔁 Ir a detalle */
function verDetalle(id) {
  if (!id) return;
  window.location.href = `/detalle.html?id=${id}`;
}
window.verDetalle = verDetalle;

/* 🛒 Contador carrito */
function actualizarContadorCarrito() {
  const carrito = JSON.parse(localStorage.getItem("km_ez_cart")) || [];
  const total = carrito.reduce((sum, item) => sum + (item.cantidad || item.quantity || 0), 0);
  if (contadorCarrito) contadorCarrito.textContent = total;
}

/* 🎁 Promociones */
async function cargarPromocion() {
  try {
    const res = await fetch(API_PROMOS);
    const promo = await res.json();

    if (res.ok && promo?.data?.[0]?.active) {
      const { message, mediaUrl, mediaType, color } = promo.data[0];

      if (promoContainer && message) {
        promoContainer.innerHTML = `
          <div id="promoBanner" class="promo-banner" style="background-color:${color || "#ff6d00"}" role="region" aria-label="Promoción activa">
            ${mediaType === "image" ? `<img src="${mediaUrl}" alt="Promoción activa" />` : ""}
            <span>${sanitize(message)}</span>
          </div>
        `;
      }
    }
  } catch {
    console.warn("⚠️ No se pudo cargar la promoción activa.");
  }
}

/* 🧼 Sanitizar */
function sanitize(text = "") {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML.trim();
}

/* ⏳ Debounce */
function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}
