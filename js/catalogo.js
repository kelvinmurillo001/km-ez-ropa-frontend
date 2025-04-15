"use strict";

const API_URL = "https://km-ez-ropa-backend.onrender.com/api/products";

document.addEventListener("DOMContentLoaded", () => {
  cargarProductos();
  setupBusqueda();
  modoOscuroDesdeStorage();
  setupModoOscuroToggle();
  setupZoomImagen();
  actualizarContadorCarrito();
});

/**
 * 🌐 Obtener productos del backend
 */
async function cargarProductos() {
  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error("Error al cargar productos");

    const productos = await res.json();
    renderizarCatalogo(productos);
  } catch (err) {
    console.error("❌ Error cargando productos:", err);
    document.getElementById("catalogo").innerHTML =
      "<p class='error'>❌ No se pudieron cargar los productos.</p>";
  }
}

/**
 * 🛍️ Renderizar productos
 */
function renderizarCatalogo(productos) {
  const contenedor = document.getElementById("catalogo");
  contenedor.innerHTML = "";

  productos.forEach((producto) => {
    const card = document.createElement("div");
    card.className = "card fade-in";

    card.innerHTML = `
      ${producto.destacado ? '<div class="destacado-badge">🔥 Destacado</div>' : ""}
      <img src="${producto.imagenes?.[0] || '/assets/default.jpg'}" alt="${producto.nombre}" data-zoom />
      <h3>${producto.nombre}</h3>
      <p>${producto.precio ? `$${producto.precio}` : "Precio no disponible"}</p>
      <button onclick="agregarAlCarrito('${producto._id}', '${producto.nombre}', ${producto.precio})">
        Añadir al carrito
      </button>
    `;

    contenedor.appendChild(card);
  });
}

/**
 * 🔎 Búsqueda por nombre
 */
function setupBusqueda() {
  const input = document.getElementById("busqueda");

  if (!input) return;

  input.addEventListener("input", async () => {
    const texto = input.value.trim().toLowerCase();

    try {
      const res = await fetch(API_URL);
      const productos = await res.json();

      const filtrados = productos.filter((p) =>
        p.nombre.toLowerCase().includes(texto)
      );

      renderizarCatalogo(filtrados);
    } catch (err) {
      console.error("❌ Error buscando:", err);
    }
  });
}

/**
 * 🛒 Agregar al carrito
 */
function agregarAlCarrito(id, nombre, precio) {
  const carrito = JSON.parse(localStorage.getItem("carrito") || "[]");
  const index = carrito.findIndex((item) => item.id === id);

  if (index >= 0) {
    carrito[index].cantidad += 1;
  } else {
    carrito.push({ id, nombre, precio, cantidad: 1 });
  }

  localStorage.setItem("carrito", JSON.stringify(carrito));
  actualizarContadorCarrito();
}

/**
 * 🔢 Contador carrito visual
 */
function actualizarContadorCarrito() {
  const carrito = JSON.parse(localStorage.getItem("carrito") || "[]");
  const total = carrito.reduce((acc, item) => acc + item.cantidad, 0);
  const contador = document.getElementById("cart-widget-count");
  if (contador) contador.textContent = total;
}

/**
 * 🌓 Modo oscuro inicial desde localStorage
 */
function modoOscuroDesdeStorage() {
  const oscuro = localStorage.getItem("modoOscuro") === "true";
  if (oscuro) document.body.classList.add("modo-oscuro");
}

/**
 * 🌙 Toggle de modo oscuro
 */
function setupModoOscuroToggle() {
  const toggle = document.getElementById("modoToggle");
  if (!toggle) return;

  toggle.addEventListener("click", () => {
    document.body.classList.toggle("modo-oscuro");
    const activo = document.body.classList.contains("modo-oscuro");
    localStorage.setItem("modoOscuro", activo);
    toggle.textContent = activo ? "☀️ Modo Claro" : "🌙 Modo Oscuro";
  });
}

/**
 * 🖼️ Imagen zoom en modal
 */
function setupZoomImagen() {
  document.addEventListener("click", (e) => {
    const img = e.target;
    if (img.tagName === "IMG" && img.dataset.zoom !== undefined) {
      abrirModalImagen(img.src);
    }
  });
}

function abrirModalImagen(src) {
  const modal = document.createElement("div");
  modal.className = "modal-img";
  modal.innerHTML = `
    <span class="cerrar" onclick="this.parentElement.remove()">✖</span>
    <img src="${src}" alt="Zoom imagen" />
  `;
  document.body.appendChild(modal);
}
