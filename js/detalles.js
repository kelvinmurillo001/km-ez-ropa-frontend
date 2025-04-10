"use strict";

const API_BASE = "https://km-ez-ropa-backend.onrender.com/api/products";

document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const productId = params.get("id");

  if (!productId) {
    document.getElementById("detalleProducto").innerHTML = "<p>❌ Producto no especificado.</p>";
    return;
  }

  cargarDetalle(productId);
});

/* 🔍 Cargar y mostrar producto */
async function cargarDetalle(id) {
  try {
    const res = await fetch(`${API_BASE}`);
    const productos = await res.json();
    const producto = productos.find(p => p._id === id);

    if (!producto) {
      document.getElementById("detalleProducto").innerHTML = "<p>❌ Producto no encontrado.</p>";
      return;
    }

    const {
      name,
      price,
      category,
      subcategory,
      stock,
      featured,
      images = [],
      variants = []
    } = producto;

    const imagenesHtml = images.map(img => `
      <img src="${img.url}" alt="${name}" class="zoomable" style="max-width: 220px; border-radius: 10px;"/>
    `).join("");

    const variantesHtml = variants.map(v => `
      <div style="margin: 10px 0;">
        <p><strong>${v.talla.toUpperCase()} - ${v.color}</strong></p>
        <img src="${v.imageUrl}" alt="variante" width="100" style="border-radius: 8px;" />
      </div>
    `).join("");

    document.getElementById("detalleProducto").innerHTML = `
      <h1>${name}</h1>
      ${featured ? `<p><span class="badge">⭐ Producto Destacado</span></p>` : ""}
      <p><strong>Precio:</strong> $${price}</p>
      <p><strong>Categoría:</strong> ${category}</p>
      <p><strong>Subcategoría:</strong> ${subcategory}</p>
      <p><strong>Stock:</strong> ${stock <= 0 ? "❌ Agotado" : stock}</p>

      <h3>🖼️ Imágenes Principales</h3>
      <div style="display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 1rem;">
        ${imagenesHtml || "No hay imágenes disponibles"}
      </div>

      ${variantesHtml ? `<h3>🎨 Variantes</h3><div>${variantesHtml}</div>` : ""}
    `;
  } catch (error) {
    console.error("❌ Error cargando detalle:", error);
    document.getElementById("detalleProducto").innerHTML = "<p>❌ Error al obtener información.</p>";
  }
}
