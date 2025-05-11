"use strict";

import { API_BASE } from "./config.js";

// 🔐 Constantes clave
const STORAGE_KEY = "km_ez_cart";
const LAST_ORDER_KEY = "km_ez_last_order";
const carrito = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

const API_ORDERS = `${API_BASE}/api/orders`;
const API_PAYPAL_CREATE = `${API_BASE}/api/paypal/create-order`;

// 📌 Elementos DOM
const resumenPedido = document.getElementById("resumenPedido");
const totalFinal = document.getElementById("totalFinal");
const form = document.getElementById("formCheckout");
const msgEstado = document.getElementById("msgEstado");
const btnUbicacion = document.getElementById("btnUbicacion");
const infoMetodoPago = document.getElementById("infoMetodoPago");

let enviandoPedido = false;

// ✅ Fuerza HTTPS
if (location.protocol !== 'https:') {
  alert("⚠️ Conexión insegura. Redirigiendo a HTTPS...");
  location.href = location.href.replace("http://", "https://");
}

// ▶️ Al cargar DOM
document.addEventListener("DOMContentLoaded", () => {
  if (!carrito.length) {
    mostrarMensaje("⚠️ Tu carrito está vacío.", "warn");
    resumenPedido.innerHTML = "<p class='text-center text-warn'>Tu carrito está vacío.</p>";
    totalFinal.textContent = "$0.00";
    form?.querySelector("button[type='submit']")?.setAttribute("disabled", "true");
    return;
  }

  renderResumenCarrito();
  inicializarMetodoPago();
});

// 📋 Render de carrito
function renderResumenCarrito() {
  let total = 0;

  resumenPedido.innerHTML = carrito.map(item => {
    const nombre = sanitize(item.nombre);
    const talla = sanitize(item.talla || "Única");
    const color = sanitize(item.color || "N/A");
    const cantidad = parseInt(item.cantidad) || 1;
    const precio = parseFloat(item.precio) || 0;
    const subtotal = precio * cantidad;
    total += subtotal;

    return `<div class="resumen-item">
      <p>🧢 <strong>${nombre}</strong> | Talla: ${talla} | Color: ${color} | Cant: ${cantidad} | <strong>$${subtotal.toFixed(2)}</strong></p>
    </div>`;
  }).join("");

  totalFinal.textContent = `$${total.toFixed(2)}`;
}

// 💳 Render método de pago
function inicializarMetodoPago() {
  document.querySelectorAll("input[name='metodoPago']").forEach(radio => {
    radio.addEventListener("change", e => {
      const val = e.target.value;
      infoMetodoPago.innerHTML = {
        transferencia: `<p>🔐 Recibirás los datos bancarios por WhatsApp. Confirmaremos el pago manualmente.</p>`,
        paypal: `<p>🅿️ Serás redirigido a PayPal para completar tu pago de forma segura.</p>`
      }[val] || "";
    });
  });
}

