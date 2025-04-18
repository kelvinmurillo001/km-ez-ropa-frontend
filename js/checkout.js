"use strict";

// ✅ Importar configuración
import { API_BASE } from "./config.js";

const STORAGE_KEY = "km_ez_cart";
let carrito = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

const resumenPedido = document.getElementById("resumenPedido");
const totalFinal = document.getElementById("totalFinal");
const form = document.getElementById("formCheckout");
const msgEstado = document.getElementById("msgEstado");

const API_ORDERS = `${API_BASE}/api/orders`;

// ▶️ Mostrar resumen
document.addEventListener("DOMContentLoaded", () => {
  if (carrito.length === 0) {
    resumenPedido.innerHTML = `<p>⚠️ Tu carrito está vacío.</p>`;
    totalFinal.textContent = "$0.00";
    form?.querySelector("button[type='submit']").disabled = true;
    return;
  }

  let total = 0;
  resumenPedido.innerHTML = carrito.map(item => {
    const nombre = sanitizeText(item.nombre);
    const talla = sanitizeText(item.talla || "Única");
    const cantidad = parseInt(item.cantidad) || 0;
    const precio = parseFloat(item.precio) || 0;
    const subtotal = precio * cantidad;
    total += subtotal;

    return `
      <div class="resumen-item">
        <p>👕 <strong>${nombre}</strong> | Talla: ${talla} | Cant: ${cantidad} | $${subtotal.toFixed(2)}</p>
      </div>
    `;
  }).join("");

  totalFinal.textContent = `$${total.toFixed(2)}`;
});

// ✅ Confirmar pedido
form?.addEventListener("submit", async e => {
  e.preventDefault();
  msgEstado.textContent = "⏳ Enviando pedido...";

  const nombre = document.getElementById("nombreInput").value.trim();
  const email = document.getElementById("emailInput").value.trim();
  const telefono = document.getElementById("telefonoInput").value.trim();
  const direccion = document.getElementById("direccionInput").value.trim();

  if (!nombre || !email || !telefono || !direccion) {
    msgEstado.textContent = "❌ Todos los campos son obligatorios.";
    return;
  }

  if (!validarEmail(email)) {
    msgEstado.textContent = "❌ Email inválido.";
    return;
  }

  if (!/^[0-9+\-\s]{7,15}$/.test(telefono)) {
    msgEstado.textContent = "❌ Teléfono inválido.";
    return;
  }

  const total = carrito.reduce((acc, item) =>
    acc + (parseFloat(item.precio) || 0) * (parseInt(item.cantidad) || 0), 0
  );

  const pedido = {
    nombreCliente: sanitizeText(nombre),
    email,
    telefono,
    nota: sanitizeText(direccion),
    total,
    items: carrito.map(item => ({
      productId: item.id,
      name: sanitizeText(item.nombre),
      talla: sanitizeText(item.talla),
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

    if (!res.ok) throw new Error("Error al enviar pedido");

    msgEstado.textContent = "✅ Pedido enviado con éxito. ¡Gracias por tu compra!";
    localStorage.removeItem(STORAGE_KEY);

    setTimeout(() => {
      window.location.href = "/index.html";
    }, 2500);

  } catch (err) {
    console.error("❌", err);
    msgEstado.textContent = "❌ No se pudo enviar el pedido. Intenta nuevamente.";
  }
});

// === VALIDACIONES ===
function validarEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  return regex.test(email);
}

// === Sanitización de texto
function sanitizeText(text) {
  const temp = document.createElement("div");
  temp.textContent = text;
  return temp.innerHTML;
}
