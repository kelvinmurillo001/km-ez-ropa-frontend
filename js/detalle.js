"use strict";

const API_BASE = "https://km-ez-ropa-backend.onrender.com/api/products";
const contenedor = document.getElementById("detalleProducto");

document.addEventListener("DOMContentLoaded", cargarDetalle);

async function cargarDetalle() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  if (!id) return mostrarError("❌ ID no proporcionado");

  try {
    const res = await fetch(`${API_BASE}`);
    const productos = await res.json();
    const producto = productos.find(p => p._id === id);

    if (!producto) return mostrarError("❌ Producto no encontrado");

    renderizarProducto(producto);
  } catch (error) {
    console.error("❌ Error:", error);
    mostrarError("❌ Error al cargar detalle");
  }
}

function renderizarProducto(p) {
  const variantesHtml = p.variants?.length
    ? p.variants.map(v => `
      <div class="variante">
        <img src="${v.imageUrl}" alt="${v.color}" class="zoom-img" />
        <p><strong>Talla:</strong> ${v.talla}</p>
        <p><strong>Color:</strong> ${v.color}</p>
        <p><strong>Stock:</strong> ${v.stock}</p>
      </div>`).join("")
    : "<p>Este producto no tiene variantes.</p>";

  contenedor.innerHTML = `
    <div class="detalle-info">
      <h1>${p.name}</h1>
      <p><strong>Precio:</strong> $${p.price}</p>
      <p><strong>Categoría:</strong> ${p.category}</p>
      <p><strong>Subcategoría:</strong> ${p.subcategory}</p>
      <p><strong>Stock general:</strong> ${p.stock}</p>
    </div>

    <div class="detalle-imagen-principal">
      <h3>📸 Imagen principal</h3>
      <img src="${p.images?.[0]?.url}" alt="Producto" class="zoom-img principal" />
    </div>

    <div class="detalle-variantes">
      <h3>🧩 Variantes</h3>
      <div class="variantes-grid">${variantesHtml}</div>
    </div>
  `;
}

function mostrarError(msg) {
  contenedor.innerHTML = `<p class="error fade-in">${msg}</p>`;
}
