"use strict";

document.addEventListener("DOMContentLoaded", () => {
  renderResumen();

  document.getElementById("checkoutForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const nombre = document.getElementById("nombre").value.trim();
    const telefono = document.getElementById("telefono").value.trim();
    const direccion = document.getElementById("direccion").value.trim();
    const nota = document.getElementById("nota").value.trim();

    if (!nombre || !telefono || !direccion) {
      return alert("⚠️ Completa todos los campos obligatorios");
    }

    const ok = await guardarPedido(nombre, nota || "", "sitio");
    if (ok) {
      document.querySelector("#mensajeFinal").classList.remove("oculto");
      document.querySelector("#mensajeFinal").textContent = "✅ Pedido confirmado con éxito";
      localStorage.removeItem("km_ez_cart");
      setTimeout(() => window.location.href = "index.html", 3000);
    }
  });
});

// WhatsApp opcional
function enviarWhatsApp() {
  const nombre = document.getElementById("nombre").value.trim();
  const nota = document.getElementById("nota").value.trim();
  sendCartToWhatsApp(nombre, nota);
}

// Cargar resumen
function renderResumen() {
  const resumen = document.getElementById("resumen-pedido");
  const cart = getCart();

  if (!cart.length) {
    resumen.innerHTML = "<p>Tu carrito está vacío.</p>";
    return;
  }

  resumen.innerHTML = cart.map(p => `
    <div class="item">
      <strong>${p.nombre}</strong> x${p.cantidad}
      ${p.talla ? `| Talla: ${p.talla}` : ""} ${p.color ? `| Color: ${p.color}` : ""}
      <br />$${(p.precio * p.cantidad).toFixed(2)}
    </div>
  `).join("") + `<p><strong>Total:</strong> $${calculateTotal()}</p>`;
}
