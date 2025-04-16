"use strict";

// ✅ IMPORTAR utilidades
import { registrarVisitaPublica } from "./utils.js";
import { API_BASE } from "./config.js";

document.addEventListener("DOMContentLoaded", () => {
  registrarVisitaPublica(); // 📊 Registrar visita

  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  if (!id) {
    document.getElementById("detalleProducto").innerHTML = "<p style='color:red;'>❌ Producto no encontrado.</p>";
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
    detalle.innerHTML = "<p style='color:red;'>⚠️ No se pudo cargar el producto.</p>";
  }
}

// === 🖼️ Renderizar producto en pantalla ===
function renderizarProducto(p) {
  const detalle = document.getElementById("detalleProducto");

  const imagen = p.image || p.images?.[0]?.url || "/assets/logo.jpg";
  const nombre = p.name || "Producto sin nombre";
  const descripcion = p.description || "Sin descripción disponible";
  const precio = typeof p.price === "number" ? p.price.toFixed(2) : "0.00";
  const id = p._id || "";

  detalle.innerHTML = `
    <div class="detalle-img">
      <img src="${imagen}" alt="${nombre}" onerror="this.src='/assets/logo.jpg'" />
    </div>
    <div class="detalle-info">
      <h2>${nombre}</h2>
      <p>${descripcion}</p>
      <p class="precio">$${precio}</p>

      <div class="selectores">
        <label for="tallaSelect">Talla:</label>
        <select id="tallaSelect" required>
          ${p.sizes?.length ? p.sizes.map(t => `<option value="${t}">${t}</option>`).join("") : '<option value="Única">Única</option>'}
        </select>

        <label for="cantidadInput">Cantidad:</label>
        <input type="number" id="cantidadInput" value="1" min="1" max="10" />
      </div>

      <button class="btn-agregar" onclick="agregarAlCarrito('${id}', \`${nombre}\`, \`${imagen}\`, ${p.price})">
        🛒 Agregar al carrito
      </button>
    </div>
  `;
}

// === 🛒 Agregar producto al carrito ===
function agregarAlCarrito(id, nombre, imagen, precio) {
  const talla = document.getElementById("tallaSelect")?.value || "Única";
  const cantidad = parseInt(document.getElementById("cantidadInput")?.value) || 1;

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
    carrito[index].cantidad += cantidad;
  } else {
    carrito.push(nuevoProducto);
  }

  localStorage.setItem("km_ez_cart", JSON.stringify(carrito));
  actualizarCarritoWidget();
  mostrarToast("✅ Producto agregado al carrito");
}

// === 🧮 Actualizar cantidad en widget ===
function actualizarCarritoWidget() {
  const carrito = JSON.parse(localStorage.getItem("km_ez_cart")) || [];
  const total = carrito.reduce((sum, item) => sum + item.cantidad, 0);
  const contador = document.getElementById("cartCount");
  if (contador) contador.textContent = total;
}

// === ✅ Mensaje visual temporal ===
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

// === 🌙 Modo oscuro ===
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
