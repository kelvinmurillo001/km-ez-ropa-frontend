"use strict";

const STORAGE_KEY = "km_ez_cart";
const carrito = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
const resumenPedido = document.getElementById("resumenPedido");
const totalFinal = document.getElementById("totalFinal");
const form = document.getElementById("formCheckout");
const msgEstado = document.getElementById("msgEstado");

const API_ORDERS = "https://km-ez-ropa-backend.onrender.com/api/orders";

// ▶️ Mostrar resumen
document.addEventListener("DOMContentLoaded", () => {
  if (carrito.length === 0) {
    resumenPedido.innerHTML = `<p>⚠️ Tu carrito está vacío.</p>`;
    totalFinal.textContent = "$0.00";
    form.querySelector("button[type='submit']").disabled = true;
    return;
  }

  let total = 0;
  resumenPedido.innerHTML = carrito.map(item => {
    const subtotal = item.precio * item.cantidad;
    total += subtotal;
    return `
      <div class="resumen-item">
        <p>👕 <strong>${item.nombre}</strong> | Talla: ${item.talla || "Única"} | Cant: ${item.cantidad} | $${subtotal.toFixed(2)}</p>
      </div>
    `;
  }).join("");

  totalFinal.textContent = `$${total.toFixed(2)}`;
});

// ✅ Confirmar pedido
form.addEventListener("submit", async e => {
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

  const pedido = {
    nombreCliente: nombre,
    email,
    telefono,
    nota: direccion,
    total: carrito.reduce((acc, item) => acc + item.precio * item.cantidad, 0),
    items: carrito.map(item => ({
      productId: item.id,
      name: item.nombre,
      talla: item.talla,
      cantidad: item.cantidad,
      precio: item.precio
    }))
  };

  try {
    console.log("📦 Pedido a enviar:", JSON.stringify(pedido, null, 2)); // prueba

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
