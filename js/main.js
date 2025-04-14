"use strict";

// 🌙 Modo oscuro persistente
document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("modoToggle");
  const oscuroGuardado = localStorage.getItem("modoOscuro") === "true";

  if (oscuroGuardado) {
    document.body.classList.add("modo-oscuro");
    if (btn) btn.textContent = "☀️ Modo Claro";
  }

  btn?.addEventListener("click", () => {
    document.body.classList.toggle("modo-oscuro");
    const oscuro = document.body.classList.contains("modo-oscuro");
    localStorage.setItem("modoOscuro", oscuro);
    btn.textContent = oscuro ? "☀️ Modo Claro" : "🌙 Modo Oscuro";
  });

  // 🛒 Cargar widget del carrito
  cargarCarritoWidget();

  // 🔄 Actualizar contador
  actualizarContadorCarrito();
});

// 📦 Cargar widget flotante del carrito
function cargarCarritoWidget() {
  const contenedor = document.getElementById("carrito-widget-container");
  if (!contenedor) return;
  fetch("/carrito-widget.html")
    .then(res => res.text())
    .then(html => {
      contenedor.innerHTML = html;
      actualizarContadorCarrito();
    })
    .catch(err => console.error("❌ Error al cargar carrito-widget:", err));
}

// 🔢 Actualiza el número de productos en el carrito
function actualizarContadorCarrito() {
  const carrito = JSON.parse(localStorage.getItem("carrito") || "[]");
  const total = carrito.reduce((acc, item) => acc + (item.cantidad || 0), 0);
  const contador = document.getElementById("cart-widget-count");
  if (contador) contador.textContent = total;
}
