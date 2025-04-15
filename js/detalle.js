"use strict";

import { capitalizar, actualizarContadorCarrito } from "./utils.js";

const API_BASE = "https://km-ez-ropa-backend.onrender.com/api/products";
const contenedor = document.getElementById("detalleProducto");

document.addEventListener("DOMContentLoaded", () => {
  cargarDetalle();
  actualizarContadorCarrito();
});

async function cargarDetalle() {
  const id = new URLSearchParams(window.location.search).get("id");

  if (!id || !/^[a-f\d]{24}$/i.test(id)) {
    return mostrarError("❌ ID del producto no proporcionado o inválido.");
  }

  try {
    const res = await fetch(`${API_BASE}/${id}`);
    if (res.status === 404) return mostrarError("🚫 Producto no encontrado o fue eliminado.");
    if (!res.ok) throw new Error(`Error del servidor: ${res.status}`);

    const producto = await res.json();
    if (!producto?._id) return mostrarError("❌ Producto no encontrado.");

    renderizarProducto(producto);
  } catch (err) {
    console.error("❌ Error al cargar detalle:", err);
    mostrarError("❌ Ocurrió un error inesperado al cargar el producto.");
  }
}

function renderizarProducto(p) {
  const imagenes = [
    ...(p.images || []).map(img => ({ url: img?.url, talla: img?.talla, color: img?.color })),
    ...(p.variants || []).map(v => ({ url: v?.imageUrl, talla: v?.talla, color: v?.color }))
  ].filter(img => img.url);

  const primera = imagenes[0] || {};
  const tallasUnicas = [...new Set(imagenes.map(i => i.talla?.toUpperCase()).filter(Boolean))];
  const iconoTalla = { bebé: "👶", niño: "🧒", niña: "👧", adulto: "👕" }[p.tallaTipo?.toLowerCase()] || "👕";

  contenedor.innerHTML = `
    <div class="detalle-grid">
      <div class="detalle-galeria">
        <div class="detalle-galeria-thumbs">
          ${imagenes.map((img, i) => `
            <img src="${img.url}" alt="Miniatura ${i + 1}" 
              class="${i === 0 ? "active" : ""}" 
              data-url="${img.url}" tabindex="0"
              onerror="this.src='/assets/logo.jpg'" />
          `).join("")}
        </div>
        <div class="detalle-imagen-principal">
          <img id="imagenPrincipal" src="${primera.url || "/assets/logo.jpg"}" alt="Imagen principal de ${p.name}" />
          ${(primera.talla || primera.color) ? `
            <div class="imagen-info">
              ${primera.talla ? `<p><strong>Talla:</strong> ${primera.talla}</p>` : ""}
              ${primera.color ? `<p><strong>Color:</strong> ${primera.color}</p>` : ""}
            </div>` : ""}
        </div>
      </div>

      <div class="detalle-info">
        <h1>${p.name || "Producto sin nombre"}</h1>
        <p><strong>Precio:</strong> $${parseFloat(p.price || 0).toFixed(2)}</p>
        <p><strong>Categoría:</strong> ${capitalizar(p.category)}</p>
        <p><strong>Subcategoría:</strong> ${capitalizar(p.subcategory || "N/A")}</p>
        ${p.tallaTipo ? `<p><strong>Tipo de talla:</strong> ${iconoTalla} ${capitalizar(p.tallaTipo)}</p>` : ""}
        <p><strong>Stock general:</strong> ${p.stock ?? "N/A"}</p>

        <div class="guia-tallas">
          <p><strong>Selecciona Talla:</strong></p>
          <div class="tallas-disponibles">
            ${tallasUnicas.length
              ? tallasUnicas.map((t, i) => `
                <div class="talla-opcion ${i === 0 ? "selected" : ""}" tabindex="0" role="button">${t}</div>
              `).join("")
              : "<span>No hay tallas disponibles</span>"}
          </div>
        </div>

        <div class="contador">
          <button type="button" id="menos" aria-label="Disminuir cantidad">-</button>
          <span id="cantidad">1</span>
          <button type="button" id="mas" aria-label="Aumentar cantidad">+</button>
        </div>

        <button class="btn-comprar" id="agregarCarrito">
          🛒 Añadir al carrito
        </button>
      </div>
    </div>
  `;

  activarInteracciones(p);
}

function activarInteracciones(p) {
  // Cambio de imagen
  document.querySelectorAll(".detalle-galeria-thumbs img").forEach(img =>
    img.addEventListener("click", () => cambiarImagen(img.dataset.url, img))
  );

  // Selección de talla
  document.querySelectorAll(".talla-opcion").forEach(talla =>
    talla.addEventListener("click", () => seleccionarTalla(talla))
  );

  // Contador
  document.getElementById("menos")?.addEventListener("click", () => ajustarCantidad(-1));
  document.getElementById("mas")?.addEventListener("click", () => ajustarCantidad(1));

  // Agregar al carrito
  document.getElementById("agregarCarrito")?.addEventListener("click", () => {
    const talla = document.querySelector(".talla-opcion.selected")?.textContent;
    const cantidad = parseInt(document.getElementById("cantidad")?.textContent || "1");

    if (!talla) return alert("⚠️ Por favor, selecciona una talla.");

    const item = {
      id: p._id,
      nombre: p.name,
      precio: parseFloat(p.price),
      imagen: p.images?.[0]?.url || "/assets/logo.jpg",
      talla,
      cantidad,
      agregado: new Date().toISOString()
    };

    const carrito = JSON.parse(localStorage.getItem("carrito") || "[]");
    const index = carrito.findIndex(i => i.id === item.id && i.talla === item.talla);

    if (index !== -1) {
      carrito[index].cantidad += cantidad;
    } else {
      carrito.push(item);
    }

    localStorage.setItem("carrito", JSON.stringify(carrito));
    actualizarContadorCarrito();

    if (confirm("✅ Producto añadido al carrito.\n¿Ir al carrito ahora?")) {
      window.location.href = "carrito.html";
    }
  });
}

// 🔄 Utilidades visuales
function cambiarImagen(url, thumb) {
  const principal = document.getElementById("imagenPrincipal");
  if (principal) principal.src = url;

  document.querySelectorAll(".detalle-galeria-thumbs img")
    .forEach(img => img.classList.remove("active"));
  thumb.classList.add("active");
}

function seleccionarTalla(elem) {
  document.querySelectorAll(".talla-opcion")
    .forEach(e => e.classList.remove("selected"));
  elem.classList.add("selected");
}

function ajustarCantidad(delta) {
  const el = document.getElementById("cantidad");
  let cantidad = parseInt(el.textContent);
  cantidad = Math.max(1, cantidad + delta);
  el.textContent = cantidad;
}

function mostrarError(msg) {
  contenedor.innerHTML = `<p class="error fade-in">${msg}</p>`;
}
