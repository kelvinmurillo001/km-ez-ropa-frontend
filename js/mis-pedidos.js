"use strict";

import { API_BASE } from "./config.js";

document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("km_ez_token");
  if (!token || token.length < 20) {
    mostrarError("🔐 Debes iniciar sesión para ver tus pedidos.");
    return;
  }

  cargarPedidos(token);
});

/**
 * Carga los pedidos y los muestra en el contenedor
 */
async function cargarPedidos(token) {
  const contenedor = document.getElementById("misPedidosContainer");
  if (!contenedor) return;

  contenedor.innerHTML = "<p>⏳ Cargando pedidos...</p>";

  try {
    const res = await fetch(`${API_BASE}/api/orders/mis-pedidos`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.message || "Error al obtener pedidos");

    const pedidos = Array.isArray(data.pedidos) ? data.pedidos : [];

    contenedor.innerHTML = pedidos.length
      ? pedidos.map(renderPedidoCard).join("")
      : `<p class="info text-center">📭 No tienes pedidos aún.</p>`;

  } catch (err) {
    console.error("❌ Error al cargar pedidos:", err);
    mostrarError("❌ No se pudieron cargar tus pedidos. Intenta nuevamente.");
  }
}

/**
 * Renderiza una tarjeta HTML por pedido
 */
function renderPedidoCard(p) {
  const fecha = new Date(p.createdAt).toLocaleDateString("es-EC", {
    year: "numeric", month: "short", day: "numeric"
  });

  const total = `$${Number(p.total || 0).toFixed(2)}`;
  const estado = estadoBonito(p.estado || "pendiente");
  const idCorto = sanitize(p._id?.slice(-6)?.toUpperCase() || "XXXXXX");

  const seguimientoHTML = p.codigoSeguimiento
    ? `<a href="/seguimiento.html?codigo=${encodeURIComponent(p.codigoSeguimiento)}" class="btn" aria-label="Ver seguimiento del pedido">📦 Ver seguimiento</a>`
    : `<span class="text-muted">🔍 Seguimiento no disponible</span>`;

  return `
    <div class="pedido-card fade-in" role="region" aria-label="Pedido ${idCorto}">
      <h3>📦 Pedido #${idCorto}</h3>
      <p><strong>📅 Fecha:</strong> ${fecha}</p>
      <p><strong>💰 Total:</strong> ${total}</p>
      <p><strong>📌 Estado:</strong> <span class="estado-${sanitize(p.estado)}">${estado}</span></p>
      <div class="acciones mt-1">${seguimientoHTML}</div>
    </div>`;
}

/**
 * Convierte estados técnicos en etiquetas amigables
 */
function estadoBonito(estado = "") {
  const estados = {
    pendiente: "⏳ Pendiente",
    procesando: "🛠️ En proceso",
    enviado: "🚚 Enviado",
    entregado: "📬 Entregado",
    cancelado: "❌ Cancelado"
  };
  return estados[estado.toLowerCase()] || capitalize(estado);
}

/**
 * Capitaliza la primera letra
 */
function capitalize(str = "") {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Protege texto dinámico contra XSS
 */
function sanitize(text = "") {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML.trim();
}

/**
 * Muestra un mensaje de error accesible
 */
function mostrarError(msg) {
  const contenedor = document.getElementById("misPedidosContainer");
  if (!contenedor) return;
  contenedor.innerHTML = `<p class="error text-center" role="alert" aria-live="assertive">${sanitize(msg)}</p>`;
}
