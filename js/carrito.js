"use strict";

// DOM
const carritoItems = document.getElementById("carritoItems");
const carritoTotal = document.getElementById("carritoTotal");
const btnIrCheckout = document.getElementById("btnIrCheckout");

// Datos del carrito (desde localStorage)
let carrito = JSON.parse(localStorage.getItem("carritoKM")) || [];

// ▶️ Iniciar
document.addEventListener("DOMContentLoaded", () => {
  renderizarCarrito();
  btnIrCheckout.addEventListener("click", irACheckout);
});

// 🧠 Mostrar productos
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

    div.innerHTML = `
      <img src="${item.image}" alt="${item.name}" class="carrito-img" />
      <div class="carrito-detalles">
        <h4>${item.name}</h4>
        <p><strong>Talla:</strong> ${item.talla}</p>
        <p><strong>Precio:</strong> $${item.precio}</p>
        <div class="carrito-cantidad">
          <label>Cantidad:</label>
          <input type="number" min="1" value="${item.cantidad}" data-index="${index}" />
        </div>
        <p><strong>Subtotal:</strong> $${(item.precio * item.cantidad).toFixed(2)}</p>
        <button class="btn-eliminar" data-index="${index}">🗑️ Eliminar</button>
      </div>
    `;

    carritoItems.appendChild(div);
  });

  actualizarTotal();

  // Eventos
  document.querySelectorAll(".carrito-cantidad input").forEach(input => {
    input.addEventListener("change", e => {
      const i = parseInt(e.target.dataset.index);
      const nuevaCantidad = Math.max(1, parseInt(e.target.value));
      carrito[i].cantidad = nuevaCantidad;
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

// 💰 Calcular total
function actualizarTotal() {
  const total = carrito.reduce((acc, item) => acc + item.precio * item.cantidad, 0);
  carritoTotal.textContent = `$${total.toFixed(2)}`;
  btnIrCheckout.disabled = carrito.length === 0;
}

// 💾 Guardar cambios en localStorage
function guardarCarrito() {
  localStorage.setItem("carritoKM", JSON.stringify(carrito));
}

// ✅ Ir a checkout
function irACheckout() {
  if (carrito.length > 0) {
    window.location.href = "/views/checkout.html";
  }
}
