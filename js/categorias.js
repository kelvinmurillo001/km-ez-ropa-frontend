"use strict";
import { API_BASE } from "./config.js";


// === ELEMENTOS DEL DOM ===
const catalogo = document.getElementById("catalogo");
const categoriaSelect = document.getElementById("categoriaSelect");
const subcategoriaSelect = document.getElementById("subcategoriaSelect");
const precioSelect = document.getElementById("precioSelect");
const busquedaInput = document.getElementById("busquedaInput");
const promoBanner = document.getElementById("promoBanner");

// === API ===
const API_PRODUCTS = "/api/products";
const API_PROMOS = "/api/promos";

// === INICIO ===
document.addEventListener("DOMContentLoaded", () => {
  cargarPromocion();
  cargarProductos();
  actualizarCarritoWidget();
  aplicarModoOscuro();
});

// === MODO OSCURO ===
document.getElementById("modoOscuroBtn")?.addEventListener("click", () => {
  document.body.classList.toggle("modo-oscuro");
  localStorage.setItem("modoOscuro", document.body.classList.contains("modo-oscuro"));
});

function aplicarModoOscuro() {
  if (localStorage.getItem("modoOscuro") === "true") {
    document.body.classList.add("modo-oscuro");
  }
}

// === FILTROS CAMBIO ===
[categoriaSelect, subcategoriaSelect, precioSelect, busquedaInput].forEach(elem => {
  elem.addEventListener("change", cargarProductos);
  if (elem === busquedaInput) {
    elem.addEventListener("keyup", cargarProductos);
  }
});

// === CARGAR PRODUCTOS DESDE BACKEND ===
async function cargarProductos() {
  try {
    const res = await fetch(API_PRODUCTS);
    const data = await res.json();

    if (!res.ok) throw new Error("Error al cargar productos");

    let productos = data;

    // Filtros
    const cat = categoriaSelect.value;
    const sub = subcategoriaSelect.value;
    const precio = precioSelect.value;
    const texto = busquedaInput.value.trim().toLowerCase();

    if (cat) productos = productos.filter(p => p.category === cat);
    if (sub) productos = productos.filter(p => p.subcategory === sub);
    if (texto) productos = productos.filter(p => p.name.toLowerCase().includes(texto));
    if (precio === "low") productos.sort((a, b) => a.price - b.price);
    if (precio === "high") productos.sort((a, b) => b.price - a.price);

    renderizarCatalogo(productos);
    cargarCategorias(data); // Popular selects
  } catch (err) {
    console.error("❌ Error:", err);
    catalogo.innerHTML = "<p style='text-align:center; color:red;'>❌ No se pudo cargar el catálogo.</p>";
  }
}

// === RENDER CATALOGO ===
function renderizarCatalogo(productos) {
  catalogo.innerHTML = "";
  if (!productos.length) {
    catalogo.innerHTML = "<p style='text-align:center;'>🛑 No se encontraron productos con esos filtros.</p>";
    return;
  }

  productos.forEach(p => {
    const card = document.createElement("div");
    card.className = "product-card";
    card.innerHTML = `
      <img src="${p.image}" alt="${p.name}" />
      <div class="product-info">
        <h3>${p.name}</h3>
        <p>$${p.price.toFixed(2)}</p>
        <button onclick="verDetalle('${p._id}')" class="btn-card">👁️ Ver</button>
      </div>
    `;
    catalogo.appendChild(card);
  });
}

// === DETALLE PRODUCTO ===
function verDetalle(id) {
  window.location.href = `/detalle.html?id=${id}`;
}

// === LLENAR SELECTS CON OPCIONES UNICAS ===
function cargarCategorias(productos) {
  const categorias = [...new Set(productos.map(p => p.category))];
  const subcategorias = [...new Set(productos.map(p => p.subcategory))];

  categoriaSelect.innerHTML = '<option value="">Todas</option>' + categorias.map(c => `<option value="${c}">${c}</option>`).join('');
  subcategoriaSelect.innerHTML = '<option value="">Todas</option>' + subcategorias.map(s => `<option value="${s}">${s}</option>`).join('');
}

// === ACTUALIZAR CONTADOR CARRITO ===
function actualizarCarritoWidget() {
  const carrito = JSON.parse(localStorage.getItem("km_ez_cart")) || [];
  const total = carrito.reduce((sum, item) => sum + item.quantity, 0);
  const contador = document.getElementById("cartCount");
  if (contador) contador.textContent = total;
}

// === CARGAR PROMOCIÓN ACTIVA ===
async function cargarPromocion() {
  try {
    const res = await fetch(API_PROMOS);
    const promo = await res.json();
    if (!promo?.activa) return;

    promoBanner.style.background = promo.color || "#ff6d00";
    promoBanner.textContent = promo.mensaje;
  } catch (err) {
    console.warn("⚠️ No se pudo cargar promoción activa.");
  }
}
