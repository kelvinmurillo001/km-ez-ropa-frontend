"use strict";

import { API_BASE } from "./config.js";
import { verificarSesion, mostrarMensaje } from "./admin-utils.js";

const token = verificarSesion();
const pedidoId = new URLSearchParams(window.location.search).get("id");
const container = document.getElementById("pedidoDetalle");

document.addEventListener("DOMContentLoaded", () => {
  if (!pedidoId || pedidoId.length < 8) {
    mostrarError("❌ Pedido no válido.");
    return;
  }

  cargarDetallePedido();
});

/**
 * 📦 Obtener y mostrar detalle del pedido
 */
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
    mostrarError(`❌ ${err.message}`);
  }
}

/**
 * 🎨 Renderiza la vista del pedido
 * @param {object} p - Pedido
 */
function renderizarDetalle(p) {
  const fecha = new Date(p.createdAt).toLocaleDateString("es-ES", {
    day: "numeric", month: "long", year: "numeric"
  });

  const estado = estadoBonito(p.estado);
  const total = `$${p.total?.toFixed(2) || "0.00"}`;
  const productos = Array.isArray(p.items) ? p.items : [];

  const productosHTML = productos.map(item => {
    const imagen = sanitize(item.imagen || "/assets/logo.jpg");
    const subtotal = (item.precio * item.cantidad).toFixed(2);

    return `
      <div class="producto-detalle fade-in" role="listitem" aria-label="Producto: ${sanitize(item.nombre)}">
        <img src="${imagen}" alt="${sanitize(item.nombre)}" loading="lazy"
             onerror="this.src='/assets/logo.jpg'; this.alt='Imagen no disponible';" />
        <div>
          <p><strong>${sanitize(item.nombre)}</strong></p>
          <p>Talla: ${sanitize(item.talla || "-")}</p>
          <p>Color: ${sanitize(item.color || "-")}</p>
          <p>Cantidad: ${item.cantidad}</p>
          <p>Subtotal: $${subtotal}</p>
        </div>
      </div>`;
  }).join("");

  container.innerHTML = `
    <section class="info-principal" aria-label="Información general del pedido">
      <p><strong>Pedido ID:</strong> #${p._id.slice(-6).toUpperCase()}</p>
      <p><strong>Fecha:</strong> ${fecha}</p>
      <p><strong>Estado:</strong> <span class="estado-${p.estado}">${estado}</span></p>
      <p><strong>Total:</strong> ${total}</p>
    </section>

    <h3 class="text-center mt-2">🧾 Productos incluidos</h3>
    <div class="productos-lista" role="list" aria-label="Lista de productos del pedido">
      ${productosHTML}
    </div>

    <div class="mt-3 text-center">
      <a href="/cliente.html" class="btn-secundario" aria-label="Volver a mis pedidos">🔙 Volver a mis pedidos</a>
    </div>
  `;
}

/**
 * 🧼 Sanitizar entrada para evitar XSS
 */
function sanitize(str = "") {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

/**
 * 📍 Formatea estado con ícono
 */
function estadoBonito(estado = "") {
  const estados = {
    pendiente: "⏳ Pendiente",
    procesando: "🛠️ Procesando",
    preparando: "🔧 Preparando",
    enviado: "🚚 Enviado",
    entregado: "📬 Entregado",
    cancelado: "❌ Cancelado"
  };
  return estados[estado.toLowerCase()] || capitalize(estado);
}

/**
 * 🔠 Capitalizar primera letra
 */
function capitalize(str = "") {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * ⚠️ Mostrar mensaje de error en el DOM
 */
function mostrarError(mensaje) {
  container.innerHTML = `<p class="text-center" style="color:red;">${mensaje}</p>`;
}
