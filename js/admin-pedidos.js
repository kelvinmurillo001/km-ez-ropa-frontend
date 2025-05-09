"use strict";

import { API_BASE } from "./config.js";
import { mostrarMensaje } from "./admin-utils.js";

const API_ORDERS = `${API_BASE}/api/orders`;
const tablaPedidos = document.getElementById("tablaPedidos");

document.addEventListener("DOMContentLoaded", () => {
  cargarPedidos();
});

// 🚚 Cargar pedidos
async function cargarPedidos() {
  const token = localStorage.getItem("admin_token");
  if (!token || token.length < 10) {
    mostrarMensaje("❌ Token de admin no válido", "error");
    return;
  }

  try {
    const res = await fetch(API_ORDERS, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Error al obtener pedidos");

    renderPedidos(data.data || []);
  } catch (err) {
    console.error("❌ Error:", err);
    mostrarMensaje(err.message, "error");
  }
}

// 🖼️ Mostrar pedidos en tabla
function renderPedidos(pedidos = []) {
  if (!Array.isArray(pedidos) || pedidos.length === 0) {
    tablaPedidos.innerHTML = "<p class='text-warn text-center'>📭 No hay pedidos registrados.</p>";
    return;
  }

  const rowsHTML = pedidos
    .map(p => {
      const nombre = sanitize(p.nombreCliente);
      const fecha = new Date(p.createdAt).toLocaleDateString();
      const total = `$${p.total?.toFixed(2) || "0.00"}`;
      const estado = sanitize(p.estado || "pendiente");

      return `
        <tr data-id="${p._id}">
          <td>${nombre}</td>
          <td>${total}</td>
          <td>${estado}</td>
          <td>${fecha}</td>
          <td>
            <button class="btn btn-peq btn-rojo eliminar-btn">🗑️ Eliminar</button>
          </td>
        </tr>`;
    })
    .join("");

  tablaPedidos.innerHTML = `
    <table class="tabla">
      <thead>
        <tr>
          <th>Cliente</th>
          <th>Total</th>
          <th>Estado</th>
          <th>Fecha</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>${rowsHTML}</tbody>
    </table>
  `;
}

// 🚨 Delegación de eventos: eliminar pedido
tablaPedidos.addEventListener("click", async (e) => {
  const btn = e.target.closest(".eliminar-btn");
  if (!btn) return;

  const fila = btn.closest("tr");
  const id = fila?.dataset?.id;

  if (!id || !confirm("¿Estás seguro de eliminar este pedido?")) return;

  try {
    const res = await fetch(`${API_ORDERS}/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("admin_token")}`
      }
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Error eliminando pedido");

    mostrarMensaje("✅ Pedido eliminado exitosamente", "success");
    cargarPedidos();
  } catch (err) {
    console.error("❌", err);
    mostrarMensaje("❌ No se pudo eliminar el pedido", "error");
  }
});

// 🧼 Sanitizar texto para evitar XSS simples
function sanitize(text = "") {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML.trim();
}
