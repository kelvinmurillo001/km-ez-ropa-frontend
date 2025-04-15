// === IMPORTAR DE utils.js SI ESTÁS USANDO MÓDULOS ===
// import { addToCart, actualizarCarritoWidget } from './utils.js';

document.addEventListener("DOMContentLoaded", () => {
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

// === CARGAR PRODUCTO POR ID ===
async function cargarProducto(id) {
  try {
    const res = await fetch(`/api/products/${id}`);
    const producto = await res.json();
    if (!res.ok || !producto) throw new Error("Producto no encontrado");

    renderizarProducto(producto);
  } catch (err) {
    console.error(err);
    document.getElementById("detalleProducto").innerHTML = "<p style='color:red;'>⚠️ Error al cargar el producto.</p>";
  }
}

// === MOSTRAR PRODUCTO EN PANTALLA ===
function renderizarProducto(p) {
  const detalle = document.getElementById("detalleProducto");
  detalle.innerHTML = `
    <div class="detalle-img">
      <img src="${p.image}" alt="${p.name}" />
    </div>
    <div class="detalle-info">
      <h2>${p.name}</h2>
      <p>${p.description}</p>
      <p class="precio">$${p.price.toFixed(2)}</p>

      <div class="selectores">
        <label for="tallaSelect">Talla:</label>
        <select id="tallaSelect" required>
          ${p.sizes?.length ? p.sizes.map(t => `<option value="${t}">${t}</option>`).join('') : '<option value="Única">Única</option>'}
        </select>

        <label for="cantidadInput">Cantidad:</label>
        <input type="number" id="cantidadInput" value="1" min="1" max="10" />
      </div>

      <button class="btn-agregar" onclick="agregarAlCarrito('${p._id}', '${p.name}', '${p.image}', ${p.price})">
        🛒 Agregar al carrito
      </button>
    </div>
  `;
}

// === AGREGAR AL CARRITO ===
function agregarAlCarrito(id, nombre, imagen, precio) {
  const talla = document.getElementById("tallaSelect")?.value || "Única";
  const cantidad = parseInt(document.getElementById("cantidadInput")?.value) || 1;

  const producto = {
    id,
    name: nombre,
    image: imagen,
    price: precio,
    size: talla,
    quantity: cantidad
  };

  const carrito = JSON.parse(localStorage.getItem("km_ez_cart")) || [];

  const index = carrito.findIndex(p => p.id === id && p.size === talla);
  if (index >= 0) {
    carrito[index].quantity += cantidad;
  } else {
    carrito.push(producto);
  }

  localStorage.setItem("km_ez_cart", JSON.stringify(carrito));
  actualizarCarritoWidget();
  mostrarToast("✅ Producto agregado al carrito");
}

// === CONTADOR DE CARRITO ===
function actualizarCarritoWidget() {
  const carrito = JSON.parse(localStorage.getItem("km_ez_cart")) || [];
  const total = carrito.reduce((sum, item) => sum + item.quantity, 0);
  const contador = document.getElementById("cartCount");
  if (contador) contador.textContent = total;
}

// === TOAST MENSAJE ===
function mostrarToast(mensaje) {
  const toast = document.createElement("div");
  toast.textContent = mensaje;
  toast.style.position = "fixed";
  toast.style.bottom = "30px";
  toast.style.right = "30px";
  toast.style.background = "#ff6d00";
  toast.style.color = "#fff";
  toast.style.padding = "0.8rem 1.2rem";
  toast.style.borderRadius = "8px";
  toast.style.fontWeight = "bold";
  toast.style.boxShadow = "0 4px 12px rgba(0,0,0,0.2)";
  toast.style.zIndex = "999";
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2500);
}

// === MODO OSCURO ===
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
