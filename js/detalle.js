"use strict";

import { registrarVisitaPublica } from "./utils.js";
import { API_BASE } from "./config.js";

let productoGlobal = null;
let varianteSeleccionada = null;

document.addEventListener("DOMContentLoaded", () => {
  registrarVisitaPublica();
  activarModoOscuro();
  actualizarCarritoWidget();

  const id = new URLSearchParams(window.location.search).get("id");
  if (!id || id === "undefined") return mostrarError("❌ Producto no encontrado o inválido.");

  cargarProducto(id);

  document.getElementById("btnFavorito")?.addEventListener("click", () => toggleFavorito(id));
});

/* 📦 Obtener producto desde API */
async function cargarProducto(id) {
  try {
    const res = await fetch(`${API_BASE}/api/products/${encodeURIComponent(id)}`);
    const data = await res.json();

    if (!res.ok || !data?.producto?._id) throw new Error(data.message || "❌ Producto inválido");

    productoGlobal = data.producto;
    renderizarProducto(productoGlobal);
    actualizarSEO(productoGlobal);
    actualizarFavoritoUI(id);
  } catch (err) {
    mostrarError(err.message);
  }
}

/* 🖼 Renderizar producto */
function renderizarProducto(p) {
  const contenedor = document.getElementById("detalleProducto");
  if (!contenedor) return;

  const imagenPrincipal = p.images?.[0]?.url || "/assets/logo.jpg";
  const nombre = sanitize(p.name);
  const descripcion = sanitize(p.description);
  const precio = parseFloat(p.price || 0).toFixed(2);
  const galeria = p.images?.map((img, idx) => `
    <img src="${img.url}" class="mini-img" alt="Imagen ${idx + 1} de ${nombre}" data-full="${img.url}" loading="lazy" />
  `).join("") || "";

  const detalles = `
    <div class="detalles-extra">
      <p><strong>Categoría:</strong> ${sanitize(p.category)}</p>
      <p><strong>Subcategoría:</strong> ${sanitize(p.subcategory)}</p>
      <p><strong>Tipo de talla:</strong> ${sanitize(p.tallaTipo)}</p>
    </div>
  `;

  const tieneVariantes = Array.isArray(p.variants) && p.variants.length > 0;
  const stockDisplay = tieneVariantes
    ? `
      <div class="selectores" id="selectorVariantes">
        <label for="colorSelect">🎨 Color:</label>
        <select id="colorSelect" aria-label="Color"></select>

        <label for="tallaSelect">📏 Talla:</label>
        <select id="tallaSelect" aria-label="Talla" disabled></select>

        <div id="stockInfo" role="status" aria-live="polite">📦 Stock: -</div>

        <label for="cantidadInput">🔢 Cantidad:</label>
        <input type="number" id="cantidadInput" min="1" value="1" disabled />
      </div>
    `
    : `
      <div class="mt-1 text-muted">📦 Stock disponible: ${p.stockTotal ?? 0}</div>
      <label for="cantidadInput">🔢 Cantidad:</label>
      <input type="number" id="cantidadInput" min="1" max="${p.stockTotal}" value="1" />
    `;

  contenedor.innerHTML = `
    <div class="detalle-img">
      <img id="imgPrincipal" src="${imagenPrincipal}" alt="${nombre}" loading="lazy" />
      <div class="galeria-mini">${galeria}</div>
    </div>
    <div class="detalle-info" itemscope itemtype="https://schema.org/Product">
      <h2 itemprop="name">${nombre}</h2>
      <p itemprop="description">${descripcion}</p>
      <p class="precio">$<span itemprop="price">${precio}</span></p>
      <meta itemprop="sku" content="${p._id}" />
      <meta itemprop="brand" content="KM & EZ ROPA" />
      <meta itemprop="availability" content="https://schema.org/InStock" />
      <meta itemprop="priceCurrency" content="USD" />
      ${detalles}
      ${stockDisplay}
      <button class="btn-agregar" id="btnAgregarCarrito" ${tieneVariantes ? "disabled" : ""}>🛒 Agregar al carrito</button>
    </div>
  `;

  document.getElementById("btnAgregarCarrito")?.addEventListener("click", agregarAlCarrito);
  document.querySelectorAll(".mini-img").forEach(img =>
    img.addEventListener("click", e => {
      document.getElementById("imgPrincipal").src = e.target.dataset.full;
    })
  );

  if (tieneVariantes) configurarSelectores(p);
}

/* 🎨 Selectores para variantes */
function configurarSelectores(p) {
  const variantes = (p.variants || []).filter(v => v.stock > 0 && v.activo);
  const colorSelect = document.getElementById("colorSelect");
  const tallaSelect = document.getElementById("tallaSelect");
  const cantidadInput = document.getElementById("cantidadInput");
  const stockInfo = document.getElementById("stockInfo");
  const btnAgregar = document.getElementById("btnAgregarCarrito");

  const colores = [...new Set(variantes.map(v => v.color.toLowerCase()))];
  colorSelect.innerHTML = `<option disabled selected>Selecciona un color</option>` +
    colores.map(c => `<option value="${c}">${capitalize(c)}</option>`).join("");

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
    stockInfo.textContent = "📦 Stock: -";
  };

  tallaSelect.onchange = () => {
    const color = colorSelect.value;
    const talla = tallaSelect.value;
    const variante = variantes.find(v =>
      v.color.toLowerCase() === color && v.talla.toUpperCase() === talla
    );

    if (variante) {
      varianteSeleccionada = variante;
      stockInfo.textContent = `📦 Stock: ${variante.stock}`;
      cantidadInput.max = variante.stock;
      cantidadInput.value = 1;
      cantidadInput.disabled = false;
      btnAgregar.disabled = false;
    }
  };
}

