"use strict";

import { registrarVisitaPublica } from "./utils.js";
import { API_BASE } from "./config.js";

document.addEventListener("DOMContentLoaded", () => {
  registrarVisitaPublica();

  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  if (!id || id === "undefined") {
    mostrarError("❌ Producto no encontrado o inválido.");
    return;
  }

  cargarProducto(id);
  activarModoOscuro();
  actualizarCarritoWidget();

  document.getElementById("btnFavorito")?.addEventListener("click", () => toggleFavorito(id));
});

/* 📦 Cargar producto */
async function cargarProducto(id) {
  try {
    const res = await fetch(`${API_BASE}/api/products/${id}`);
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || "⚠️ El producto no fue encontrado.");
    }

    const data = await res.json();
    const producto = data.producto || {};

    if (!producto || !producto._id) {
      throw new Error("⚠️ Producto inválido o no encontrado.");
    }

    renderizarProducto(producto);
    actualizarSEO(producto);
    actualizarFavoritoUI(id);
  } catch (err) {
    console.error("❌ Error cargando producto:", err.message);
    mostrarError(err.message);
  }
}

/* 🖼️ Renderizar producto */
function renderizarProducto(p = {}) {
  const detalle = document.getElementById("detalleProducto");
  if (!detalle) return;

  const imagenPrincipal = p.image || p.images?.[0]?.url || "/assets/logo.jpg";
  const imagenes = Array.isArray(p.images) ? p.images : [{ url: imagenPrincipal }];
  const nombre = sanitize(p.name || "Producto sin nombre");
  const descripcion = sanitize(p.description || "Sin descripción disponible");
  const precio = !isNaN(p.price) ? parseFloat(p.price).toFixed(2) : "0.00";
  const id = p._id || "";

  let tallasDisponibles = [];
  let stockTotal = 0;

  if (Array.isArray(p.variants) && p.variants.length > 0) {
    const conStock = p.variants.filter(v => v.stock > 0);
    tallasDisponibles = [...new Set(conStock.map(v => v.talla?.toUpperCase()))].sort();
    stockTotal = conStock.reduce((acc, v) => acc + (v.stock || 0), 0);
  } else {
    tallasDisponibles = p.sizes?.map(t => t.toUpperCase()) || ["ÚNICA"];
    stockTotal = typeof p.stock === "number" ? p.stock : 0;
  }

  const galeriaHTML = imagenes.map(img =>
    `<img src="${img.url}" alt="${nombre}" class="mini-img" loading="lazy" onclick="document.getElementById('imgPrincipal').src='${img.url}'" />`
  ).join("");

  const tallasHTML = tallasDisponibles.length
    ? tallasDisponibles.map(t => `<option value="${t}">${t}</option>`).join("")
    : `<option disabled selected>Sin tallas disponibles</option>`;

  detalle.innerHTML = `
    <div class="detalle-img">
      <img id="imgPrincipal" src="${imagenPrincipal}" alt="${nombre}" loading="lazy" onerror="this.src='/assets/logo.jpg'" aria-label="Imagen principal del producto" role="img" />
      <div class="galeria-mini">${galeriaHTML}</div>
    </div>

    <div class="detalle-info" itemscope itemtype="https://schema.org/Product">
      <h2 itemprop="name">${nombre}</h2>
      <p itemprop="description">${descripcion}</p>
      <p class="precio">$<span itemprop="price">${precio}</span></p>

      <meta itemprop="sku" content="${id}" />
      <meta itemprop="brand" content="KM & EZ ROPA" />
      <meta itemprop="availability" content="https://schema.org/InStock" />
      <meta itemprop="priceCurrency" content="USD" />

      <div class="detalles-extra">
        <p><strong>Categoría:</strong> ${sanitize(p.category || "-")}</p>
        <p><strong>Subcategoría:</strong> ${sanitize(p.subcategory || "-")}</p>
        <p><strong>Tipo de talla:</strong> ${sanitize(p.tallaTipo || "-")}</p>
      </div>

      <div class="selectores">
        <label for="tallaSelect">Talla:</label>
        <select id="tallaSelect">${tallasHTML}</select>

        <label for="cantidadInput">Cantidad:</label>
        <input type="number" id="cantidadInput" min="1" max="${stockTotal}" value="1" />
      </div>

      <button class="btn-agregar" onclick="agregarAlCarrito('${id}', \`${nombre}\`, \`${imagenPrincipal}\`, ${p.price || 0})">
        🛒 Agregar al carrito
      </button>
    </div>
  `;
}

