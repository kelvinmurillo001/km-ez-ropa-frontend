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

async function cargarPedidos(token) {
  const contenedor = document.getElementById("misPedidosContainer");
  contenedor.innerHTML = "<p>⏳ Cargando pedidos...</p>";

  try {
    const res = await fetch(`${API_BASE}/api/orders/mis-pedidos`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Error al obtener pedidos");

    if (!Array.isArray(data.pedidos) || data.pedidos.length === 0) {
      contenedor.innerHTML = "<p>📭 No tienes pedidos aún.</p>";
      return;
    }

    contenedor.innerHTML = data.pedidos.map(pedidoCardHTML).join("");

  } catch (err) {
    console.error("❌", err);
    mostrarError("❌ No se pudieron cargar tus pedidos.");
  }
}

function pedidoCardHTML(p) {
  const fecha = new Date(p.createdAt).toLocaleDateString();
  const total = `$${parseFloat(p.total).toFixed(2)}`;
  const estado = p.estado || "pendiente";
  const seguimiento = p.codigoSeguimiento ? `<a href="/seguimiento.html?codigo=${p.codigoSeguimiento}" class="btn">📦 Ver seguimiento</a>` : "";

  return `
    <div class="pedido-card">
      <h3>Pedido #${p._id.slice(-6)}</h3>
      <p><strong>Fecha:</strong> ${fecha}</p>
      <p><strong>Total:</strong> ${total}</p>
      <p><strong>Estado:</strong> ${estado}</p>
      ${seguimiento}
    </div>`;
}

function mostrarError(msg) {
  document.getElementById("misPedidosContainer").innerHTML = `<p class="error">${msg}</p>`;
}