/* 🛒 Agregar producto al carrito */
function agregarAlCarrito() {
  const cantidad = parseInt(document.getElementById("cantidadInput").value || "1");
  const carrito = JSON.parse(localStorage.getItem("km_ez_cart")) || [];

  const pushToCart = (clave, data, max) => {
    const idx = carrito.findIndex(p => `${p.id}_${p.talla}_${p.color}`.toLowerCase() === clave);
    if (idx >= 0) {
      carrito[idx].cantidad = Math.min(carrito[idx].cantidad + cantidad, max);
    } else {
      carrito.push(data);
    }
  };

  if (productoGlobal.variants?.length > 0) {
    if (!varianteSeleccionada) return mostrarToast("⚠️ Selecciona una variante válida.");
    if (cantidad < 1 || cantidad > varianteSeleccionada.stock)
      return mostrarToast(`⚠️ Stock insuficiente (${varianteSeleccionada.stock})`);

    const clave = `${productoGlobal._id}_${varianteSeleccionada.talla}_${varianteSeleccionada.color}`.toLowerCase();
    const item = {
      id: productoGlobal._id,
      nombre: productoGlobal.name,
      imagen: productoGlobal.images?.[0]?.url || "/assets/logo.jpg",
      precio: productoGlobal.price,
      talla: varianteSeleccionada.talla,
      color: varianteSeleccionada.color,
      cantidad
    };

    pushToCart(clave, item, varianteSeleccionada.stock);
  } else {
    const stock = productoGlobal.stockTotal ?? 0;
    if (cantidad < 1 || cantidad > stock) return mostrarToast(`⚠️ Stock insuficiente (${stock})`);

    pushToCart(`${productoGlobal._id}_única_`.toLowerCase(), {
      id: productoGlobal._id,
      nombre: productoGlobal.name,
      imagen: productoGlobal.images?.[0]?.url || "/assets/logo.jpg",
      precio: productoGlobal.price,
      talla: "única",
      color: "",
      cantidad
    }, stock);
  }

  localStorage.setItem("km_ez_cart", JSON.stringify(carrito));
  actualizarCarritoWidget();
  mostrarToast("🛒 Producto agregado al carrito.");
}

/* 🛠️ Utilidades */
function sanitize(str = "") {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
function capitalize(str = "") {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
function mostrarError(msg) {
  const contenedor = document.getElementById("detalleProducto");
  contenedor.innerHTML = `<div class="text-center" style="color:red;"><h3>${msg}</h3><a href="/categorias.html" class="btn-secundario">🔙 Volver</a></div>`;
}
function mostrarToast(msg) {
  const div = document.createElement("div");
  div.textContent = msg;
  Object.assign(div.style, {
    position: "fixed", bottom: "30px", right: "30px",
    background: "#ff6d00", color: "#fff", padding: "1rem",
    borderRadius: "8px", fontWeight: "bold", zIndex: "9999",
    boxShadow: "0 4px 10px rgba(0,0,0,0.2)"
  });
  document.body.appendChild(div);
  setTimeout(() => div.remove(), 2500);
}
function actualizarCarritoWidget() {
  const carrito = JSON.parse(localStorage.getItem("km_ez_cart")) || [];
  const total = carrito.reduce((sum, item) => sum + item.cantidad, 0);
  document.getElementById("cartCount").textContent = total;
}
function activarModoOscuro() {
  const btn = document.getElementById("modoOscuroBtn");
  if (localStorage.getItem("modoOscuro") === "true") document.body.classList.add("modo-oscuro");
  btn?.addEventListener("click", () => {
    const activo = document.body.classList.toggle("modo-oscuro");
    localStorage.setItem("modoOscuro", activo);
  });
}
function toggleFavorito(id) {
  const key = "km_ez_favs";
  const favs = JSON.parse(localStorage.getItem(key)) || [];
  const btn = document.getElementById("btnFavorito");
  if (favs.includes(id)) {
    localStorage.setItem(key, JSON.stringify(favs.filter(f => f !== id)));
    btn?.setAttribute("aria-pressed", "false");
  } else {
    favs.push(id);
    localStorage.setItem(key, JSON.stringify(favs));
    btn?.setAttribute("aria-pressed", "true");
  }
}
function actualizarFavoritoUI(id) {
  const favs = JSON.parse(localStorage.getItem("km_ez_favs")) || [];
  document.getElementById("btnFavorito")?.setAttribute("aria-pressed", favs.includes(id));
}
function actualizarSEO(p = {}) {
  const nombre = sanitize(p.name);
  const descripcion = sanitize(p.description);
  const imagen = p.images?.[0]?.url || "/assets/og-image.jpg";
  document.title = `${nombre} - Compra online | KM & EZ ROPA`;
  document.querySelector('meta[name="description"]')?.setAttribute("content", descripcion);
  document.getElementById("ogTitle")?.setAttribute("content", nombre);
  document.getElementById("ogDescription")?.setAttribute("content", descripcion);
  document.getElementById("ogImage")?.setAttribute("content", imagen);
}
