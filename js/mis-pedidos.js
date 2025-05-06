"use strict";

import { API_BASE } from "./config.js";

document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("km_ez_token");

  if (!token) {
    mostrarError("🔐 Debes iniciar sesión para ver tus pedidos.");
    return;
  }

  cargarPedidos(token);
});

/**
 * Obtiene los pedidos del usuario autenticado y los muestra
 */
async function cargarPedidos(token) {
  const contenedor = document.getElementById("misPedidosContainer");
  contenedor.innerHTML = "<p>⏳ Cargando pedidos...</p>";

  try {
    const res = await fetch(`${API_BASE}/api/orders/mis-pedidos`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data?.message || "Error al obtener pedidos");
    }

    if (!Array.isArray(data.pedidos) || data.pedidos.length === 0) {
      contenedor.innerHTML = "<p class='info'>📭 No tienes pedidos aún.</p>";
      return;
    }

    contenedor.innerHTML = data.pedidos.map(renderPedidoCard).join("");

  } catch (err) {
    console.error("❌ Error al cargar pedidos:", err);
    mostrarError("❌ No se pudieron cargar tus pedidos. Intenta nuevamente.");
  }
}

/**
 * Renderiza una tarjeta HTML con la información de un pedido
 * @param {object} p - Pedido
 * @returns {string} HTML
 */
function renderPedidoCard(p) {
  const fecha = new Date(p.createdAt).toLocaleDateString("es-EC", {
    year: "numeric", month: "short", day: "numeric"
  });

  const total = `$${Number(p.total || 0).toFixed(2)}`;
  const estado = (p.estado || "pendiente").toUpperCase();
  const seguimientoHTML = p.codigoSeguimiento
    ? `<a href="/seguimiento.html?codigo=${encodeURIComponent(p.codigoSeguimiento)}" class="btn" aria-label="Ver seguimiento del pedido">📦 Ver seguimiento</a>`
    : `<span class="text-muted">🔍 Seguimiento no disponible</span>`;

  return `
    <div class="pedido-card" role="region" aria-label="Pedido ${p._id.slice(-6)}">
      <h3>Pedido #${p._id.slice(-6)}</h3>
      <p><strong>📅 Fecha:</strong> ${fecha}</p>
      <p><strong>💰 Total:</strong> ${total}</p>
      <p><strong>📌 Estado:</strong> ${estado}</p>
      <div class="acciones">${seguimientoHTML}</div>
    </div>`;
}

/**
 * Muestra un mensaje de error estilizado
 * @param {string} msg - Mensaje
 */
function mostrarError(msg) {
  const contenedor = document.getElementById("misPedidosContainer");
  contenedor.innerHTML = `<p class="error text-center" role="alert" aria-live="assertive">${msg}</p>`;
}
