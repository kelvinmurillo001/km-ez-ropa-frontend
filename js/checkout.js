"use strict";

// ✅ Configuración base
import { API_BASE } from "./config.js";

// 🔐 Constantes globales
const STORAGE_KEY = "km_ez_cart";
const carrito = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

const API_ORDERS = `${API_BASE}/api/orders`;

// 🎯 Elementos del DOM
const resumenPedido = document.getElementById("resumenPedido");
const totalFinal = document.getElementById("totalFinal");
const form = document.getElementById("formCheckout");
const msgEstado = document.getElementById("msgEstado");
const btnUbicacion = document.getElementById("btnUbicacion");
const infoMetodoPago = document.getElementById("infoMetodoPago");

// ▶️ Renderizado inicial
document.addEventListener("DOMContentLoaded", () => {
  if (!Array.isArray(carrito) || carrito.length === 0) {
    mostrarMensaje("⚠️ Tu carrito está vacío.", "warn");
    resumenPedido.innerHTML = "<p class='text-center text-warn'>Tu carrito está vacío.</p>";
    totalFinal.textContent = "$0.00";
    form?.querySelector("button[type='submit']")?.setAttribute("disabled", "true");
    return;
  }

  renderResumenCarrito();
  inicializarMetodoPago();
});

// 🧾 Renderiza los productos
function renderResumenCarrito() {
  let total = 0;
  resumenPedido.innerHTML = carrito.map(item => {
    const nombre = sanitize(item.nombre || "Producto");
    const talla = sanitize(item.talla || "Única");
    const cantidad = parseInt(item.cantidad) || 0;
    const precio = parseFloat(item.precio) || 0;
    const subtotal = precio * cantidad;
    total += subtotal;

    return `<div class="resumen-item">
        <p>🧢 <strong>${nombre}</strong> | Talla: ${talla} | Cant: ${cantidad} | <strong>$${subtotal.toFixed(2)}</strong></p>
      </div>`;
  }).join("");

  totalFinal.textContent = `$${total.toFixed(2)}`;
}

// 💳 Mostrar descripción según método de pago
function inicializarMetodoPago() {
  document.querySelectorAll("input[name='metodoPago']").forEach(radio => {
    radio.addEventListener("change", e => {
      const val = e.target.value;
      infoMetodoPago.innerHTML = {
        transferencia: `<p>🔐 Recibirás los datos bancarios por WhatsApp. El pedido se procesa al validar el pago.</p>`,
        tarjeta: `<p>💳 Redirección a pasarela segura. Recibirás confirmación por email/WhatsApp.</p>`,
        paypal: `<p>🅿️ Serás redirigido a PayPal para confirmar la compra.</p>`,
        efectivo: `<p>💵 Paga al recibir tu pedido (solo áreas seleccionadas).</p>`
      }[val] || "";
    });
  });
}

// 📤 Enviar pedido
form?.addEventListener("submit", async e => {
  e.preventDefault();
  mostrarMensaje("⏳ Enviando pedido...", "info");

  const nombre = form.nombreInput.value.trim();
  const email = form.emailInput.value.trim();
  const telefono = form.telefonoInput.value.trim();
  const direccion = form.direccionInput.value.trim();
  const metodoPago = document.querySelector("input[name='metodoPago']:checked")?.value;

  if (!nombre || !email || !telefono || !direccion || !metodoPago) {
    return mostrarMensaje("❌ Todos los campos son obligatorios.", "error");
  }

  if (!validarEmail(email)) return mostrarMensaje("❌ Email inválido.", "error");
  if (!/^[0-9+\-\s]{7,20}$/.test(telefono)) return mostrarMensaje("❌ Teléfono inválido.", "error");

  const total = carrito.reduce((acc, item) =>
    acc + (parseFloat(item.precio) || 0) * (parseInt(item.cantidad) || 0), 0
  );

  const pedido = {
    nombreCliente: sanitize(nombre),
    email,
    telefono,
    direccion: sanitize(direccion),
    metodoPago,
    total,
    estado: metodoPago === "transferencia" ? "pendiente" : "pagado",
    items: carrito.map(item => ({
      productId: item.id || null,
      name: sanitize(item.nombre || ""),
      talla: sanitize(item.talla || ""),
      cantidad: parseInt(item.cantidad) || 1,
      precio: parseFloat(item.precio) || 0
    })),
    // Facturación opcional
    factura: {
      razonSocial: sanitize(form.facturaNombre?.value || ""),
      ruc: sanitize(form.facturaRUC?.value || ""),
      email: sanitize(form.facturaCorreo?.value || "")
    }
  };

  try {
    const res = await fetch(API_ORDERS, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(pedido)
    });

    if (!res.ok) throw new Error("Error al enviar el pedido");

    mostrarMensaje("✅ Pedido enviado con éxito. ¡Gracias por tu compra!", "success");
    localStorage.removeItem(STORAGE_KEY);

    if (metodoPago === "transferencia" || metodoPago === "efectivo") {
      abrirWhatsappConfirmacion(pedido);
    }

    setTimeout(() => window.location.href = "/seguimiento.html?pedido=enviado", 3000);

  } catch (err) {
    console.error("❌", err);
    mostrarMensaje("❌ No se pudo enviar el pedido. Intenta nuevamente.", "error");
  }
});

// 📍 Geolocalización automática
btnUbicacion?.addEventListener("click", () => {
  if (!navigator.geolocation) return mostrarMensaje("⚠️ Tu navegador no soporta ubicación.", "warn");

  mostrarMensaje("📍 Obteniendo tu ubicación...", "info");

  navigator.geolocation.getCurrentPosition(
    async ({ coords }) => {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${coords.latitude}&lon=${coords.longitude}`);
        const data = await res.json();
        form.direccionInput.value = data.display_name || `${coords.latitude}, ${coords.longitude}`;
        mostrarMensaje("✅ Dirección detectada automáticamente.", "success");
      } catch {
        mostrarMensaje("❌ No se pudo obtener la dirección.", "error");
      }
    },
    () => mostrarMensaje("❌ No se pudo acceder a tu ubicación.", "error")
  );
});

// 💬 WhatsApp automático
function abrirWhatsappConfirmacion(pedido) {
  const mensaje = `
📦 *NUEVO PEDIDO*

👤 *Cliente:* ${pedido.nombreCliente}
📞 *Teléfono:* ${pedido.telefono}
📧 *Email:* ${pedido.email}
📍 *Dirección:* ${pedido.direccion}

🛍️ *Productos:*
${pedido.items.map(i => `• ${i.cantidad} x ${i.name} - Talla: ${i.talla} - $${(i.precio * i.cantidad).toFixed(2)}`).join("\n")}

💳 *Pago:* ${pedido.metodoPago === "transferencia" ? "Transferencia Bancaria" : pedido.metodoPago}
💰 *Total:* $${pedido.total.toFixed(2)}
  `.trim();

  const url = `https://wa.me/593990270864?text=${encodeURIComponent(mensaje)}`;
  window.open(url, "_blank");
}

// ✅ Utilidades
function validarEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

function sanitize(str = "") {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML.trim();
}

function mostrarMensaje(texto, tipo = "info") {
  msgEstado.textContent = texto;
  msgEstado.style.color =
    tipo === "success" ? "limegreen" :
    tipo === "error" ? "tomato" :
    tipo === "warn" ? "orange" :
    "#666";
}
