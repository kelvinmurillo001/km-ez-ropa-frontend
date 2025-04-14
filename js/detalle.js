"use strict";
import { capitalizar, actualizarContadorCarrito } from "./utils.js";

const API_BASE = "https://km-ez-ropa-backend.onrender.com/api/products";
const contenedor = document.getElementById("detalleProducto");

document.addEventListener("DOMContentLoaded", () => {
  cargarDetalle();
  actualizarContadorCarrito();
});

// 🔍 Obtener y mostrar detalles del producto
async function cargarDetalle() {
  const id = new URLSearchParams(window.location.search).get("id");
  if (!id || !/^[a-f\d]{24}$/i.test(id)) {
    return mostrarError("❌ ID del producto no proporcionado o inválido.");
  }

  try {
    const res = await fetch(`${API_BASE}/${id}`);
    if (!res.ok) {
      return res.status === 404
        ? mostrarError("🚫 Producto no encontrado o fue eliminado.")
        : mostrarError(`❌ Error del servidor: ${res.status}`);
    }

    const producto = await res.json();
    if (!producto?._id) return mostrarError("❌ Producto no encontrado.");
    renderizarProducto(producto);
  } catch (err) {
    console.error("❌ Error al cargar detalle:", err);
    mostrarError("❌ Ocurrió un error inesperado al cargar el producto.");
  }
}

// 🖼 Renderizar producto
function renderizarProducto(p) {
  const imagenes = [
    ...(p.images || []).map(img => ({ url: img?.url, talla: img?.talla, color: img?.color })),
    ...(p.variants || []).map(v => ({ url: v?.imageUrl, talla: v?.talla, color: v?.color }))
  ].filter(img => img.url);

  const primeraImagen = imagenes[0]?.url || "/assets/logo.jpg";
  const primeraTalla = imagenes[0]?.talla || "";
  const primerColor = imagenes[0]?.color || "";

  const tallasUnicas = [...new Set(imagenes.map(i => i.talla?.toUpperCase()).filter(Boolean))];

  const iconoTalla = {
    bebé: "👶", niño: "🧒", niña: "👧", adulto: "👕"
  }[p.tallaTipo?.toLowerCase()] || "👕";

  contenedor.innerHTML = `
    <div class="detalle-grid">
      <div class="detalle-galeria">
        <div class="detalle-galeria-thumbs">
          ${imagenes.map((img, i) => `
            <img src="${img.url}" alt="Miniatura ${i + 1}" class="${i === 0 ? "active" : ""}"
              onclick="cambiarImagen('${img.url}', this)" onerror="this.src='/assets/logo.jpg'" />
          `).join("")}
        </div>
        <div class="detalle-imagen-principal">
          <img id="imagenPrincipal" src="${primeraImagen}" alt="Imagen principal de ${p.name}" />
          ${primeraTalla || primerColor ? `
            <div class="imagen-info">
              ${primeraTalla ? `<p><strong>Talla:</strong> ${primeraTalla}</p>` : ""}
              ${primerColor ? `<p><strong>Color:</strong> ${primerColor}</p>` : ""}
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
                <div class="talla-opcion ${i === 0 ? "selected" : ""}" onclick="seleccionarTalla(this)" tabindex="0">${t}</div>
              `).join("")
              : "<span>No hay tallas disponibles</span>"}
          </div>
        </div>

        <div class="contador">
          <button onclick="ajustarCantidad(-1)" aria-label="Disminuir cantidad">-</button>
          <span id="cantidad">1</span>
          <button onclick="ajustarCantidad(1)" aria-label="Aumentar cantidad">+</button>
        </div>

        <button class="btn-comprar" onclick="agregarAlCarrito('${p._id}', '${p.name}', '${p.price}', '${primeraImagen}')">
          🛒 Añadir al carrito
        </button>
      </div>
    </div>
  `;
}

// 🖼 Cambiar imagen principal
window.cambiarImagen = (url, thumb) => {
  const principal = document.getElementById("imagenPrincipal");
  principal.src = url;
  document.querySelectorAll(".detalle-galeria-thumbs img").forEach(img => img.classList.remove("active"));
  thumb.classList.add("active");
};

// 👕 Seleccionar talla
window.seleccionarTalla = (elem) => {
  document.querySelectorAll(".talla-opcion").forEach(btn => btn.classList.remove("selected"));
  elem.classList.add("selected");
};

// 🔢 Ajustar cantidad
window.ajustarCantidad = (delta) => {
  const cantidadElem = document.getElementById("cantidad");
  let cantidad = parseInt(cantidadElem.textContent);
  cantidadElem.textContent = Math.max(1, cantidad + delta);
};

// 🛒 Añadir al carrito
window.agregarAlCarrito = (id, nombre, precio, imagen) => {
  const talla = document.querySelector(".talla-opcion.selected")?.textContent;
  const cantidad = parseInt(document.getElementById("cantidad").textContent);
  if (!talla) return alert("⚠️ Por favor, selecciona una talla.");

  const carrito = JSON.parse(localStorage.getItem("carrito") || "[]");
  const index = carrito.findIndex(item => item.id === id && item.talla === talla);

  if (index !== -1) {
    carrito[index].cantidad += cantidad;
  } else {
    carrito.push({ id, nombre, precio: parseFloat(precio), imagen, talla, cantidad, agregado: new Date().toISOString() });
  }

  localStorage.setItem("carrito", JSON.stringify(carrito));
  actualizarContadorCarrito();

  if (confirm("✅ Producto añadido al carrito.\n¿Deseas ir al carrito ahora?")) {
    window.location.href = "carrito.html";
  }
};

// ❌ Mostrar mensaje de error
function mostrarError(msg) {
  contenedor.innerHTML = `<p class="error fade-in">${msg}</p>`;
}
