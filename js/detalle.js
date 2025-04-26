"use strict";

// ✅ IMPORTAR utilidades
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

/**
 * 📦 Cargar producto desde la API
 */
async function cargarProducto(id) {
  try {
    const res = await fetch(`${API_BASE}/api/products/${id}`);
    const data = await res.json();

    if (!res.ok || !data?.producto) {
      throw new Error(data?.message || "⚠️ El producto no fue encontrado.");
    }

    renderizarProducto(data.producto);
    actualizarSEO(data.producto); // 🆕 Actualizar SEO dinámico
  } catch (err) {
    console.error("❌ Error cargando producto:", err.message);
    mostrarError(err.message);
  }
}

/**
 * 🖼️ Renderizar producto en la página
 */
function renderizarProducto(p = {}) {
  const detalle = document.getElementById("detalleProducto");
  const imagenPrincipal = p.image || p.images?.[0]?.url || "/assets/logo.jpg";
  const imagenes = Array.isArray(p.images) ? p.images : [{ url: imagenPrincipal }];
  const nombre = sanitize(p.name || "Producto sin nombre");
  const descripcion = sanitize(p.description || "Sin descripción disponible");
  const precio = isNaN(p.price) ? "0.00" : parseFloat(p.price).toFixed(2);
  const id = p._id || "";

  let tallasDisponibles = [];
  let maxCantidad = 1;

  if (Array.isArray(p.variants) && p.variants.length > 0) {
    const conStock = p.variants.filter(v => v.stock > 0);
    tallasDisponibles = [...new Set(conStock.map(v => v.talla?.toUpperCase()))];
    maxCantidad = conStock.reduce((acc, v) => acc + (v.stock || 0), 0);
  } else {
    tallasDisponibles = p.sizes?.map(t => t.toUpperCase()) || ["Única"];
    maxCantidad = p.stock || 1;
  }

  const galeriaHTML = imagenes.map(img =>
    `<img src="${img.url}" alt="${nombre}" class="mini-img" loading="lazy"
      onclick="document.getElementById('imgPrincipal').src='${img.url}'" />`
  ).join("");

  const tallasHTML = tallasDisponibles.length
    ? tallasDisponibles.map(t => `<option value="${t}">${t}</option>`).join("")
    : `<option disabled selected>Sin tallas disponibles</option>`;

  detalle.innerHTML = `
    <div class="detalle-img">
      <img id="imgPrincipal" src="${imagenPrincipal}" alt="${nombre}" loading="lazy" onerror="this.src='/assets/logo.jpg'" />
      <div class="galeria-mini">${galeriaHTML}</div>
    </div>

    <div class="detalle-info" itemscope itemtype="https://schema.org/Product">
      <h2 itemprop="name">${nombre}</h2>
      <p itemprop="description">${descripcion}</p>
      <p class="precio">$<span itemprop="price">${precio}</span></p>

      <meta itemprop="sku" content="${id}" />
      <meta itemprop="brand" content="KM & EZ ROPA" />

      <div class="detalles-extra">
        <p><strong>Categoría:</strong> ${sanitize(p.category || "-")}</p>
        <p><strong>Subcategoría:</strong> ${sanitize(p.subcategory || "-")}</p>
        <p><strong>Tipo de talla:</strong> ${sanitize(p.tallaTipo || "-")}</p>
      </div>

      <div class="selectores">
        <label for="tallaSelect">Talla:</label>
        <select id="tallaSelect">${tallasHTML}</select>

        <label for="cantidadInput">Cantidad:</label>
        <input type="number" id="cantidadInput" min="1" max="${maxCantidad}" value="1" />
      </div>

      <button class="btn-agregar" onclick="agregarAlCarrito('${id}', \`${nombre}\`, \`${imagenPrincipal}\`, ${p.price || 0})" aria-label="Agregar al carrito">
        🛒 Agregar al carrito
      </button>
    </div>
  `;
}

/**
 * 🛒 Agregar al carrito
 */
function agregarAlCarrito(id, nombre, imagen, precio) {
  const talla = document.getElementById("tallaSelect")?.value || "Única";
  const cantidad = parseInt(document.getElementById("cantidadInput")?.value || "1");
  const max = parseInt(document.getElementById("cantidadInput")?.max || "1");

  if (cantidad > max) {
    return alert(`⚠️ Solo puedes agregar hasta ${max} unidad(es).`);
  }

  const nuevo = { id, nombre, imagen, precio, talla, cantidad };
  const carrito = JSON.parse(localStorage.getItem("km_ez_cart")) || [];

  const clave = `${id}_${talla}`.toLowerCase();
  const idx = carrito.findIndex(p => `${p.id}_${p.talla}`.toLowerCase() === clave);

  if (idx >= 0) {
    carrito[idx].cantidad = Math.min(carrito[idx].cantidad + cantidad, max);
  } else {
    carrito.push(nuevo);
  }

  localStorage.setItem("km_ez_cart", JSON.stringify(carrito));
  actualizarCarritoWidget();
  mostrarToast("🛒 Producto agregado al carrito.");
}

/**
 * ❤️ Toggle favorito
 */
function toggleFavorito(id) {
  const key = "km_ez_favs";
  const favs = JSON.parse(localStorage.getItem(key)) || [];
  const idx = favs.indexOf(id);

  if (idx >= 0) {
    favs.splice(idx, 1);
    mostrarToast("🧺 Producto quitado de favoritos.");
  } else {
    favs.push(id);
    mostrarToast("❤️ Producto guardado como favorito.");
  }

  localStorage.setItem(key, JSON.stringify(favs));
}

/**
 * 🛒 Actualizar contador carrito
 */
function actualizarCarritoWidget() {
  const carrito = JSON.parse(localStorage.getItem("km_ez_cart")) || [];
  const total = carrito.reduce((sum, i) => sum + i.cantidad, 0);
  const contador = document.getElementById("cartCount");
  if (contador) contador.textContent = total;
}

/**
 * 🔔 Toast visual
 */
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

/**
 * ❌ Mostrar error de producto
 */
function mostrarError(msg = "❌ Error inesperado") {
  const detalle = document.getElementById("detalleProducto");
  detalle.innerHTML = `
    <div class="text-center" style="color:red;">
      <h3>${msg}</h3>
      <p>Regresa al catálogo para continuar explorando.</p>
      <a href="/categorias.html" class="btn-secundario">🔙 Volver al catálogo</a>
    </div>`;
}

/**
 * 🌙 Activar modo oscuro
 */
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

/**
 * 🧼 Sanitizar texto
 */
function sanitize(text = "") {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

/**
 * 🔍 Actualizar SEO dinámico
 */
function actualizarSEO(producto = {}) {
  const nombre = sanitize(producto.name || "Producto | KM & EZ ROPA");
  const descripcion = sanitize(producto.description || "Moda urbana exclusiva para ti.");
  const imagen = producto.image || producto.images?.[0]?.url || "/assets/og-image.jpg";

  document.title = `${nombre} | KM & EZ ROPA`;

  const descTag = document.querySelector('meta[name="description"]');
  if (descTag) descTag.setAttribute("content", descripcion);

  const ogTitle = document.getElementById("ogTitle");
  const ogDescription = document.getElementById("ogDescription");
  const ogImage = document.getElementById("ogImage");

  if (ogTitle) ogTitle.setAttribute("content", nombre);
  if (ogDescription) ogDescription.setAttribute("content", descripcion);
  if (ogImage) ogImage.setAttribute("content", imagen);
}

// 🪄 Exponer funciones para botones inline
window.agregarAlCarrito = agregarAlCarrito;
window.toggleFavorito = toggleFavorito;
