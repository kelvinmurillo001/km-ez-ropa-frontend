"use strict";

import { registrarVisitaPublica } from "./utils.js";
import { API_BASE } from "./config.js";

let productoGlobal = null;
let varianteSeleccionada = null;

document.addEventListener("DOMContentLoaded", () => {
  registrarVisitaPublica();
  const id = new URLSearchParams(window.location.search).get("id");

  if (!id || id === "undefined") {
    mostrarError("❌ Producto no encontrado o inválido.");
    return;
  }

  cargarProducto(id);
  activarModoOscuro();
  actualizarCarritoWidget();

  document.getElementById("btnFavorito")?.addEventListener("click", () => toggleFavorito(id));
});

async function cargarProducto(id) {
  try {
    const res = await fetch(`${API_BASE}/api/products/${id}`);
    if (!res.ok) throw new Error("⚠️ Producto no encontrado");

    const data = await res.json();
    const producto = data.producto;
    if (!producto?._id) throw new Error("❌ Producto inválido");

    productoGlobal = producto;
    renderizarProducto(producto);
    actualizarSEO(producto);
    actualizarFavoritoUI(id);
  } catch (err) {
    mostrarError(err.message);
  }
}

function renderizarProducto(p) {
  const detalle = document.getElementById("detalleProducto");
  if (!detalle) return;

  const imagen = p.image || p.images?.[0]?.url || "/assets/logo.jpg";
  const nombre = sanitize(p.name);
  const descripcion = sanitize(p.description);
  const precio = parseFloat(p.price).toFixed(2);

  const imagenes = (p.images || []).map(img =>
    `<img src="${img.url}" class="mini-img" alt="${nombre}" onclick="document.getElementById('imgPrincipal').src='${img.url}'"/>`
  ).join("");

  const detallesExtra = `
    <div class="detalles-extra">
      <p><strong>Categoría:</strong> ${sanitize(p.category)}</p>
      <p><strong>Subcategoría:</strong> ${sanitize(p.subcategory)}</p>
      <p><strong>Tipo de talla:</strong> ${sanitize(p.tallaTipo)}</p>
    </div>
  `;

  const tieneVariantes = Array.isArray(p.variants) && p.variants.length > 0;

  detalle.innerHTML = `
    <div class="detalle-img">
      <img id="imgPrincipal" src="${imagen}" alt="${nombre}" loading="lazy"/>
      <div class="galeria-mini">${imagenes}</div>
    </div>

    <div class="detalle-info" itemscope itemtype="https://schema.org/Product">
      <h2 itemprop="name">${nombre}</h2>
      <p itemprop="description">${descripcion}</p>
      <p class="precio">$<span itemprop="price">${precio}</span></p>

      <meta itemprop="sku" content="${p._id}" />
      <meta itemprop="brand" content="KM & EZ ROPA" />
      <meta itemprop="availability" content="https://schema.org/InStock" />
      <meta itemprop="priceCurrency" content="USD" />

      ${detallesExtra}

      ${tieneVariantes ? `
        <div class="selectores" id="selectorVariantes">
          <label for="colorSelect">🎨 Color:</label>
          <select id="colorSelect"><option disabled selected>Selecciona un color</option></select>

          <label for="tallaSelect">📏 Talla:</label>
          <select id="tallaSelect" disabled><option disabled selected>Selecciona una talla</option></select>

          <div id="stockInfo" role="status" aria-live="polite">📦 Stock: -</div>

          <label for="cantidadInput">🔢 Cantidad:</label>
          <input type="number" id="cantidadInput" min="1" value="1" disabled />
        </div>
      ` : `
        <div class="mt-1 text-muted">📦 Stock disponible: ${p.stockTotal ?? 0}</div>
        <label for="cantidadInput">🔢 Cantidad:</label>
        <input type="number" id="cantidadInput" min="1" max="${p.stockTotal ?? 0}" value="1" />
      `}

      <button class="btn-agregar" id="btnAgregarCarrito" ${tieneVariantes ? "disabled" : ""}>🛒 Agregar al carrito</button>
    </div>
  `;

  document.getElementById("btnAgregarCarrito")?.addEventListener("click", agregarAlCarrito);
  if (tieneVariantes) configurarSelectores(p);
}

function configurarSelectores(p) {
  const colorSelect = document.getElementById("colorSelect");
  const tallaSelect = document.getElementById("tallaSelect");
  const cantidadInput = document.getElementById("cantidadInput");
  const btnAgregar = document.getElementById("btnAgregarCarrito");

  const variantes = (p.variants || []).filter(v => v.stock > 0 && v.activo);

  if (variantes.length === 0) {
    mostrarToast("⚠️ No hay variantes disponibles para este producto.");
    btnAgregar.disabled = true;
    return;
  }

  const coloresUnicos = [...new Set(variantes.map(v => v.color.toLowerCase()))];

  colorSelect.innerHTML = `<option disabled selected>Selecciona un color</option>` +
    coloresUnicos.map(c => `<option value="${c}">${capitalize(c)}</option>`).join("");

  colorSelect.onchange = () => {
    const color = colorSelect.value;
    const tallas = variantes
      .filter(v => v.color.toLowerCase() === color)
      .map(v => v.talla.toUpperCase());

    tallaSelect.innerHTML = `<option disabled selected>Selecciona una talla</option>` +
      tallas.map(t => `<option value="${t}">${t}</option>`).join("");
    tallaSelect.disabled = false;
    cantidadInput.disabled = true;
    btnAgregar.disabled = true;
    document.getElementById("stockInfo").textContent = "📦 Stock: -";
  };

  tallaSelect.onchange = () => {
    const color = colorSelect.value;
    const talla = tallaSelect.value;
    const variante = variantes.find(v => v.color.toLowerCase() === color && v.talla.toUpperCase() === talla);

    if (variante) {
      varianteSeleccionada = variante;
      document.getElementById("stockInfo").textContent = `📦 Stock: ${variante.stock}`;
      cantidadInput.max = variante.stock;
      cantidadInput.value = 1;
      cantidadInput.disabled = false;
      btnAgregar.disabled = false;
    } else {
      cantidadInput.disabled = true;
      btnAgregar.disabled = true;
    }
  };
}

