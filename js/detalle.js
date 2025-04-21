"use strict";

// ✅ IMPORTAR utilidades
import { registrarVisitaPublica } from "./utils.js";
import { API_BASE } from "./config.js";

document.addEventListener("DOMContentLoaded", () => {
  registrarVisitaPublica();

  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  if (!id || id === "undefined") {
    mostrarError("❌ Producto no encontrado o inválido.");
    return;
  }

  cargarProducto(id);
  activarModoOscuro();
  actualizarCarritoWidget();
});

// === 📦 Cargar producto por ID ===
async function cargarProducto(id) {
  try {
    const res = await fetch(`${API_BASE}/api/products/${id}`);
    const data = await res.json();

    if (!res.ok || !data?.producto) throw new Error("Producto no encontrado");

    renderizarProducto(data.producto);
  } catch (err) {
    console.error("❌ Error cargando producto:", err.message);
    mostrarError("⚠️ No se pudo cargar el producto.");
  }
}

// === 🖼️ Renderizar producto ===
function renderizarProducto(p = {}) {
  const detalle = document.getElementById("detalleProducto");

  const imagen = p.image || p.images?.[0]?.url || "/assets/logo.jpg";
  const nombre = p.name || "Producto sin nombre";
  const descripcion = p.description || "Sin descripción disponible";
  const precio = typeof p.price === "number" ? p.price.toFixed(2) : "0.00";
  const id = p._id || "";

  // 🔍 TALLAS Y STOCK
  let tallasDisponibles = [];
  let maxCantidad = 1;

  // Si hay variantes con stock
  if (Array.isArray(p.variants) && p.variants.length > 0) {
    const variantesConStock = p.variants.filter(v => v.stock > 0);
    tallasDisponibles = [...new Set(variantesConStock.map(v => v.talla?.toUpperCase()))];
    maxCantidad = variantesConStock.reduce((acc, v) => acc + (v.stock || 0), 0);
  } else {
    // No hay variantes, usar la talla principal
    if (Array.isArray(p.sizes) && p.sizes.length > 0) {
      tallasDisponibles = p.sizes.map(t => t.toUpperCase());
    } else if (p.images?.[0]?.talla) {
      tallasDisponibles = [p.images[0].talla.toUpperCase()];
    } else {
      tallasDisponibles = ["Única"];
    }
    maxCantidad = p.stock || 1; // stock de la imagen principal
  }

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
        <p><strong>Categoría:</strong> ${p.category || "-"}</p>
        <p><strong>Subcategoría:</strong> ${p.subcategory || "-"}</p>
        <p><strong>Tipo de talla:</strong> ${p.tallaTipo || "-"}</p>
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
  mostrarToast("✨ ¡Sumado al estilo! Producto agregado al carrito.");
}

// === 🧮 Contador de productos
function actualizarCarritoWidget() {
  const carrito = JSON.parse(localStorage.getItem("km_ez_cart")) || [];
  const total = carrito.reduce((sum, item) => sum + item.cantidad, 0);
  const contador = document.getElementById("cartCount");
  if (contador) contador.textContent = total;
}

// === 🧾 Mensaje emergente
function mostrarToast(mensaje = "✅ Acción realizada") {
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

// === 🧯 Error general
function mostrarError(texto = "❌ Error desconocido") {
  document.getElementById("detalleProducto").innerHTML = `
    <div style="color:red; text-align:center;">
      <h3>${texto}</h3>
      <p>Por favor regresa al catálogo.</p>
      <a href="/categorias.html" class="btn-secundario">🔙 Volver al catálogo</a>
    </div>`;
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

// 🌐 Exponer globalmente
window.agregarAlCarrito = agregarAlCarrito;
