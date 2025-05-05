"use strict";

import { API_BASE } from "./config.js";
import { verificarSesion, mostrarMensaje } from "./admin-utils.js";

const token = verificarSesion();
const pedidoId = new URLSearchParams(window.location.search).get("id");
const container = document.getElementById("pedidoDetalle");

document.addEventListener("DOMContentLoaded", () => {
  if (!pedidoId) {
    container.innerHTML = "<p class='text-center' style='color:red;'>❌ Pedido no válido</p>";
    return;
  }

  cargarDetallePedido();
});

async function cargarDetallePedido() {
  try {
    const res = await fetch(`${API_BASE}/api/orders/${pedidoId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = await res.json();
    if (!res.ok || !data.pedido) throw new Error(data.message || "Pedido no encontrado");

    renderizarDetalle(data.pedido);
  } catch (err) {
    console.error("❌ Error al obtener pedido:", err);
    container.innerHTML = `<p class="text-center" style="color:red;">❌ ${err.message}</p>`;
  }
}

function renderizarDetalle(p) {
  const fecha = new Date(p.createdAt).toLocaleDateString();
  const estado = estadoBonito(p.estado);
  const total = `$${p.total?.toFixed(2) || "0.00"}`;
  const productos = p.items || [];

  const productosHTML = productos.map(item => {
    const imagen = item.imagen || "/assets/logo.jpg";
    return `
      <div class="producto-detalle">
        <img src="${imagen}" alt="${item.nombre}" />
        <div>
          <p><strong>${item.nombre}</strong></p>
          <p>Talla: ${item.talla || "-"}</p>
          <p>Color: ${item.color || "-"}</p>
          <p>Cantidad: ${item.cantidad}</p>
          <p>Subtotal: $${(item.precio * item.cantidad).toFixed(2)}</p>
        </div>
      </div>`;
  }).join("");

  container.innerHTML = `
    <div class="info-principal">
      <p><strong>Pedido ID:</strong> #${p._id.slice(-6).toUpperCase()}</p>
      <p><strong>Fecha:</strong> ${fecha}</p>
      <p><strong>Estado:</strong> <span class="estado-${p.estado}">${estado}</span></p>
      <p><strong>Total:</strong> ${total}</p>
    </div>

    <h3 class="text-center mt-2">🧾 Productos</h3>
    <div class="productos-lista">${productosHTML}</div>

    <div class="mt-3 text-center">
      <a href="/cliente.html" class="btn-secundario">🔙 Volver a mis pedidos</a>
    </div>
  `;
}

function estadoBonito(e = "") {
  const estados = {
    pendiente: "⏳ Pendiente",
    procesando: "🛠️ Procesando",
    enviado: "🚚 Enviado",
    entregado: "📬 Entregado",
    cancelado: "❌ Cancelado"
  };
  return estados[e] || e;
}