function agregarAlCarrito() {
  const cantidad = parseInt(document.getElementById("cantidadInput").value || "1");
  const btn = document.getElementById("btnAgregarCarrito");
  if (!productoGlobal || btn.disabled) return;

  const carrito = JSON.parse(localStorage.getItem("km_ez_cart")) || [];

  if (productoGlobal.variants?.length > 0) {
    if (!varianteSeleccionada) return mostrarToast("⚠️ Debes seleccionar un color y talla");
    if (cantidad < 1 || cantidad > varianteSeleccionada.stock) {
      return mostrarToast(`⚠️ Cantidad no permitida (stock: ${varianteSeleccionada.stock})`);
    }

    const clave = `${productoGlobal._id}_${varianteSeleccionada.talla}_${varianteSeleccionada.color}`.toLowerCase();
    const idx = carrito.findIndex(p =>
      `${p.id}_${p.talla}_${p.color}`.toLowerCase() === clave
    );

    if (idx >= 0) {
      carrito[idx].cantidad = Math.min(carrito[idx].cantidad + cantidad, varianteSeleccionada.stock);
    } else {
      carrito.push({
        id: productoGlobal._id,
        nombre: productoGlobal.name,
        imagen: productoGlobal.images?.[0]?.url || "/assets/logo.jpg",
        precio: productoGlobal.price,
        talla: varianteSeleccionada.talla,
        color: varianteSeleccionada.color,
        cantidad
      });
    }
  } else {
    if (cantidad < 1 || cantidad > (productoGlobal.stockTotal ?? 0)) {
      return mostrarToast(`⚠️ Cantidad no permitida (stock: ${productoGlobal.stockTotal})`);
    }

    const idx = carrito.findIndex(p => p.id === productoGlobal._id);

    if (idx >= 0) {
      carrito[idx].cantidad = Math.min(carrito[idx].cantidad + cantidad, productoGlobal.stockTotal);
    } else {
      carrito.push({
        id: productoGlobal._id,
        nombre: productoGlobal.name,
        imagen: productoGlobal.images?.[0]?.url || "/assets/logo.jpg",
        precio: productoGlobal.price,
        talla: "única",
        color: "",
        cantidad
      });
    }
  }

  localStorage.setItem("km_ez_cart", JSON.stringify(carrito));
  actualizarCarritoWidget();
  mostrarToast("🛒 Producto agregado al carrito.");
}

// Utils
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
function sanitize(text = "") {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}
function mostrarToast(msg) {
  const toast = document.createElement("div");
  toast.textContent = msg;
  Object.assign(toast.style, {
    position: "fixed", bottom: "30px", right: "30px",
    background: "#ff6d00", color: "#fff", padding: "1rem",
    borderRadius: "8px", fontWeight: "bold",
    boxShadow: "0 4px 12px rgba(0,0,0,0.3)", zIndex: "9999"
  });
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2500);
}
function mostrarError(msg) {
  const detalle = document.getElementById("detalleProducto");
  detalle.innerHTML = `<div class="text-center" style="color:red;"><h3>${msg}</h3><a href="/categorias.html" class="btn-secundario">🔙 Volver</a></div>`;
}
function actualizarCarritoWidget() {
  const carrito = JSON.parse(localStorage.getItem("km_ez_cart")) || [];
  const total = carrito.reduce((sum, i) => sum + (i.cantidad || 0), 0);
  document.getElementById("cartCount").textContent = total;
}
function activarModoOscuro() {
  if (localStorage.getItem("modoOscuro") === "true") {
    document.body.classList.add("modo-oscuro");
  }
  document.getElementById("modoOscuroBtn")?.addEventListener("click", () => {
    const dark = document.body.classList.toggle("modo-oscuro");
    localStorage.setItem("modoOscuro", dark);
  });
}
function toggleFavorito(id) {
  const key = "km_ez_favs";
  const favs = JSON.parse(localStorage.getItem(key)) || [];
  const idx = favs.indexOf(id);
  const btn = document.getElementById("btnFavorito");
  if (idx >= 0) {
    favs.splice(idx, 1);
    btn.setAttribute("aria-pressed", "false");
  } else {
    favs.push(id);
    btn.setAttribute("aria-pressed", "true");
  }
  localStorage.setItem(key, JSON.stringify(favs));
}
function actualizarFavoritoUI(id) {
  const favs = JSON.parse(localStorage.getItem("km_ez_favs")) || [];
  document.getElementById("btnFavorito")?.setAttribute("aria-pressed", favs.includes(id));
}
function actualizarSEO(p = {}) {
  const nombre = sanitize(p.name);
  const descripcion = sanitize(p.description);
  const imagen = p.image || p.images?.[0]?.url || "/assets/og-image.jpg";
  document.title = `${nombre} - Compra online | KM & EZ ROPA`;
  document.querySelector('meta[name="description"]')?.setAttribute("content", descripcion);
  document.getElementById("ogTitle")?.setAttribute("content", nombre);
  document.getElementById("ogDescription")?.setAttribute("content", descripcion);
  document.getElementById("ogImage")?.setAttribute("content", imagen);
}
