"use strict";

document.addEventListener("DOMContentLoaded", () => {
  renderResumen();

  const form = document.getElementById("checkoutForm");
  const nombre = document.getElementById("nombre");
  const telefono = document.getElementById("telefono");
  const direccion = document.getElementById("direccion");
  const nota = document.getElementById("nota");

  form?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const nombreVal = nombre.value.trim();
    const telefonoVal = telefono.value.trim();
    const direccionVal = direccion.value.trim();
    const notaVal = nota.value.trim();

    if (!nombreVal || !telefonoVal || !direccionVal) {
      mostrarMensaje("⚠️ Por favor, completa todos los campos obligatorios.", "error");
      if (!nombreVal) nombre.focus();
      else if (!telefonoVal) telefono.focus();
      else direccion.focus();
      return;
    }

    const ok = await guardarPedido(nombreVal, notaVal || "", "sitio");
    if (ok) {
      mostrarMensaje("✅ Pedido confirmado con éxito", "success");
      localStorage.removeItem("km_ez_cart");
      setTimeout(() => window.location.href = "index.html", 3000);
    }
  });
});

/* ✅ WhatsApp opcional */
function enviarWhatsApp() {
  const nombre = document.getElementById("nombre")?.value.trim();
  const nota = document.getElementById("nota")?.value.trim();
  sendCartToWhatsApp(nombre, nota);
}

/* 🧾 Resumen del carrito */
function renderResumen() {
  const resumen = document.getElementById("resumen-pedido");
  const cart = getCart();

  if (!cart.length) {
    resumen.innerHTML = "<p>🛒 Tu carrito está vacío.</p>";
    return;
  }

  resumen.innerHTML = cart.map(p => `
    <div class="item">
      <strong>${p.nombre}</strong> x${p.cantidad}
      ${p.talla ? ` | Talla: ${p.talla}` : ""} 
      ${p.color ? ` | Color: ${p.color}` : ""}
      <br/><span class="precio">$${(p.precio * p.cantidad).toFixed(2)}</span>
    </div>
  `).join("") + `<p class="total"><strong>Total:</strong> $${calculateTotal()}</p>`;
}

/* 💬 Mensaje visual */
function mostrarMensaje(texto, tipo = "info") {
  const mensaje = document.getElementById("mensajeFinal");
  if (!mensaje) return;
  mensaje.className = tipo === "success" ? "mensaje-exito fade-in" : "mensaje-error fade-in";
  mensaje.textContent = texto;
  mensaje.classList.remove("oculto");
}
