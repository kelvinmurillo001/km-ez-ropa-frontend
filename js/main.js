"use strict";

document.addEventListener("DOMContentLoaded", () => {
  aplicarModoOscuroInicial();
  renderProductosPopulares();
  renderFloatingButtons();
});

/* 🌙 Modo oscuro */
function aplicarModoOscuroInicial() {
  const toggle = document.getElementById("modoToggle");
  if (localStorage.getItem("modoOscuro") === "true") {
    document.body.classList.add("modo-oscuro");
  }

  toggle?.addEventListener("click", () => {
    document.body.classList.toggle("modo-oscuro");
    localStorage.setItem("modoOscuro", document.body.classList.contains("modo-oscuro"));
  });
}

/* 🧥 Mostrar productos populares */
async function renderProductosPopulares() {
  try {
    const res = await fetch("https://km-ez-ropa-backend.onrender.com/api/products");
    const productos = await res.json();
    const populares = productos.filter(p => p.destacado).slice(0, 6);
    const contenedor = document.getElementById("catalogo");

    populares.forEach(p => {
      const card = document.createElement("div");
      card.className = "card fade-in";
      card.innerHTML = `
        <img src="${p.imagen}" alt="${p.nombre}" />
        <h3>${p.nombre}</h3>
        <p><strong>Precio:</strong> $${p.precio}</p>
        <p><strong>Categoría:</strong> ${p.category}</p>
        <button onclick="window.location.href='detalle.html?id=${p._id}'">👁️ Ver Detalles</button>
      `;
      contenedor.appendChild(card);
    });
  } catch (err) {
    console.error("❌ Error al cargar productos:", err);
  }
}

/* 🛒 Carrito + 💬 WhatsApp */
function renderFloatingButtons() {
  const contenedor = document.getElementById("carrito-widget-container");
  if (!contenedor) return;

  contenedor.innerHTML = `
    <div id="cart-widget" style="position: fixed; bottom: 20px; right: 20px; z-index: 1000;">
      <img src="/assets/cart-icon.svg" alt="Carrito" />
      <span id="cart-widget-count">0</span>
    </div>
    <div class="whatsapp-float">
      <a href="https://wa.me/593990270864" target="_blank" aria-label="WhatsApp">
        <img src="/assets/whatsapp.svg" alt="WhatsApp" />
      </a>
    </div>
  `;

  if (typeof updateCartWidget === "function") updateCartWidget();
}
