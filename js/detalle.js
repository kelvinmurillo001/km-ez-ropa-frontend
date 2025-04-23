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

  const btnFavorito = document.getElementById("btnFavorito");
  btnFavorito?.addEventListener("click", () => toggleFavorito(id));
});

/**
 * 📦 Cargar producto desde la API
 */
async function cargarProducto(id) {
  try {
    const res = await fetch(`${API_BASE}/api/products/${id}`);
    const data = await res.json();
    if (!res.ok || !data?.producto) throw new Error("Producto no encontrado");
    renderizarProducto(data.producto);
  } catch (err) {
    console.error("❌", err.message);
    mostrarError("⚠️ No se pudo cargar el producto.");
  }
}

/**
 * 🖼️ Renderizar producto en pantalla
 */
function renderizarProducto(p = {}) {
  const detalle = document.getElementById("detalleProducto");
  const imagenPrincipal = p.image || p.images?.[0]?.url || "/assets/logo.jpg";
  const imagenes = Array.isArray(p.images) ? p.images : [{ url: imagenPrincipal }];
  const nombre = p.name || "Producto sin nombre";
  const descripcion = p.description || "Sin descripción disponible";
  const precio = typeof p.price === "number" ? p.price.toFixed(2) : "0.00";
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

  const tallasHTML = tallasDisponibles.length
    ? tallasDisponibles.map(t => `<option value="${t}">${t}</option>`).join("")
    : '<option disabled selected>Sin tallas disponibles</option>';

  const galeriaHTML = imagenes.map(img =>
    `<img src="${img.url}" alt="${nombre}" loading="lazy" class="mini-img" onclick="document.getElementById('imgPrincipal').src='${img.url}'"/>`
  ).join("");

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
      <p><strong>Categoría:</strong> ${p.category || "-"}</p>
      <p><strong>Subcategoría:</strong> ${p.subcategory || "-"}</p>
      <p><strong>Tipo de talla:</strong> ${p.tallaTipo || "-"}</p>
    </div>

    <div class="selectores">
      <label for="tallaSelect">Talla:</label>
      <select id="tallaSelect">${tallasHTML}</select>

      <label for="cantidadInput">Cantidad:</label>
      <input type="number" id="cantidadInput" value="1" min="1" max="${maxCantidad}" />
    </div>

    <button class="btn-agregar" onclick="agregarAlCarrito('${id}', \`${nombre}\`, \`${imagenPrincipal}\`, ${p.price || 0})">
      🛒 Agregar al carrito
    </button>
  </div>`;
}

/**
 * 🛒 Agregar producto al carrito
 */
function agregarAlCarrito(id, nombre, imagen, precio) {
  const talla = document.getElementById("tallaSelect")?.value || "Única";
  const cantidadInput = document.getElementById("cantidadInput");
  const cantidad = parseInt(cantidadInput.value) || 1;
  const max = parseInt(cantidadInput.max) || 1;

  if (cantidad > max) {
    alert(`⚠️ Solo puedes seleccionar hasta ${max} unidad(es).`);
    return;
  }

  const nuevoProducto = { id, nombre, imagen, precio, talla, cantidad };
  const carrito = JSON.parse(localStorage.getItem("km_ez_cart")) || [];
  const key = `${id}_${talla}`.toLowerCase();
  const index = carrito.findIndex(p => `${p.id}_${p.talla}`.toLowerCase() === key);

  if (index >= 0) {
    carrito[index].cantidad = Math.min(carrito[index].cantidad + cantidad, max);
  } else {
    carrito.push(nuevoProducto);
  }

  localStorage.setItem("km_ez_cart", JSON.stringify(carrito));
  actualizarCarritoWidget();
  mostrarToast("✨ ¡Sumado al estilo! Producto agregado al carrito.");
}

/**
 * 🧡 Agregar/quitar de favoritos
 */
function toggleFavorito(id) {
  const key = "km_ez_favs";
  const favs = JSON.parse(localStorage.getItem(key)) || [];
  const i = favs.indexOf(id);

  if (i >= 0) {
    favs.splice(i, 1);
    mostrarToast("🧺 Producto quitado de favoritos.");
  } else {
    favs.push(id);
    mostrarToast("❤️ Producto guardado como favorito.");
  }

  localStorage.setItem(key, JSON.stringify(favs));
}

/**
 * 🛍️ Contador del carrito
 */
function actualizarCarritoWidget() {
  const carrito = JSON.parse(localStorage.getItem("km_ez_cart")) || [];
  const total = carrito.reduce((sum, item) => sum + item.cantidad, 0);
  const contador = document.getElementById("cartCount");
  if (contador) contador.textContent = total;
}

/**
 * 🔔 Toast simple
 */
function mostrarToast(mensaje = "✅ Acción realizada") {
  const toast = document.createElement("div");
  toast.textContent = mensaje;
  Object.assign(toast.style, {
    position: "fixed",
    bottom: "30px",
    right: "30px",
    background: "#ff6d00",
    color: "#fff",
    padding: "0.8rem 1.2rem",
    borderRadius: "8px",
    fontWeight: "bold",
    boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
    zIndex: "999"
  });
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2500);
}

/**
 * ⚠️ Mensaje de error
 */
function mostrarError(texto = "❌ Error desconocido") {
  document.getElementById("detalleProducto").innerHTML = `
    <div style="color:red; text-align:center;">
      <h3>${texto}</h3>
      <p>Por favor regresa al catálogo.</p>
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

  const toggleBtn = document.getElementById("modoOscuroBtn");
  toggleBtn?.addEventListener("click", () => {
    document.body.classList.toggle("modo-oscuro");
    localStorage.setItem("modoOscuro", document.body.classList.contains("modo-oscuro"));
  });
}

// 🌐 Global
window.agregarAlCarrito = agregarAlCarrito;
window.toggleFavorito = toggleFavorito;
