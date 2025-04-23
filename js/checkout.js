"use strict";

// ✅ Configuración base
import { API_BASE } from "./config.js";

const STORAGE_KEY = "km_ez_cart";
let carrito = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

const resumenPedido = document.getElementById("resumenPedido");
const totalFinal = document.getElementById("totalFinal");
const form = document.getElementById("formCheckout");
const msgEstado = document.getElementById("msgEstado");
const btnUbicacion = document.getElementById("btnUbicacion");
const infoMetodoPago = document.getElementById("infoMetodoPago");

const API_ORDERS = `${API_BASE}/api/orders`;

/* -------------------------------------------------------------------------- */
/* 🧾 Renderizado del pedido                                                  */
/* -------------------------------------------------------------------------- */
document.addEventListener("DOMContentLoaded", () => {
  if (!Array.isArray(carrito) || carrito.length === 0) {
    resumenPedido.innerHTML = `<p class="text-center text-warn">⚠️ Tu carrito está vacío.</p>`;
    totalFinal.textContent = "$0.00";
    form?.querySelector("button[type='submit']")?.setAttribute("disabled", "true");
    return;
  }

  let total = 0;
  resumenPedido.innerHTML = carrito.map(item => {
    const nombre = sanitizeText(item.nombre || "Producto");
    const talla = sanitizeText(item.talla || "Única");
    const cantidad = parseInt(item.cantidad) || 0;
    const precio = parseFloat(item.precio) || 0;
    const subtotal = precio * cantidad;
    total += subtotal;

    return `
      <div class="resumen-item">
        <p>🧢 <strong>${nombre}</strong> | Talla: ${talla} | Cant: ${cantidad} | <strong>$${subtotal.toFixed(2)}</strong></p>
      </div>
    `;
  }).join("");

  totalFinal.textContent = `$${total.toFixed(2)}`;
});

// 🔁 Mostrar información adicional de método de pago
document.querySelectorAll("input[name='metodoPago']").forEach(radio => {
  radio.addEventListener("change", e => {
    const val = e.target.value;
    infoMetodoPago.innerHTML = {
      transferencia: `<p>🔐 Recibirás los datos bancarios por WhatsApp. Envío tras validación del pago.</p>`,
      tarjeta: `<p>💳 Redirigiremos a una pasarela segura para completar el pago con tarjeta.</p>`,
      paypal: `<p>🅿️ Serás dirigido a PayPal. Compra segura y protegida.</p>`
    }[val] || "";
  });
});

/* -------------------------------------------------------------------------- */
/* 📤 Enviar pedido                                                           */
/* -------------------------------------------------------------------------- */
form?.addEventListener("submit", async e => {
  e.preventDefault();
  msgEstado.textContent = "⏳ Enviando pedido...";
  msgEstado.style.color = "#999";

  const nombre = form.nombreInput.value.trim();
  const email = form.emailInput.value.trim();
  const telefono = form.telefonoInput.value.trim();
  const direccion = form.direccionInput.value.trim();
  const metodoPago = document.querySelector("input[name='metodoPago']:checked")?.value;

  // 🔐 Validaciones básicas
  if (!nombre || !email || !telefono || !direccion || !metodoPago) {
    return mostrarError("❌ Todos los campos son obligatorios.");
  }

  if (!validarEmail(email)) return mostrarError("❌ Email inválido.");
  if (!/^[0-9+\-\s]{7,20}$/.test(telefono)) return mostrarError("❌ Teléfono inválido. Usa dígitos, +, - o espacios.");

  const total = carrito.reduce((acc, item) =>
    acc + (parseFloat(item.precio) || 0) * (parseInt(item.cantidad) || 0), 0
  );

  const pedido = {
    nombreCliente: sanitizeText(nombre),
    email,
    telefono,
    direccion: sanitizeText(direccion),
    metodoPago,
    total,
    estado: metodoPago === "transferencia" ? "pendiente" : "pagado",
    items: carrito.map(item => ({
      productId: item.id || null,
      name: sanitizeText(item.nombre || ""),
      talla: sanitizeText(item.talla || ""),
      cantidad: parseInt(item.cantidad) || 1,
      precio: parseFloat(item.precio) || 0
    }))
  };

  try {
    const res = await fetch(API_ORDERS, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(pedido)
    });

    if (!res.ok) throw new Error("Error al enviar el pedido");

    msgEstado.textContent = "✅ Pedido enviado con éxito. ¡Gracias por tu compra!";
    msgEstado.style.color = "limegreen";

    // 🟡 INTEGRACIÓN CON MÉTODOS EXTERNOS
    if (metodoPago === "paypal") {
      // Redirección opcional si tienes backend PayPal integrado
      // window.location.href = `${API_BASE}/api/paypal/session?orderId=XXX`;
    }

    if (metodoPago === "transferencia") {
      const mensajeWA = `
📦 *NUEVO PEDIDO*

👤 *Cliente:* ${nombre}
📞 *Teléfono:* ${telefono}
📧 *Email:* ${email}
📍 *Dirección:* ${direccion}

🛍️ *Productos:*
${carrito.map(i => `• ${i.cantidad} x ${i.nombre} - Talla: ${i.talla} - $${(i.precio * i.cantidad).toFixed(2)}`).join("\n")}

💳 *Pago:* Transferencia Bancaria
💰 *Total:* $${total.toFixed(2)}
      `.trim();

      const whatsappURL = `https://wa.me/593990270864?text=${encodeURIComponent(mensajeWA)}`;
      window.open(whatsappURL, "_blank");
    }

    localStorage.removeItem(STORAGE_KEY);
    setTimeout(() => window.location.href = "/index.html", 3000);

  } catch (err) {
    console.error("❌", err);
    mostrarError("❌ No se pudo enviar el pedido. Intenta nuevamente.");
  }
});

/* -------------------------------------------------------------------------- */
/* 🛠️ Funciones utilitarias                                                  */
/* -------------------------------------------------------------------------- */
function validarEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  return regex.test(email);
}

function mostrarError(msg) {
  msgEstado.textContent = msg;
  msgEstado.style.color = "tomato";
}

function sanitizeText(text) {
  const temp = document.createElement("div");
  temp.textContent = text;
  return temp.innerHTML;
}

/* -------------------------------------------------------------------------- */
/* 📍 Obtener ubicación                                                      */
/* -------------------------------------------------------------------------- */
btnUbicacion?.addEventListener("click", () => {
  if (!navigator.geolocation) return mostrarError("⚠️ Tu navegador no soporta geolocalización.");
  msgEstado.textContent = "📍 Obteniendo ubicación...";

  navigator.geolocation.getCurrentPosition(
    async ({ coords }) => {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${coords.latitude}&lon=${coords.longitude}`);
        const data = await res.json();
        form.direccionInput.value = data.display_name || `${coords.latitude}, ${coords.longitude}`;
        msgEstado.textContent = "✅ Dirección detectada automáticamente.";
        msgEstado.style.color = "limegreen";
      } catch {
        mostrarError("❌ No se pudo obtener la dirección.");
      }
    },
    () => mostrarError("❌ No se pudo acceder a la ubicación.")
  );
});
