"use strict";

document.addEventListener("DOMContentLoaded", () => {
  renderResumen();

  const form = document.getElementById("checkoutForm");
  const nombre = document.getElementById("nombre");
  const telefono = document.getElementById("telefono");
  const direccion = document.getElementById("direccion");
  const nota = document.getElementById("nota");

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const nombreVal = nombre?.value.trim();
      const telefonoVal = telefono?.value.trim();
      const direccionVal = direccion?.value.trim();
      const notaVal = nota?.value.trim();

      if (!nombreVal || !telefonoVal || !direccionVal) {
        mostrarMensaje("⚠️ Por favor, completa todos los campos obligatorios.", "error");

        if (!nombreVal) nombre?.focus();
        else if (!telefonoVal) telefono?.focus();
        else direccion?.focus();

        return;
      }

      const ok = await guardarPedido(nombreVal, notaVal || "", "sitio");

      if (ok) {
        mostrarMensaje("✅ Pedido confirmado con éxito", "success");
        localStorage.removeItem("km_ez_cart");
        setTimeout(() => window.location.href = "index.html", 3000);
      } else {
        mostrarMensaje("❌ Hubo un problema al confirmar el pedido.", "error");
      }
    });
  }
});

/* 📲 Botón alternativo para enviar por WhatsApp */
function enviarWhatsApp() {
  const nombre = document.getElementById("nombre")?.value.trim();
  const nota = document.getElementById("nota")?.value.trim();
  if (!nombre) {
    mostrarMensaje("⚠️ Por favor ingresa tu nombre para enviar por WhatsApp.", "error");
    document.getElementById("nombre")?.focus();
    return;
  }
  sendCartToWhatsApp(nombre, nota);
}

/* 🧾 Resumen visual del carrito */
function renderResumen() {
  const resumen = document.getElementById("resumen-pedido");
  const cart = getCart();

  if (!resumen) return;

  if (!cart.length) {
    resumen.innerHTML = "<p class='fade-in'>🛒 Tu carrito está vacío.</p>";
    return;
  }

  let contenido = "";

  cart.forEach((p) => {
    const totalItem = (p.precio * p.cantidad).toFixed(2);
    contenido += `
      <div class="item fade-in">
        <strong>${p.nombre}</strong> x${p.cantidad}
        ${p.talla ? ` | Talla: ${p.talla}` : ""}
        ${p.color ? ` | Color: ${p.color}` : ""}
        <br />
        <span class="precio">$${totalItem}</span>
      </div>
    `;
  });

  contenido += `<p class="total"><strong>Total:</strong> $${calculateTotal()}</p>`;
  resumen.innerHTML = contenido;
}

/* 💬 Mostrar mensaje visual */
function mostrarMensaje(texto, tipo = "info") {
  const mensaje = document.getElementById("mensajeFinal");
  if (!mensaje) return;

  mensaje.textContent = texto;
  mensaje.className = `fade-in ${tipo === "success" ? "mensaje-exito" : "mensaje-error"}`;
  mensaje.classList.remove("oculto");
}
