"use strict";

const API_BASE = "https://km-ez-ropa-backend.onrender.com/api/products";
const contenedor = document.getElementById("detalleProducto");

document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  if (!id) {
    contenedor.innerHTML = "<p class='mensaje-error'>❌ Producto no especificado</p>";
    return;
  }

  try {
    const res = await fetch(`${API_BASE}`);
    const productos = await res.json();
    const producto = productos.find(p => p._id === id);

    if (!producto) {
      contenedor.innerHTML = "<p class='mensaje-error'>❌ Producto no encontrado</p>";
      return;
    }

    renderDetalle(producto);
  } catch (err) {
    console.error("❌ Error cargando producto:", err);
    contenedor.innerHTML = "<p class='mensaje-error'>❌ Error al obtener los datos</p>";
  }
});

function renderDetalle(p) {
  const {
    name,
    price,
    category,
    subcategory,
    stock,
    images = [],
    variants = [],
    featured
  } = p;

  const imagenesHtml = images.map(img => `
    <img src="${img.url}" alt="${name}" class="zoomable" style="max-width: 200px; border-radius: 8px;" />
  `).join("");

  const variantesHtml = variants.length > 0 ? variants.map(v => `
    <div class="variante-card">
      <img src="${v.imageUrl}" width="100" />
      <p><strong>Talla:</strong> ${v.talla}</p>
      <p><strong>Color:</strong> ${v.color}</p>
      <p><strong>Stock:</strong> ${v.stock || 0}</p>
    </div>
  `).join("") : "<p>Este producto no tiene variantes.</p>";

  contenedor.innerHTML = `
    <h2>${name}</h2>
    ${featured ? `<span class="destacado-badge">⭐ Producto destacado</span>` : ""}
    <p><strong>Precio:</strong> $${price}</p>
    <p><strong>Categoría:</strong> ${category}</p>
    <p><strong>Subcategoría:</strong> ${subcategory || "N/A"}</p>
    <p><strong>Stock general:</strong> ${stock}</p>
    <h3>📸 Imagen principal</h3>
    <div class="image-preview">${imagenesHtml}</div>
    <h3>🎨 Variantes</h3>
    <div class="variantes-container">${variantesHtml}</div>
  `;
}