/* 🛒 Agregar al carrito */
function agregarAlCarrito(id, nombre, imagen, precio) {
  const talla = document.getElementById("tallaSelect")?.value;
  const cantidad = parseInt(document.getElementById("cantidadInput")?.value || "1");
  const max = parseInt(document.getElementById("cantidadInput")?.max || "1");

  if (!talla || talla.toLowerCase().includes("sin talla")) {
    return mostrarToast("⚠️ Selecciona una talla válida.");
  }

  if (cantidad > max) {
    return mostrarToast(`⚠️ Solo puedes agregar hasta ${max} unidad(es).`);
  }

  const carrito = JSON.parse(localStorage.getItem("km_ez_cart")) || [];
  const clave = `${id}_${talla}`.toLowerCase();
  const idx = carrito.findIndex(p => `${p.id}_${p.talla}`.toLowerCase() === clave);

  if (idx >= 0) {
    carrito[idx].cantidad = Math.min(carrito[idx].cantidad + cantidad, max);
  } else {
    carrito.push({ id, nombre, imagen, precio, talla, cantidad });
  }

  localStorage.setItem("km_ez_cart", JSON.stringify(carrito));
  actualizarCarritoWidget();
  mostrarToast("🛒 Producto agregado al carrito.");
}

/* ❤️ Agregar/Quitar favoritos */
function toggleFavorito(id) {
  const key = "km_ez_favs";
  const favs = JSON.parse(localStorage.getItem(key)) || [];
  const idx = favs.indexOf(id);
  const btn = document.getElementById("btnFavorito");

  if (idx >= 0) {
    favs.splice(idx, 1);
    mostrarToast("🧺 Producto quitado de favoritos.");
    if (btn) btn.setAttribute("aria-pressed", "false");
  } else {
    favs.push(id);
    mostrarToast("❤️ Producto guardado como favorito.");
    if (btn) btn.setAttribute("aria-pressed", "true");
  }

  localStorage.setItem(key, JSON.stringify(favs));
}

function actualizarFavoritoUI(id) {
  const favs = JSON.parse(localStorage.getItem("km_ez_favs")) || [];
  const btn = document.getElementById("btnFavorito");
  if (btn) {
    btn.setAttribute("aria-pressed", favs.includes(id));
  }
}

/* 🛒 Actualizar contador de carrito */
function actualizarCarritoWidget() {
  const carrito = JSON.parse(localStorage.getItem("km_ez_cart")) || [];
  const total = carrito.reduce((sum, i) => sum + (i.cantidad || 0), 0);
  const contador = document.getElementById("cartCount");
  if (contador) contador.textContent = total;
}

/* 🔔 Toast */
function mostrarToast(mensaje) {
  const toast = document.createElement("div");
  toast.textContent = mensaje;
  Object.assign(toast.style, {
    position: "fixed",
    bottom: "30px",
    right: "30px",
    background: "#ff6d00",
    color: "#fff",
    padding: "1rem",
    borderRadius: "8px",
    fontWeight: "bold",
    boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
    zIndex: "9999"
  });
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2500);
}

/* ❌ Error visual */
function mostrarError(msg = "❌ Error inesperado") {
  const detalle = document.getElementById("detalleProducto");
  if (detalle) {
    detalle.innerHTML = `
      <div class="text-center" style="color:red;">
        <h3>${msg}</h3>
        <p>Regresa al catálogo para continuar explorando.</p>
        <a href="/categorias.html" class="btn-secundario">🔙 Volver al catálogo</a>
      </div>`;
  }
}

/* 🌙 Modo Oscuro */
function activarModoOscuro() {
  if (localStorage.getItem("modoOscuro") === "true") {
    document.body.classList.add("modo-oscuro");
  }

  const btn = document.getElementById("modoOscuroBtn");
  btn?.addEventListener("click", () => {
    const dark = document.body.classList.toggle("modo-oscuro");
    localStorage.setItem("modoOscuro", dark);
  });
}

/* 🧼 Sanitizar para evitar XSS */
function sanitize(text = "") {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

/* 🔍 Actualizar metadatos SEO */
function actualizarSEO(producto = {}) {
  const nombre = sanitize(producto.name || "Producto | KM & EZ ROPA");
  const descripcion = sanitize(producto.description || "Moda urbana exclusiva para ti.");
  const imagen = producto.image || producto.images?.[0]?.url || "/assets/og-image.jpg";

  document.title = `${nombre} - Compra online | KM & EZ ROPA`;

  const descTag = document.querySelector('meta[name="description"]');
  if (descTag) descTag.setAttribute("content", descripcion);

  const ogTitle = document.getElementById("ogTitle");
  const ogDescription = document.getElementById("ogDescription");
  const ogImage = document.getElementById("ogImage");

  if (ogTitle) ogTitle.setAttribute("content", nombre);
  if (ogDescription) ogDescription.setAttribute("content", descripcion);
  if (ogImage) ogImage.setAttribute("content", imagen);
}

// 🌍 Exponer globales
window.agregarAlCarrito = agregarAlCarrito;
window.toggleFavorito = toggleFavorito;
