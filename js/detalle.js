"use strict";

const API_BASE = "https://km-ez-ropa-backend.onrender.com/api/products";
const contenedor = document.getElementById("detalleProducto");

document.addEventListener("DOMContentLoaded", cargarDetalle);

// 🔍 Cargar detalle de producto
async function cargarDetalle() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  if (!id || !/^[a-f\d]{24}$/i.test(id)) {
    return mostrarError("❌ ID del producto no proporcionado o inválido.");
  }

  try {
    const res = await fetch(`${API_BASE}/${id}`);
    if (res.status === 404) return mostrarError("🚫 Producto no encontrado o fue eliminado.");
    if (!res.ok) throw new Error(`Error del servidor: ${res.status}`);

    const producto = await res.json();
    if (!producto || !producto._id) return mostrarError("❌ Producto no encontrado.");

    renderizarProducto(producto);
  } catch (error) {
    console.error("❌ Error al cargar detalle:", error);
    mostrarError("❌ Ocurrió un error inesperado al cargar el producto.");
  }
}

// 🎨 Renderizar producto
function renderizarProducto(p) {
  const imagenes = [
    ...(Array.isArray(p.images) ? p.images.map(img => ({
      url: img?.url,
      talla: img?.talla,
      color: img?.color
    })) : []),
    ...(Array.isArray(p.variants) ? p.variants.map(v => ({
      url: v?.imageUrl,
      talla: v?.talla,
      color: v?.color
    })) : [])
  ].filter(img => img.url); // eliminar nulos

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
              onclick="cambiarImagen('${img.url}', this)" 
              onerror="this.src='/assets/logo.jpg'" 
              aria-label="Ver imagen de variante ${i + 1}" />
          `).join("")}
        </div>
        <div class="detalle-imagen-principal">
          <img id="imagenPrincipal" src="${primeraImagen}" alt="Imagen principal de ${p.name}" onerror="this.src='/assets/logo.jpg'" />
          ${(primeraTalla || primerColor) ? `
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

        <div class="guia-info">
          <h4>📏 Guía de Tallas</h4>
          <table>
            <thead><tr><th>Talla</th><th>Busto</th><th>Cintura</th><th>Cadera</th></tr></thead>
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

// 🖼 Cambiar imagen
function cambiarImagen(url, thumb) {
  const principal = document.getElementById("imagenPrincipal");
  principal.src = url;
  document.querySelectorAll(".detalle-galeria-thumbs img").forEach(img => img.classList.remove("active"));
  thumb.classList.add("active");
}

// 👕 Seleccionar talla
function seleccionarTalla(elem) {
  document.querySelectorAll(".talla-opcion").forEach(btn => btn.classList.remove("selected"));
  elem.classList.add("selected");
}

// 🔢 Ajustar cantidad
function ajustarCantidad(delta) {
  const cantidadElem = document.getElementById("cantidad");
  let cantidad = parseInt(cantidadElem.textContent);
  cantidad = Math.max(1, cantidad + delta);
  cantidadElem.textContent = cantidad;
}

// 🛒 Añadir al carrito
function agregarAlCarrito(id, nombre, precio, imagen) {
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
  alert("✅ Producto añadido al carrito.");
}

// ❌ Mostrar error
function mostrarError(msg) {
  contenedor.innerHTML = `<p class="error fade-in">${msg}</p>`;
}

// 🔤 Capitalizar
function capitalizar(str) {
  return typeof str === "string" ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : str;
}
