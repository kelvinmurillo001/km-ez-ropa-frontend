"use strict";

// 🌙 Modo oscuro persistente
document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("modoToggle");
  const oscuroGuardado = localStorage.getItem("modoOscuro") === "true";

  // Aplicar modo oscuro si ya estaba guardado
  if (oscuroGuardado) {
    document.body.classList.add("modo-oscuro");
    if (btn) btn.textContent = "☀️ Modo Claro";
  }

  // 🎛️ Cambiar modo claro/oscuro al hacer click
  btn?.addEventListener("click", () => {
    document.body.classList.toggle("modo-oscuro");
    const oscuro = document.body.classList.contains("modo-oscuro");
    localStorage.setItem("modoOscuro", oscuro);
    btn.textContent = oscuro ? "☀️ Modo Claro" : "🌙 Modo Oscuro";
  });

  // 🛒 Cargar widget del carrito y WhatsApp flotante
  cargarCarritoWidget();
  cargarWhatsappFlotante();

  // 🔄 Actualizar contador
  actualizarContadorCarrito();
});

/**
 * 📦 Cargar widget flotante del carrito
 */
function cargarCarritoWidget() {
  const contenedor = document.getElementById("carrito-widget-container");
  if (!contenedor) return;

  fetch("/carrito-widget.html")
    .then(res => res.text())
    .then(html => {
      contenedor.innerHTML = html;
      actualizarContadorCarrito();

      // Establecer posición flotante
      const widget = document.getElementById("cart-widget");
      if (widget) {
        widget.style.position = "fixed";
        widget.style.bottom = "20px";
        widget.style.right = "20px";
        widget.style.zIndex = "9999";
      }
    })
    .catch(err => console.error("❌ Error al cargar carrito-widget:", err));
}

/**
 * 📱 WhatsApp flotante
 */
function cargarWhatsappFlotante() {
  const existing = document.getElementById("whatsapp-float");
  if (existing) return;

  const btn = document.createElement("a");
  btn.href = "https://wa.me/1234567890"; // ← Cambia por tu número real
  btn.target = "_blank";
  btn.id = "whatsapp-float";
  btn.style.position = "fixed";
  btn.style.left = "20px";
  btn.style.bottom = "20px";
  btn.style.zIndex = "9999";

  const icon = document.createElement("img");
  icon.src = "/assets/whatsapp.png";
  icon.alt = "WhatsApp";
  icon.style.width = "48px";
  icon.style.height = "48px";
  icon.style.borderRadius = "50%";
  icon.style.boxShadow = "0 2px 6px rgba(0,0,0,0.3)";
  icon.style.backgroundColor = "#fff";
  icon.style.padding = "6px";

  btn.appendChild(icon);
  document.body.appendChild(btn);
}

/**
 * 🔢 Actualiza el número de productos en el carrito
 */
function actualizarContadorCarrito() {
  const carrito = JSON.parse(localStorage.getItem("carrito") || "[]");
  const total = carrito.reduce((acc, item) => acc + (item.cantidad || 0), 0);
  const contador = document.getElementById("cart-widget-count");
  if (contador) contador.textContent = total;
}
