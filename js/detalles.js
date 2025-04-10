"use strict";

const API_BASE = "https://km-ez-ropa-backend.onrender.com/api/products";
const params = new URLSearchParams(window.location.search);
const id = params.get("id");

document.addEventListener("DOMContentLoaded", async () => {
  if (!id) return document.getElementById("detalleProducto").innerHTML = "<p>❌ Producto no especificado</p>";

  try {
    const res = await fetch(`${API_BASE}`);
    const productos = await res.json();
    const producto = productos.find(p => p._id === id);

    if (!producto) throw new Error("No se encontró el producto");

    document.getElementById("nombreProducto").textContent = producto.name;

    const imagenesHtml = producto.images.map(img => `<img src="${img.url}" alt="Imagen" style="width:200px; margin:8px;" />`).join("");
    const variantesHtml = producto.variants.map(v => `
      <div style="margin-top:12px">
        <p><strong>${v.talla.toUpperCase()}</strong> - ${v.color}</p>
        <img src="${v.imageUrl}" alt="Variante" style="width:120px;" />
      </div>
    `).join("");

    document.getElementById("detalleProducto").innerHTML = `
      <p><strong>Precio:</strong> $${producto.price}</p>
      <p><strong>Categoría:</strong> ${producto.category}</p>
      <p><strong>Subcategoría:</strong> ${producto.subcategory}</p>
      <p><strong>Stock:</strong> ${producto.stock}</p>
      <p><strong>Destacado:</strong> ${producto.featured ? "✅" : "❌"}</p>
      <h3>🖼️ Imágenes principales</h3>
      <div>${imagenesHtml}</div>
      <h3>🧩 Variantes</h3>
      <div>${variantesHtml || "No hay variantes"}</div>
    `;

  } catch (err) {
    console.error("❌ Error cargando detalle:", err);
    document.getElementById("detalleProducto").innerHTML = "<p>❌ Error cargando producto</p>";
  }
});