// 🧾 Enviar pedido
form?.addEventListener("submit", async e => {
  e.preventDefault();
  if (enviandoPedido) return;

  enviandoPedido = true;
  const botonSubmit = form.querySelector("button[type='submit']");
  botonSubmit.disabled = true;
  mostrarCargando(true);

  try {
    const nombre = sanitize(form.nombreInput.value.trim());
    const email = form.emailInput.value.trim();
    const telefono = form.telefonoInput.value.trim();
    const direccion = sanitize(form.direccionInput.value.trim());
    const metodoPago = document.querySelector("input[name='metodoPago']:checked")?.value;

    if (!nombre || !email || !telefono || !direccion || !metodoPago)
      throw new Error("❌ Todos los campos son obligatorios.");

    if (!validarEmail(email)) throw new Error("❌ Email inválido.");
    if (!/^[0-9+\-\s]{7,20}$/.test(telefono)) throw new Error("❌ Teléfono inválido.");
    if (nombre.length < 3 || nombre.length > 50) throw new Error("❌ Nombre inválido.");
    if (direccion.length < 5 || direccion.length > 120) throw new Error("❌ Dirección no válida.");

    let total = 0;
    const items = [];

    for (const item of carrito) {
      const resProd = await fetch(`${API_BASE}/api/products/${encodeURIComponent(item.id)}`);
      const dataProd = await resProd.json();
      const producto = dataProd?.producto;

      if (!producto) throw new Error(`❌ Producto no encontrado: ${sanitize(item.nombre)}`);

      const talla = (item.talla || "").toLowerCase();
      const color = (item.color || "").toLowerCase();
      const cantidad = parseInt(item.cantidad) || 1;

      if (producto.variants?.length > 0) {
        const variante = producto.variants.find(v =>
          v.talla === talla && v.color === color && v.stock >= cantidad
        );
        if (!variante) throw new Error(`❌ Variante no disponible: ${sanitize(item.nombre)} - ${item.talla} - ${item.color}`);
      } else {
        const stock = producto.stockTotal || 0;
        if (stock < cantidad) throw new Error(`❌ Stock insuficiente: ${sanitize(item.nombre)}`);
      }

      const precio = parseFloat(producto.price) || 0;
      total += precio * cantidad;

      items.push({
        productId: item.id,
        name: sanitize(item.nombre),
        talla: sanitize(item.talla),
        color: sanitize(item.color),
        cantidad,
        precio
      });
    }

    const pedido = {
      nombreCliente: nombre,
      email,
      telefono,
      direccion,
      metodoPago,
      total,
      estado: metodoPago === "transferencia" ? "pendiente" : "pagado",
      items,
      factura: {
        razonSocial: sanitize(form.facturaNombre?.value || ""),
        ruc: sanitize(form.facturaRUC?.value || ""),
        email: sanitize(form.facturaCorreo?.value || "")
      }
    };

    const res = await fetch(API_ORDERS, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(pedido)
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "❌ Error al registrar el pedido.");

    localStorage.setItem(LAST_ORDER_KEY, JSON.stringify(pedido));
    localStorage.removeItem(STORAGE_KEY);

    if (metodoPago === "transferencia") {
      mostrarMensaje("✅ Pedido recibido. Redirigiendo a WhatsApp...", "success");
      abrirWhatsappConfirmacion(pedido);
      setTimeout(() => window.location.href = "/checkout-confirmacion.html", 3000);
    } else {
      const resPaypal = await fetch(API_PAYPAL_CREATE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ total })
      });

      const dataPaypal = await resPaypal.json();
      if (!resPaypal.ok || !dataPaypal.data?.id)
        throw new Error(dataPaypal.message || "❌ Error creando orden PayPal.");

      window.location.href = `/checkout-confirmacion.html?token=${dataPaypal.data.id}`;
    }
  } catch (err) {
    console.error("❌", err);
    mostrarMensaje(`❌ ${err.message}`, "error");
  } finally {
    finalizarEnvio();
  }
});

// 📍 Autocompletar ubicación
btnUbicacion?.addEventListener("click", () => {
  if (!navigator.geolocation)
    return mostrarMensaje("⚠️ Tu navegador no permite ubicación.", "warn");

  mostrarMensaje("📍 Obteniendo ubicación...", "info");

  navigator.geolocation.getCurrentPosition(
    async ({ coords }) => {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${coords.latitude}&lon=${coords.longitude}`);
        const data = await res.json();
        form.direccionInput.value = data.display_name || `${coords.latitude}, ${coords.longitude}`;
        mostrarMensaje("✅ Dirección detectada automáticamente.", "success");
      } catch {
        mostrarMensaje("❌ No se pudo obtener dirección.", "error");
      }
    },
    () => mostrarMensaje("❌ No se pudo acceder a ubicación.", "error")
  );
});

// 📤 WhatsApp confirmación
function abrirWhatsappConfirmacion(pedido) {
  const mensaje = `📦 *NUEVO PEDIDO*\n👤 *Cliente:* ${pedido.nombreCliente}\n📞 *Tel:* ${pedido.telefono}\n📧 *Email:* ${pedido.email}\n📍 *Dirección:* ${pedido.direccion}\n\n🛍️ *Productos:*\n${pedido.items.map(i => `• ${i.cantidad} x ${i.name} - Talla: ${i.talla} - Color: ${i.color} - $${(i.precio * i.cantidad).toFixed(2)}`).join("\n")}\n\n💳 *Pago:* ${pedido.metodoPago}\n💰 *Total:* $${pedido.total.toFixed(2)}`;
  const url = `https://wa.me/593990270864?text=${encodeURIComponent(mensaje)}`;
  window.open(url, "_blank");
}

// 🔎 Validadores
function validarEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

function sanitize(str = "") {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML.trim();
}

// 🔔 Mensajes
function mostrarMensaje(texto, tipo = "info") {
  msgEstado.textContent = texto;
  msgEstado.style.color = {
    success: "limegreen",
    error: "tomato",
    warn: "orange"
  }[tipo] || "#666";
}

function mostrarCargando(show = true) {
  msgEstado.innerHTML = show ? "⏳ Procesando... <span class='spinner'></span>" : "";
}

function finalizarEnvio() {
  form.querySelector("button[type='submit']").disabled = false;
  enviandoPedido = false;
  mostrarCargando(false);
}
