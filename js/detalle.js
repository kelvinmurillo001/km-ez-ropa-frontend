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
  const tallasDisponibles = [...new Set(p.variants?.map(v => v.talla?.toUpperCase()))];
  const imagenes = [
    ...(p.images || []),
    ...(p.variants?.map(v => ({ url: v.imageUrl })) || [])
  ];
  const primeraImagen = imagenes[0]?.url || "";

  const iconoTalla = p.tallaTipo === "bebé"
    ? "👶"
    : p.tallaTipo === "niño"
    ? "🧒"
    : "👕";

  contenedor.innerHTML = `
    <div class="detalle-grid">
      <div class="detalle-galeria">
        <div class="detalle-galeria-thumbs">
          ${imagenes.map((img, i) => `
            <img src="${img.url}" class="${i === 0 ? 'active' : ''}" onclick="cambiarImagen('${img.url}', this)" />
          `).join("")}
        </div>
        <div class="detalle-imagen-principal">
          <img id="imagenPrincipal" src="${primeraImagen}" alt="${p.name}" />
        </div>
      </div>

      <div class="detalle-info">
        <h1>${p.name}</h1>
        <p><strong>Precio:</strong> $${p.price}</p>
        <p><strong>Categoría:</strong> ${p.category}</p>
        <p><strong>Subcategoría:</strong> ${p.subcategory}</p>
        ${p.tallaTipo ? `<p><strong>Tipo de talla:</strong> ${iconoTalla} ${capitalizar(p.tallaTipo)}</p>` : ""}
        <p><strong>Stock general:</strong> ${p.stock}</p>

        <div class="guia-tallas">
          <p><strong>Selecciona Talla:</strong></p>
          <div class="tallas-disponibles">
            ${tallasDisponibles.length > 0 ? tallasDisponibles.map((talla, i) => `
              <div class="talla-opcion ${i === 0 ? 'selected' : ''}" onclick="seleccionarTalla(this)">${talla}</div>
            `).join("") : "<span>No hay tallas disponibles</span>"}
          </div>
        </div>

        <div class="contador">
          <button onclick="ajustarCantidad(-1)">-</button>
          <span id="cantidad">1</span>
          <button onclick="ajustarCantidad(1)">+</button>
        </div>

        <button class="btn-comprar" onclick="agregarAlCarrito('${p._id}')">🛒 Añadir al carrito</button>

        <div class="guia-info">
          <h4>📏 Guía de Tallas</h4>
          <table>
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
    </div>
  `;
}

function cambiarImagen(url, thumb) {
  document.getElementById("imagenPrincipal").src = url;
  document.querySelectorAll(".detalle-galeria-thumbs img").forEach(img =>
    img.classList.remove("active")
  );
  thumb.classList.add("active");
}

function seleccionarTalla(elem) {
  document.querySelectorAll(".talla-opcion").forEach(btn =>
    btn.classList.remove("selected")
  );
  elem.classList.add("selected");
}

function ajustarCantidad(delta) {
  const cantidadElem = document.getElementById("cantidad");
  let cantidad = parseInt(cantidadElem.textContent);
  cantidad = Math.max(1, cantidad + delta);
  cantidadElem.textContent = cantidad;
}

function agregarAlCarrito(productId) {
  const talla = document.querySelector(".talla-opcion.selected")?.textContent || "Sin talla";
  const cantidad = parseInt(document.getElementById("cantidad").textContent);

  alert(`✅ Producto agregado\nID: ${productId}\nTalla: ${talla}\nCantidad: ${cantidad}`);
  // Aquí puedes usar localStorage o una API para guardar el carrito
}

function mostrarError(msg) {
  contenedor.innerHTML = `<p class="error fade-in">${msg}</p>`;
}

function capitalizar(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
