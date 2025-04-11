"use strict";

const API_BASE = "https://km-ez-ropa-backend.onrender.com/api/products";
const contenedor = document.getElementById("detalleProducto");

document.addEventListener("DOMContentLoaded", cargarDetalle);

async function cargarDetalle() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  if (!id) return mostrarError("❌ ID no proporcionado");

  try {
    const res = await fetch(API_BASE);
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
  const tallasUnicas = [...new Set(p.variants.map(v => v.talla.toUpperCase()))];

  const miniaturas = p.images.map((img, i) => `
    <img src="${img.url}" alt="Vista ${i + 1}" class="${i === 0 ? "active" : ""}" onclick="cambiarImagen('${img.url}', this)" />
  `).join("");

  const tallasHtml = tallasUnicas.length
    ? tallasUnicas.map(t => `<button onclick="seleccionarTalla(this)">${t}</button>`).join("")
    : "<p>No hay tallas disponibles</p>";

  const variantesHtml = p.variants?.length
    ? p.variants.map(v => `
        <div class="variante">
          <img src="${v.imageUrl}" alt="${v.color}" />
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

    <div class="detalle-galeria">
      <img src="${p.images[0]?.url}" alt="Principal" class="galeria-principal" id="imagenPrincipal" />
      <div class="galeria-miniaturas">${miniaturas}</div>
    </div>

    <div class="selector-tallas">${tallasHtml}</div>

    <button class="guia-tallas-btn" onclick="mostrarGuiaTallas()">📏 Guía de Tallas</button>

    <div class="detalle-variantes">
      <h3>🧩 Variantes</h3>
      <div class="variantes-grid">${variantesHtml}</div>
    </div>

    <!-- 🧵 Modal Guía -->
    <div id="modalTallas" class="modal-tallas" style="display: none;">
      <div class="modal-contenido">
        <span class="cerrar-modal" onclick="cerrarGuiaTallas()">✖</span>
        <h2>📐 Guía de Tallas</h2>
        <table class="tabla-tallas">
          <thead>
            <tr><th>Talla</th><th>Busto</th><th>Cintura</th><th>Cadera</th></tr>
          </thead>
          <tbody>
            <tr><td>XS</td><td>76-80 cm</td><td>60-64 cm</td><td>84-88 cm</td></tr>
            <tr><td>S</td><td>81-85 cm</td><td>65-69 cm</td><td>89-93 cm</td></tr>
            <tr><td>M</td><td>86-90 cm</td><td>70-74 cm</td><td>94-98 cm</td></tr>
            <tr><td>L</td><td>91-96 cm</td><td>75-80 cm</td><td>99-104 cm</td></tr>
            <tr><td>XL</td><td>97-102 cm</td><td>81-86 cm</td><td>105-110 cm</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `;
}

/* 🔁 Cambiar imagen */
window.cambiarImagen = (src, miniatura) => {
  const imagenPrincipal = document.getElementById("imagenPrincipal");
  imagenPrincipal.src = src;

  document.querySelectorAll(".galeria-miniaturas img").forEach(img => img.classList.remove("active"));
  miniatura.classList.add("active");
};

/* 🟧 Seleccionar talla */
window.seleccionarTalla = (btn) => {
  document.querySelectorAll(".selector-tallas button").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
};

/* 📏 Mostrar/Cerrar guía */
window.mostrarGuiaTallas = () => {
  document.getElementById("modalTallas").style.display = "flex";
};
window.cerrarGuiaTallas = () => {
  document.getElementById("modalTallas").style.display = "none";
};

/* ❌ Error */
function mostrarError(msg) {
  contenedor.innerHTML = `<p class="error fade-in">${msg}</p>`;
}
