"use strict";

// DOM
const carritoItems = document.getElementById("carritoItems");
const carritoTotal = document.getElementById("carritoTotal");
const btnIrCheckout = document.getElementById("btnIrCheckout");

// Clave de localStorage
const STORAGE_KEY = "km_ez_cart";
let carrito = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

// ▶️ Iniciar
document.addEventListener("DOMContentLoaded", () => {
  filtrarItemsInvalidos();
  renderizarCarrito();
  btnIrCheckout.addEventListener("click", irACheckout);
});

// ✅ Eliminar productos con datos corruptos
function filtrarItemsInvalidos() {
  carrito = carrito.filter(p =>
    p &&
    typeof p.name === "string" &&
    typeof p.price === "number" &&
    typeof p.quantity === "number" &&
    !isNaN(p.price) &&
    !isNaN(p.quantity)
  );
  guardarCarrito();
}

// 🧠 Renderizar carrito
function renderizarCarrito() {
  if (carrito.length === 0) {
    carritoItems.innerHTML = `<p class="text-center">🛍️ Tu carrito está vacío.</p>`;
    carritoTotal.textContent = "$0.00";
    btnIrCheckout.disabled = true;
    return;
  }

  carritoItems.innerHTML = "";

  carrito.forEach((item, index) => {
    const imagen = item.image || "/assets/logo.jpg";
    const nombre = item.name || "Producto";
    const talla = item.size || "Única";
    const precio = isNaN(item.price) ? 0 : item.price;
    const cantidad = isNaN(item.quantity) || item.quantity < 1 ? 1 : item.quantity;

    const subtotal = (precio * cantidad).toFixed(2);

    const div = document.createElement("div");
    div.className = "carrito-item";

    div.innerHTML = `
      <img src="${imagen}" alt="${nombre}" class="carrito-img" />
      <div class="carrito-detalles">
        <h4>${nombre}</h4>
        <p><strong>Talla:</strong> ${talla}</p>
        <p><strong>Precio:</strong> $${precio.toFixed(2)}</p>
        <div class="carrito-cantidad">
          <label>Cantidad:</label>
          <input type="number" min="1" value="${cantidad}" data-index="${index}" />
        </div>
        <p><strong>Subtotal:</strong> $${subtotal}</p>
        <button class="btn-eliminar" data-index="${index}">🗑️ Eliminar</button>
      </div>
    `;

    carritoItems.appendChild(div);
  });

  actualizarTotal();
  agregarListeners();
}

// 💰 Calcular total
function actualizarTotal() {
  const total = carrito.reduce((acc, item) => {
    const precio = isNaN(item.price) ? 0 : item.price;
    const cantidad = isNaN(item.quantity) ? 0 : item.quantity;
    return acc + precio * cantidad;
  }, 0);

  carritoTotal.textContent = `$${total.toFixed(2)}`;
  btnIrCheckout.disabled = carrito.length === 0;
}

// 🎯 Eventos dinámicos
function agregarListeners() {
  document.querySelectorAll(".carrito-cantidad input").forEach(input => {
    input.addEventListener("change", e => {
      const i = parseInt(e.target.dataset.index);
      const nuevaCantidad = Math.max(1, parseInt(e.target.value) || 1);
      carrito[i].quantity = nuevaCantidad;
      guardarCarrito();
      renderizarCarrito();
    });
  });

  document.querySelectorAll(".btn-eliminar").forEach(btn => {
    btn.addEventListener("click", e => {
      const i = parseInt(e.target.dataset.index);
      carrito.splice(i, 1);
      guardarCarrito();
      renderizarCarrito();
    });
  });
}

// 💾 Guardar
function guardarCarrito() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(carrito));
}

// 🚀 Ir a checkout
function irACheckout() {
  if (carrito.length > 0) {
    window.location.href = "/checkout.html";
  }
}
