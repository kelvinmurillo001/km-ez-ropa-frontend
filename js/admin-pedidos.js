"use strict";

import { API_BASE } from "./config.js";
import { mostrarMensaje } from "./admin-utils.js";

const API_ORDERS = `${API_BASE}/api/orders`;
const tablaPedidos = document.getElementById("tablaPedidos");
const estadoPedidos = document.getElementById("estadoPedidos");

document.addEventListener("DOMContentLoaded", () => {
  cargarPedidos();
});

async function cargarPedidos() {
  try {
    const res = await fetch(API_ORDERS, {
      headers: { Authorization: `Bearer ${localStorage.getItem("admin_token")}` }
    });
    const data = await res.json();

    if (!res.ok) throw new Error(data.message);
    renderPedidos(data.data);
  } catch (err) {
    console.error("❌ Error:", err);
    mostrarMensaje(err.message, "error");
  }
}

function renderPedidos(pedidos = []) {
  if (pedidos.length === 0) {
    tablaPedidos.innerHTML = "<p class='text-warn text-center'>No hay pedidos aún.</p>";
    return;
  }

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
      <tbody>
        ${pedidos
          .map(p => {
            return `
              <tr>
                <td>${p.nombreCliente}</td>
                <td>$${p.total.toFixed(2)}</td>
                <td>${p.estado}</td>
                <td>${new Date(p.createdAt).toLocaleDateString()}</td>
                <td>
                  <button class="btn btn-peq btn-rojo" onclick="eliminarPedido('${p._id}')">🗑️ Eliminar</button>
                </td>
              </tr>`;
          })
          .join("")}
      </tbody>
    </table>
  `;
}

// 🗑️ Eliminar pedido
window.eliminarPedido = async (id) => {
  const confirmacion = confirm("¿Estás seguro de eliminar este pedido?");
  if (!confirmacion) return;

  try {
    const res = await fetch(`${API_ORDERS}/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${localStorage.getItem("admin_token")}` }
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message);

    mostrarMensaje("✅ Pedido eliminado", "success");
    cargarPedidos();
  } catch (err) {
    console.error("❌", err);
    mostrarMensaje("❌ No se pudo eliminar el pedido", "error");
  }
};
