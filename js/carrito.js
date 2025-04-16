"use strict";

// DOM
const carritoItems = document.getElementById("carritoItems");
const carritoTotal = document.getElementById("carritoTotal");
const btnIrCheckout = document.getElementById("btnIrCheckout");

// Clave de localStorage usada en todo el sistema
const STORAGE_KEY = "km_ez_cart";

// Obtener carrito desde localStorage
let carrito = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

// ▶️ Inicializar
document.addEventListener("DOMContentLoaded", () => {
  renderizarCarrito();
  btnIrCheckout.addEventListener("click", irACheckout);
});

// 🧠 Mostrar productos en carrito
function renderizarCarrito() {
  if (carrito.length === 0) {
    carritoItems.innerHTML = `<p class="text-center">🛍️ Tu carrito está vacío.</p>`;
    carritoTotal.textContent = "$0.00";
    btnIrCheckout.disabled = true;
    return;
  }

  carritoItems.innerHTML = "";

  carrito.forEach((item, index) => {
    const div = document.createElement("div");
    div.className = "carrito-item";

    const imagen = item.image || "/assets/logo.jpg";

    div.innerHTML = `
      <img src="${imagen}" alt="${item.name}" class="carrito-img" />
      <div class="carrito-detalles">
        <h4>${item.name}</h4>
        <p><strong>Talla:</strong> ${item.size || "Única"}</p>
        <p><strong>Precio:</strong> $${item.price}</p>
        <div class="carrito-cantidad">
          <label>Cantidad:</label>
          <input type="number" min="1" value="${item.quantity}" data-index="${index}" />
        </div>
        <p><strong>Subtotal:</strong> $${(item.price * item.quantity).toFixed(2)}</p>
        <button class="btn-eliminar" data-index="${index}">🗑️ Eliminar</button>
      </div>
    `;

    carritoItems.appendChild(div);
  });

  actualizarTotal();

  // Listeners: cambio de cantidad
  document.querySelectorAll(".carrito-cantidad input").forEach(input => {
    input.addEventListener("change", e => {
      const i = parseInt(e.target.dataset.index);
      const nuevaCantidad = Math.max(1, parseInt(e.target.value));
      carrito[i].quantity = nuevaCantidad;
      guardarCarrito();
      renderizarCarrito();
    });
  });

  // Listeners: eliminar producto
  document.querySelectorAll(".btn-eliminar").forEach(btn => {
    btn.addEventListener("click", e => {
      const i = parseInt(e.target.dataset.index);
      carrito.splice(i, 1);
      guardarCarrito();
      renderizarCarrito();
    });
  });
}

// 💰 Calcular total
function actualizarTotal() {
  const total = carrito.reduce((acc, item) => acc + item.price * item.quantity, 0);
  carritoTotal.textContent = `$${total.toFixed(2)}`;
  btnIrCheckout.disabled = carrito.length === 0;
}

// 💾 Guardar en localStorage
function guardarCarrito() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(carrito));
}

// 🚀 Ir a checkout
function irACheckout() {
  if (carrito.length > 0) {
    window.location.href = "/checkout.html";
  }
}
