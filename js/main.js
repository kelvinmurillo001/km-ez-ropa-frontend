"use strict";

// 🔁 Inicialización
document.addEventListener("DOMContentLoaded", () => {
  aplicarModoOscuroPersistente();
  cargarCarritoWidget();
});

// 🌙 Aplica y gestiona el modo oscuro desde localStorage
function aplicarModoOscuroPersistente() {
  const btnToggle = document.getElementById("modoToggle");
  const oscuro = localStorage.getItem("modoOscuro") === "true";

  if (oscuro) {
    document.body.classList.add("modo-oscuro");
    if (btnToggle) btnToggle.textContent = "☀️ Modo Claro";
  }

  btnToggle?.addEventListener("click", () => {
    const activo = document.body.classList.toggle("modo-oscuro");
    localStorage.setItem("modoOscuro", activo);
    btnToggle.textContent = activo ? "☀️ Modo Claro" : "🌙 Modo Oscuro";
  });
}

// 🛒 Carga el widget del carrito (HTML externo) y actualiza el contador
function cargarCarritoWidget() {
  const contenedor = document.getElementById("carrito-widget-container");
  if (!contenedor) return;

  fetch("/carrito-widget.html")
    .then(res => {
      if (!res.ok) throw new Error("❌ No se pudo cargar carrito-widget.");
      return res.text();
    })
    .then(html => {
      contenedor.innerHTML = html;
      actualizarContadorCarrito(); // 🧮 Llama después de cargar el HTML
    })
    .catch(err => console.error("❌ Error:", err));
}

// 🔢 Muestra la cantidad total de productos en el carrito
function actualizarContadorCarrito() {
  const carrito = JSON.parse(localStorage.getItem("carrito") || "[]");
  const total = carrito.reduce((acc, item) => acc + (item.cantidad || 0), 0);

  const contador = document.getElementById("cart-widget-count");
  if (contador) {
    contador.textContent = total;
    contador.setAttribute("aria-label", `Carrito con ${total} producto${total !== 1 ? "s" : ""}`);
  }
}
