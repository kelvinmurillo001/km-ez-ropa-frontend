"use strict";

// 📦 DOM
const carritoItems = document.getElementById("carritoItems");
const carritoTotal = document.getElementById("carritoTotal");
const btnIrCheckout = document.getElementById("btnIrCheckout");

// 🔐 Clave para localStorage
const STORAGE_KEY = "km_ez_cart";
let carrito = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

// ▶️ Iniciar
document.addEventListener("DOMContentLoaded", () => {
  filtrarItemsInvalidos();
  renderizarCarrito();
  btnIrCheckout?.addEventListener("click", irACheckout);
});

// ✅ Eliminar productos corruptos
function filtrarItemsInvalidos() {
  carrito = carrito.filter(p =>
    p &&
    typeof p.nombre === "string" &&
    typeof p.precio === "number" &&
    typeof p.cantidad === "number" &&
    !isNaN(p.precio) &&
    !isNaN(p.cantidad)
  );
  guardarCarrito();
}

// 🧠 Renderizar carrito completo
function renderizarCarrito() {
  if (!carrito.length) {
    carritoItems.innerHTML = `<p class="text-center">🛍️ Tu carrito está vacío.</p>`;
    carritoTotal.textContent = "$0.00";
    btnIrCheckout.disabled = true;
    return;
  }

  carritoItems.innerHTML = "";

  carrito.forEach((item, index) => {
    const imagen = sanitizeURL(item.imagen || "/assets/logo.jpg");
    const nombre = sanitizeText(item.nombre || "Producto");
    const talla = sanitizeText(item.talla || "Única");
    const precio = isNaN(item.precio) ? 0 : item.precio;
    const cantidad = isNaN(item.cantidad) || item.cantidad < 1 ? 1 : item.cantidad;

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
          <input type="number" min="1" max="100" value="${cantidad}" data-index="${index}" />
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

// 💰 Calcular y mostrar total
function actualizarTotal() {
  const total = carrito.reduce((acc, item) => {
    const precio = isNaN(item.precio) ? 0 : item.precio;
    const cantidad = isNaN(item.cantidad) ? 0 : item.cantidad;
    return acc + precio * cantidad;
  }, 0);

  carritoTotal.textContent = `$${total.toFixed(2)}`;
  btnIrCheckout.disabled = carrito.length === 0;
}

// 🎯 Listeners dinámicos
function agregarListeners() {
  // Cambiar cantidad
  document.querySelectorAll(".carrito-cantidad input").forEach(input => {
    input.addEventListener("change", e => {
      const i = parseInt(e.target.dataset.index);
      const nuevaCantidad = Math.max(1, Math.min(100, parseInt(e.target.value) || 1));
      carrito[i].cantidad = nuevaCantidad;
      guardarCarrito();
      renderizarCarrito();
    });
  });

  // Eliminar producto
  document.querySelectorAll(".btn-eliminar").forEach(btn => {
    btn.addEventListener("click", e => {
      const i = parseInt(e.target.dataset.index);
      if (confirm("¿Eliminar este producto del carrito?")) {
        carrito.splice(i, 1);
        guardarCarrito();
        renderizarCarrito();
      }
    });
  });
}

// 💾 Guardar en localStorage
function guardarCarrito() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(carrito));
}

// 🚀 Navegar a checkout
function irACheckout() {
  if (carrito.length > 0) {
    window.location.href = "/checkout.html";
  }
}

// 🧼 Sanitizar texto
function sanitizeText(str) {
  const temp = document.createElement("div");
  temp.textContent = str;
  return temp.innerHTML;
}

// 🧼 Sanitizar URL
function sanitizeURL(url) {
  try {
    return new URL(url).href;
  } catch {
    return "/assets/logo.jpg";
  }
}
