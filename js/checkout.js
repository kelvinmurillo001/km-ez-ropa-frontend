"use strict";

import { API_BASE } from "./config.js";

const STORAGE_KEY = "km_ez_cart";
const LAST_ORDER_KEY = "km_ez_last_order";
const carrito = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

const API_ORDERS = `${API_BASE}/api/orders`;
const API_PAYPAL_CREATE = `${API_BASE}/api/paypal/create-order`;

// DOM Elements
const resumenPedido = document.getElementById("resumenPedido");
const totalFinal = document.getElementById("totalFinal");
const form = document.getElementById("formCheckout");
const msgEstado = document.getElementById("msgEstado");
const btnUbicacion = document.getElementById("btnUbicacion");
const infoMetodoPago = document.getElementById("infoMetodoPago");

let enviandoPedido = false;

// -------------------- INICIO --------------------

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

// -------------------- RENDER CARRITO --------------------

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

// -------------------- MÉTODO DE PAGO --------------------

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

// -------------------- SUBMIT PEDIDO --------------------

form?.addEventListener("submit", async e => {
  e.preventDefault();
  if (enviandoPedido) return;
  enviandoPedido = true;

  const botonSubmit = form.querySelector("button[type='submit']");
  botonSubmit.disabled = true;
  mostrarCargando(true);

  try {
    const nombre = sanitize(form.nombreInput.value);
    const email = form.emailInput.value.trim();
    const telefono = form.telefonoInput.value.trim();
    const direccion = sanitize(form.direccionInput.value);
    const metodoPago = document.querySelector("input[name='metodoPago']:checked")?.value;

    if (!nombre || !email || !telefono || !direccion || !metodoPago) {
      throw new Error("❌ Todos los campos son obligatorios.");
    }

    if (!validarEmail(email)) throw new Error("❌ Email inválido.");
    if (!/^[0-9+\-\s]{7,20}$/.test(telefono)) throw new Error("❌ Teléfono inválido.");
    if (nombre.length < 3 || nombre.length > 50) throw new Error("❌ Nombre debe tener entre 3 y 50 caracteres.");
    if (direccion.length < 5 || direccion.length > 120) throw new Error("❌ Dirección muy corta o demasiado larga.");

    let total = 0;
    const items = [];

    for (const item of carrito) {
      const resProd = await fetch(`${API_BASE}/api/products/${item.id}`);
      const dataProd = await resProd.json();
      const producto = dataProd?.producto;

      if (!producto) throw new Error(`❌ Producto no encontrado: ${item.nombre}`);

      const talla = (item.talla || "").toLowerCase();
      const color = (item.color || "").toLowerCase();
      const cantidad = parseInt(item.cantidad) || 1;

      if (producto.variants?.length > 0) {
        const variante = producto.variants.find(v =>
          v.talla === talla && v.color === color && v.stock >= cantidad
        );
        if (!variante) throw new Error(`❌ Variante no disponible: ${item.nombre} - ${item.talla} - ${item.color}`);
      } else {
        const tallaValida = producto.sizes?.map(s => s.toLowerCase()).includes(talla);
        if (!tallaValida) throw new Error(`❌ Talla no válida para: ${item.nombre}`);
        if ((producto.stock || 0) < cantidad) throw new Error(`❌ Stock insuficiente: ${item.nombre}`);
      }

      const precio = parseFloat(item.precio) || 0;
      total += precio * cantidad;

      items.push({
        productId: item.id,
        name: sanitize(item.nombre),
        talla: sanitize(item.talla || ""),
        color: sanitize(item.color || ""),
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
      nota: "",
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

    if (data?.data?.codigoSeguimiento) {
      localStorage.setItem("codigoSeguimiento", data.data.codigoSeguimiento);
    }

    localStorage.setItem(LAST_ORDER_KEY, JSON.stringify(pedido));

    if (metodoPago === "transferencia") {
      mostrarMensaje("✅ Pedido registrado. Redirigiendo...", "success");
      localStorage.removeItem(STORAGE_KEY);
      abrirWhatsappConfirmacion(pedido);
      setTimeout(() => window.location.href = "/checkout-confirmacion.html", 3000);
    } else if (metodoPago === "paypal") {
      mostrarMensaje("✅ Redirigiendo a PayPal...", "success");

      const resPaypal = await fetch(API_PAYPAL_CREATE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ total })
      });

      const dataPaypal = await resPaypal.json();
      if (!resPaypal.ok || !dataPaypal.id) {
        throw new Error(dataPaypal.message || "❌ Error creando orden PayPal.");
      }

      localStorage.removeItem(STORAGE_KEY);
      window.location.href = `https://www.sandbox.paypal.com/checkoutnow?token=${dataPaypal.id}`;
    }

  } catch (err) {
    console.error("❌", err);
    mostrarMensaje(`❌ ${err.message}`, "error");
  } finally {
    finalizarEnvio();
  }
});

// -------------------- UBICACIÓN --------------------

btnUbicacion?.addEventListener("click", () => {
  if (!navigator.geolocation) return mostrarMensaje("⚠️ Tu navegador no soporta ubicación.", "warn");

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

// -------------------- UTILIDADES --------------------

function abrirWhatsappConfirmacion(pedido) {
  const mensaje = `
📦 *NUEVO PEDIDO*
👤 *Cliente:* ${pedido.nombreCliente}
📞 *Teléfono:* ${pedido.telefono}
📧 *Email:* ${pedido.email}
📍 *Dirección:* ${pedido.direccion}

🛍️ *Productos:*
${pedido.items.map(i => `• ${i.cantidad} x ${i.name} - Talla: ${i.talla} - Color: ${i.color} - $${(i.precio * i.cantidad).toFixed(2)}`).join("\n")}

💳 *Pago:* ${pedido.metodoPago}
💰 *Total:* $${pedido.total.toFixed(2)}
`.trim();

  const url = `https://wa.me/593990270864?text=${encodeURIComponent(mensaje)}`;
  window.open(url, "_blank");
}

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

function mostrarCargando(show = true) {
  msgEstado.innerHTML = show ? "⏳ Procesando... <span class='spinner'></span>" : "";
}

function finalizarEnvio() {
  form.querySelector("button[type='submit']").disabled = false;
  enviandoPedido = false;
  mostrarCargando(false);
}
