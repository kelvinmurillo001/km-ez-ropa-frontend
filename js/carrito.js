"use strict";

// 📦 DOM Elements
const carritoItems = document.getElementById("carritoItems");
const carritoTotal = document.getElementById("carritoTotal");
const btnIrCheckout = document.getElementById("btnIrCheckout");
const btnVaciarCarrito = document.getElementById("btnVaciarCarrito");

// 🔐 LocalStorage Key
const STORAGE_KEY = "km_ez_cart";
let carrito = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

// ▶️ On Load
document.addEventListener("DOMContentLoaded", () => {
  limpiarItemsInvalidos();
  renderizarCarrito();
  btnIrCheckout?.addEventListener("click", irACheckout);
  btnVaciarCarrito?.addEventListener("click", vaciarCarrito);
});

// 🔍 Sanitiza texto
function sanitizeText(str) {
  const temp = document.createElement("div");
  temp.textContent = str;
  return temp.innerHTML;
}

// 🔍 Sanitiza URLs
function sanitizeURL(url) {
  try {
    return new URL(url, window.location.origin).href;
  } catch {
    return "/assets/logo.jpg";
  }
}

// 💾 Guardar carrito
function guardarCarrito() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(carrito));
}

// 🧹 Filtra productos corruptos
function limpiarItemsInvalidos() {
  carrito = carrito.filter(item =>
    item &&
    typeof item.nombre === "string" &&
    typeof item.precio === "number" &&
    typeof item.cantidad === "number" &&
    !isNaN(item.precio) &&
    !isNaN(item.cantidad)
  );
  guardarCarrito();
}

// 💰 Calcula total
function actualizarTotal() {
  const total = carrito.reduce((acc, item) =>
    acc + (item.precio || 0) * (item.cantidad || 0), 0);

  carritoTotal.textContent = `$${total.toFixed(2)}`;
  btnIrCheckout.disabled = carrito.length === 0;
  btnVaciarCarrito.disabled = carrito.length === 0;
}

// 🛍️ Renderiza visualmente el carrito
function renderizarCarrito() {
  if (!carrito.length) {
    carritoItems.innerHTML = `
      <div class="text-center fade-in">
        <p>🛍️ Tu carrito está vacío. <a href='/categorias.html'>Explora nuestras categorías</a>.</p>
      </div>`;
    carritoTotal.textContent = "$0.00";
    btnIrCheckout.disabled = true;
    btnVaciarCarrito.disabled = true;
    return;
  }

  carritoItems.innerHTML = "";

  carrito.forEach((item, index) => {
    const imagen = sanitizeURL(item.imagen || "/assets/logo.jpg");
    const nombre = sanitizeText(item.nombre || "Producto");
    const talla = sanitizeText(item.talla || "Única");
    const precio = isNaN(item.precio) ? 0 : item.precio;
    const cantidad = Math.max(1, Math.min(100, isNaN(item.cantidad) ? 1 : item.cantidad));
    const subtotal = (precio * cantidad).toFixed(2);

    const div = document.createElement("div");
    div.className = "carrito-item fade-in";
    div.setAttribute("role", "group");
    div.setAttribute("aria-label", `Producto ${nombre}`);

    div.innerHTML = `
      <img src="${imagen}" alt="${nombre}" class="carrito-img" />
      <div class="carrito-detalles">
        <h4>${nombre}</h4>
        <p><strong>Talla:</strong> ${talla}</p>
        <p><strong>Precio:</strong> $${precio.toFixed(2)}</p>
        <div class="carrito-cantidad">
          <label for="cantidad_${index}">Cantidad:</label>
          <input type="number" id="cantidad_${index}" min="1" max="100" value="${cantidad}" data-index="${index}" />
        </div>
        <p><strong>Subtotal:</strong> $${subtotal}</p>
        <button class="btn-eliminar" data-index="${index}" aria-label="Eliminar ${nombre}">🗑️ Eliminar</button>
      </div>
    `;
    carritoItems.appendChild(div);
  });

  actualizarTotal();
  agregarListeners();
}

// 🧠 Escucha eventos de cantidad o eliminar
function agregarListeners() {
  document.querySelectorAll(".carrito-cantidad input").forEach(input => {
    input.addEventListener("change", e => {
      const i = parseInt(e.target.dataset.index);
      const nuevaCantidad = Math.max(1, Math.min(100, parseInt(e.target.value) || 1));
      if (!isNaN(i) && carrito[i]) {
        carrito[i].cantidad = nuevaCantidad;
        guardarCarrito();
        renderizarCarrito();
      }
    });
  });

  document.querySelectorAll(".btn-eliminar").forEach(btn => {
    btn.addEventListener("click", e => {
      const i = parseInt(e.target.dataset.index);
      if (!isNaN(i) && carrito[i]) {
        const confirmar = confirm(`❌ ¿Eliminar "${carrito[i].nombre}" del carrito?`);
        if (confirmar) {
          carrito.splice(i, 1);
          guardarCarrito();
          renderizarCarrito();
        }
      }
    });
  });
}

// ✅ Ir a checkout
function irACheckout() {
  if (carrito.length > 0) {
    window.location.href = "/checkout.html";
  }
}

// 🧹 Vaciar el carrito completo
function vaciarCarrito() {
  const confirmar = confirm("⚠️ ¿Estás seguro de vaciar todo el carrito?");
  if (confirmar) {
    carrito = [];
    guardarCarrito();
    renderizarCarrito();
  }
}
