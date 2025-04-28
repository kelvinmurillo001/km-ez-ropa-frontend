"use strict";

// ✅ Configuración base
import { API_BASE } from "./config.js";

// 🔐 Constantes
const STORAGE_KEY = "km_ez_cart";
const carrito = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
const API_ORDERS = `${API_BASE}/api/orders`;
const API_PAYPAL_CREATE = `${API_BASE}/api/paypal/create-order`;

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

// 🧾 Renderizar resumen carrito
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

// 💳 Inicializar método de pago
function inicializarMetodoPago() {
  document.querySelectorAll("input[name='metodoPago']").forEach(radio => {
    radio.addEventListener("change", e => {
      const val = e.target.value;
      infoMetodoPago.innerHTML = {
        transferencia: `<p>🔐 Recibirás los datos bancarios por WhatsApp. El pedido se procesa al validar el pago.</p>`,
        paypal: `<p>🅿️ Serás redirigido a PayPal para completar el pago.</p>`
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

  const total = carrito.reduce((acc, item) => acc + (parseFloat(item.precio) || 0) * (parseInt(item.cantidad) || 0), 0);

  const pedido = {
    nombreCliente: sanitize(nombre),
    email,
    telefono,
    direccion: sanitize(direccion),
    metodoPago,
    total,
    estado: metodoPago === "transferencia" ? "pendiente" : "pagado",
    nota: "",
    items: carrito.map(item => ({
      productId: item.id || null,
      name: sanitize(item.nombre || ""),
      talla: sanitize(item.talla || ""),
      cantidad: parseInt(item.cantidad) || 1,
      precio: parseFloat(item.precio) || 0
    })),
    factura: {
      razonSocial: sanitize(form.facturaNombre?.value || ""),
      ruc: sanitize(form.facturaRUC?.value || ""),
      email: sanitize(form.facturaCorreo?.value || "")
    }
  };

  try {
    // 1️⃣ Primero registrar el pedido
    const res = await fetch(API_ORDERS, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(pedido)
    });

    if (!res.ok) throw new Error("Error al registrar el pedido.");

    // 2️⃣ Si método es transferencia
    if (metodoPago === "transferencia") {
      mostrarMensaje("✅ Pedido registrado. Redirigiendo...", "success");
      localStorage.removeItem(STORAGE_KEY);
      abrirWhatsappConfirmacion(pedido);
      setTimeout(() => window.location.href = "/checkout-confirmacion.html", 3000);
    } 
    
    // 3️⃣ Si método es PayPal
    else if (metodoPago === "paypal") {
      mostrarMensaje("✅ Redirigiendo a PayPal...", "success");

      const resPaypal = await fetch(API_PAYPAL_CREATE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ total })
      });

      const dataPaypal = await resPaypal.json();

      if (!dataPaypal.id) throw new Error("❌ Error creando la orden PayPal.");

      window.location.href = `https://www.sandbox.paypal.com/checkoutnow?token=${dataPaypal.id}`;
    }
    
  } catch (err) {
    console.error("❌", err);
    mostrarMensaje("❌ Error inesperado. Intenta nuevamente.", "error");
  }
});

// 📍 Ubicación automática
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

// 💬 WhatsApp confirmación
function abrirWhatsappConfirmacion(pedido) {
  const mensaje = `
📦 *NUEVO PEDIDO*
👤 *Cliente:* ${pedido.nombreCliente}
📞 *Teléfono:* ${pedido.telefono}
📧 *Email:* ${pedido.email}
📍 *Dirección:* ${pedido.direccion}

🛍️ *Productos:*
${pedido.items.map(i => `• ${i.cantidad} x ${i.name} - Talla: ${i.talla} - $${(i.precio * i.cantidad).toFixed(2)}`).join("\n")}

💳 *Pago:* ${pedido.metodoPago}
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
