"use strict";

// ✅ 1. Importar base de API
import { API_BASE } from "./config.js";

// 🌐 2. Endpoints
const API_PRODUCTS = `${API_BASE}/api/products`;
const API_PROMOS = `${API_BASE}/api/promos`;

// 📦 3. DOM Elements
const catalogo = document.getElementById("catalogo");
const categoriaSelect = document.getElementById("categoriaSelect");
const subcategoriaSelect = document.getElementById("subcategoriaSelect");
const precioSelect = document.getElementById("precioSelect");
const busquedaInput = document.getElementById("busquedaInput");
const contadorCarrito = document.getElementById("cartCount");
const promoContainer = document.getElementById("promo-display-container");

// 🚀 4. Inicializar
document.addEventListener("DOMContentLoaded", () => {
  aplicarModoOscuro();
  configurarFiltros();
  cargarPromocion();
  cargarProductos();
  actualizarContadorCarrito();
});

/* ───────────────────────────────────────────── */
/* 🌙 5. Activar modo oscuro persistente          */
/* ───────────────────────────────────────────── */
function aplicarModoOscuro() {
  if (localStorage.getItem("modoOscuro") === "true") {
    document.body.classList.add("modo-oscuro");
  }
  document.getElementById("modoOscuroBtn")?.addEventListener("click", () => {
    const isDark = document.body.classList.toggle("modo-oscuro");
    localStorage.setItem("modoOscuro", isDark);
  });
}

/* ───────────────────────────────────────────── */
/* 🎯 6. Configurar filtros dinámicos             */
/* ───────────────────────────────────────────── */
function configurarFiltros() {
  [categoriaSelect, subcategoriaSelect, precioSelect].forEach(el =>
    el?.addEventListener("change", cargarProductos)
  );
  busquedaInput?.addEventListener("input", cargarProductos);
}

/* ───────────────────────────────────────────── */
/* 📦 7. Cargar productos desde API               */
/* ───────────────────────────────────────────── */
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

    if (!res.ok) {
      throw new Error(data.message || "❌ Error al obtener productos.");
    }

    const productos = Array.isArray(data) ? data : (data.productos || []);
    if (!Array.isArray(productos)) {
      throw new Error("❌ Respuesta inválida de productos.");
    }

    const productosFiltrados = aplicarFiltros(productos);
    renderizarCatalogo(productosFiltrados);
    llenarSelects(productos);

  } catch (err) {
    console.error("❌", err.message);
    catalogo.innerHTML = `<p class="text-center" style="color:red;">${err.message}</p>`;
  }
}

/* ───────────────────────────────────────────── */
/* 🧠 8. Aplicar filtros en frontend              */
/* ───────────────────────────────────────────── */
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

/* ───────────────────────────────────────────── */
/* 🎨 9. Renderizar catálogo de productos         */
/* ───────────────────────────────────────────── */
function renderizarCatalogo(productos) {
  if (!catalogo) return;
  catalogo.innerHTML = "";
  catalogo.setAttribute("role", "list");

  if (!productos.length) {
    catalogo.innerHTML = `<p class="text-center">📭 No se encontraron productos con esos filtros.</p>`;
    return;
  }

  productos.forEach(p => {
    const imagen = p.image || p.images?.[0]?.url || "/assets/logo.jpg";
    const nombre = sanitize(p.name || "Producto sin nombre");
    const precio = typeof p.price === "number" ? p.price.toFixed(2) : "0.00";
    const id = p._id;

    if (!id) return;

    const card = document.createElement("div");
    card.className = "product-card fade-in";
    card.setAttribute("role", "listitem");
    card.setAttribute("aria-label", nombre);

    card.innerHTML = `
      <img src="${imagen}" alt="Imagen de ${nombre}" loading="lazy" onerror="this.src='/assets/logo.jpg'" />
      <div class="product-info">
        <h3>${nombre}</h3>
        <p>$${precio}</p>
        <button class="btn-card" onclick="verDetalle('${id}')" aria-label="Ver detalles de ${nombre}">👁️ Ver</button>
      </div>
    `;
    catalogo.appendChild(card);
  });
}

/* ───────────────────────────────────────────── */
/* 🔁 10. Redirigir a detalle de producto         */
/* ───────────────────────────────────────────── */
function verDetalle(id) {
  if (!id) return alert("❌ ID inválido");
  window.location.href = `/detalle.html?id=${id}`;
}
window.verDetalle = verDetalle;

/* ───────────────────────────────────────────── */
/* 📂 11. Llenar selects de categorías dinámicos  */
/* ───────────────────────────────────────────── */
function llenarSelects(productos) {
  if (!categoriaSelect || !subcategoriaSelect) return;

  const categorias = [...new Set(productos.map(p => p.category).filter(Boolean))];
  const subcategorias = [...new Set(productos.map(p => p.subcategory).filter(Boolean))];

  categoriaSelect.innerHTML = '<option value="">📂 Todas</option>' +
    categorias.map(c => `<option value="${sanitize(c)}">${sanitize(c)}</option>`).join("");

  subcategoriaSelect.innerHTML = '<option value="">📁 Todas</option>' +
    subcategorias.map(s => `<option value="${sanitize(s)}">${sanitize(s)}</option>`).join("");
}

/* ───────────────────────────────────────────── */
/* 🛒 12. Actualizar contador de carrito          */
/* ───────────────────────────────────────────── */
function actualizarContadorCarrito() {
  const carrito = JSON.parse(localStorage.getItem("km_ez_cart")) || [];
  const total = carrito.reduce((acc, item) => acc + (item.cantidad || item.quantity || 0), 0);
  if (contadorCarrito) contadorCarrito.textContent = total;
}

/* ───────────────────────────────────────────── */
/* 🎁 13. Cargar promociones activas              */
/* ───────────────────────────────────────────── */
async function cargarPromocion() {
  try {
    const res = await fetch(API_PROMOS);
    const promo = await res.json();

    if (res.ok && promo?.data?.[0]?.active) {
      const { message, mediaUrl, mediaType, color } = promo.data[0];
      if (promoContainer && message) {
        const banner = document.createElement("div");
        banner.id = "promoBanner";
        banner.className = "promo-banner";
        banner.style.backgroundColor = color || "#ff6d00";
        banner.setAttribute("role", "region");
        banner.setAttribute("aria-label", "Promoción activa");

        banner.innerHTML = `
          ${mediaType === "image" ? `<img src="${mediaUrl}" alt="Promoción activa" />` : ""}
          <span>${message}</span>
        `;
        promoContainer.appendChild(banner);
      }
    }
  } catch (err) {
    console.warn("⚠️ No se pudo cargar la promoción activa.");
  }
}

/* ───────────────────────────────────────────── */
/* 🧼 14. Función para sanitizar texto seguro     */
/* ───────────────────────────────────────────── */
function sanitize(text = "") {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML.trim();
}
