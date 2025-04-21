"use strict";

// ✅ IMPORTAR utilidades
import { registrarVisitaPublica } from "./utils.js";
import { API_BASE } from "./config.js";

document.addEventListener("DOMContentLoaded", () => {
  registrarVisitaPublica();

  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  if (!id || id === "undefined") {
    document.getElementById("detalleProducto").innerHTML = `
      <div style="color:red; text-align:center;">
        <h3>❌ Producto no encontrado o inválido.</h3>
        <p>Por favor regresa al catálogo.</p>
        <a href="/categorias.html" class="btn-secundario">🔙 Volver al catálogo</a>
      </div>`;
    return;
  }

  cargarProducto(id);
  activarModoOscuro();
  actualizarCarritoWidget();
});

// === 📦 Cargar producto por ID ===
async function cargarProducto(id) {
  const detalle = document.getElementById("detalleProducto");

  try {
    const res = await fetch(`${API_BASE}/api/products/${id}`);
    const producto = await res.json();

    if (!res.ok || !producto) throw new Error("Producto no encontrado");
    renderizarProducto(producto);
  } catch (err) {
    console.error("❌ Error cargando producto:", err.message);
    detalle.innerHTML = `
      <div style="color:red; text-align:center;">
        <h3>⚠️ No se pudo cargar el producto.</h3>
        <p>Intenta de nuevo o vuelve al catálogo.</p>
        <a href="/categorias.html" class="btn-secundario">🔙 Volver al catálogo</a>
      </div>`;
  }
}

// === 🖼️ Renderizar producto en pantalla ===
function renderizarProducto(p = {}) {
  const detalle = document.getElementById("detalleProducto");

  const imagen = p.image || p.images?.[0]?.url || "/assets/logo.jpg";
  const nombre = p.name || "Producto sin nombre";
  const descripcion = p.description || "Sin descripción disponible";
  const precio = typeof p.price === "number" ? p.price.toFixed(2) : "0.00";
  const id = p._id || "";

  // 🔄 Calcular stock real total
  const stockTotal = Array.isArray(p.variants)
    ? p.variants.reduce((acc, v) => acc + (v.stock || 0), 0)
    : 0;
  const maxCantidad = Math.max(stockTotal, 1);

  // 👟 Obtener tallas con stock > 0
  const tallasDisponibles = Array.isArray(p.variants)
    ? [...new Set(p.variants.filter(v => v.stock > 0).map(v => v.talla?.toUpperCase()))]
    : [];

  const tallasHTML = tallasDisponibles.length
    ? tallasDisponibles.map(t => `<option value="${t}">${t}</option>`).join("")
    : '<option disabled selected>Sin tallas disponibles</option>';

  detalle.innerHTML = `
    <div class="detalle-img">
      <img src="${imagen}" alt="${nombre}" loading="lazy" onerror="this.src='/assets/logo.jpg'" />
    </div>
    <div class="detalle-info">
      <h2>${nombre}</h2>
      <p>${descripcion}</p>
      <p class="precio">$${precio}</p>

      <div class="detalles-extra">
        <p data-type="categoria">Categoría: ${p.category || "-"}</p>
        <p data-type="subcategoria">Subcategoría: ${p.subcategory || "-"}</p>
        <p data-type="talla">Tipo de talla: ${p.tallaTipo || "-"}</p>
      </div>

      <div class="selectores">
        <label for="tallaSelect">Talla:</label>
        <select id="tallaSelect" required>${tallasHTML}</select>

        <label for="cantidadInput">Cantidad:</label>
        <input type="number" id="cantidadInput" value="1" min="1" max="${maxCantidad}" />
      </div>

      <button class="btn-agregar" onclick="agregarAlCarrito('${id}', \`${nombre}\`, \`${imagen}\`, ${p.price || 0})">
        🛒 Agregar al carrito
      </button>
    </div>
  `;
}

// === 🛒 Agregar al carrito
function agregarAlCarrito(id, nombre, imagen, precio) {
  const talla = document.getElementById("tallaSelect")?.value || "Única";
  const cantidadInput = document.getElementById("cantidadInput");
  const cantidad = parseInt(cantidadInput.value) || 1;
  const max = parseInt(cantidadInput.max) || 1;

  if (cantidad > max) {
    alert(`⚠️ Solo puedes seleccionar hasta ${max} unidad(es).`);
    return;
  }

  const nuevoProducto = {
    id,
    nombre,
    imagen,
    precio,
    talla,
    cantidad
  };

  const carrito = JSON.parse(localStorage.getItem("km_ez_cart")) || [];
  const key = `${id}_${talla}`.toLowerCase();
  const index = carrito.findIndex(p => `${p.id}_${p.talla}`.toLowerCase() === key);

  if (index >= 0) {
    const nuevaCantidad = carrito[index].cantidad + cantidad;
    carrito[index].cantidad = Math.min(nuevaCantidad, max);
  } else {
    carrito.push(nuevoProducto);
  }

  localStorage.setItem("km_ez_cart", JSON.stringify(carrito));
  actualizarCarritoWidget();
  mostrarToast("✅ Producto agregado al carrito");
}

// === 🛒 Contador de productos en el widget
function actualizarCarritoWidget() {
  const carrito = JSON.parse(localStorage.getItem("km_ez_cart")) || [];
  const total = carrito.reduce((sum, item) => sum + item.cantidad, 0);
  const contador = document.getElementById("cartCount");
  if (contador) contador.textContent = total;
}

// === ✅ Toast visual
function mostrarToast(mensaje) {
  const toast = document.createElement("div");
  toast.textContent = mensaje;
  Object.assign(toast.style, {
    position: "fixed",
    bottom: "30px",
    right: "30px",
    background: "#ff6d00",
    color: "#fff",
    padding: "0.8rem 1.2rem",
    borderRadius: "8px",
    fontWeight: "bold",
    boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
    zIndex: "999"
  });
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2500);
}

// === 🌙 Modo oscuro
function activarModoOscuro() {
  if (localStorage.getItem("modoOscuro") === "true") {
    document.body.classList.add("modo-oscuro");
  }

  const toggleBtn = document.getElementById("modoOscuroBtn");
  toggleBtn?.addEventListener("click", () => {
    document.body.classList.toggle("modo-oscuro");
    localStorage.setItem("modoOscuro", document.body.classList.contains("modo-oscuro"));
  });
}

window.agregarAlCarrito = agregarAlCarrito;
