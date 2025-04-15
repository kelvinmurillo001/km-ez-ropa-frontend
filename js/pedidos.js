"use strict";

import { verificarSesion, goBack } from "./admin-utils.js";

const token = verificarSesion();
const API_PEDIDOS = "https://km-ez-ropa-backend.onrender.com/api/orders";

const listaPedidos = document.getElementById("listaPedidos");
const filtroEstado = document.getElementById("filtroEstado");

document.addEventListener("DOMContentLoaded", async () => {
  await cargarPedidos();
  filtroEstado.addEventListener("change", async () => await cargarPedidos(filtroEstado.value));
});

// 🚀 Obtener y renderizar pedidos
async function cargarPedidos(filtro = "todos") {
  try {
    const res = await fetch(API_PEDIDOS, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const pedidos = await res.json();

    const filtrados = filtro === "todos" ? pedidos : pedidos.filter(p => p.estado === filtro);
    renderTablaPedidos(filtrados);
  } catch (err) {
    console.error("❌ Error cargando pedidos:", err);
    listaPedidos.innerHTML = `<p style="color:red;">❌ Error al cargar pedidos.</p>`;
  }
}

// 📋 Renderizar pedidos
function renderTablaPedidos(pedidos) {
  if (!Array.isArray(pedidos) || pedidos.length === 0) {
    listaPedidos.innerHTML = `<p>No hay pedidos para mostrar.</p>`;
    return;
  }

  const tabla = document.createElement("table");
  tabla.className = "tabla-admin";

  tabla.innerHTML = `
    <thead>
      <tr>
        <th>#</th>
        <th>Cliente</th>
        <th>Fecha</th>
        <th>Total</th>
        <th>Estado</th>
        <th>Detalle</th>
      </tr>
    </thead>
    <tbody>
      ${pedidos.map((p, i) => `
        <tr>
          <td>${i + 1}</td>
          <td>${p.nombre || "Cliente"}</td>
          <td>${new Date(p.createdAt).toLocaleDateString("es-ES")}</td>
          <td>$${p.total}</td>
          <td>
            <select onchange="cambiarEstado('${p._id}', this.value)" class="select-estado">
              ${["pendiente", "en_proceso", "enviado", "cancelado"]
                .map(e => `<option value="${e}" ${p.estado === e ? "selected" : ""}>${capitalizar(e)}</option>`)
                .join("")}
            </select>
          </td>
          <td><button class="btn-secundario" onclick="verDetalle(${encodeURIComponent(JSON.stringify(p.items))})">👁️ Ver</button></td>
        </tr>
      `).join("")}
    </tbody>
  `;

  listaPedidos.innerHTML = "";
  listaPedidos.appendChild(tabla);
}

// 🔁 Cambiar estado del pedido
async function cambiarEstado(id, nuevoEstado) {
  try {
    const res = await fetch(`${API_PEDIDOS}/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ estado: nuevoEstado })
    });

    if (!res.ok) throw new Error("Error al cambiar estado");

    alert("✅ Estado actualizado correctamente.");
  } catch (err) {
    console.error(err);
    alert("❌ No se pudo actualizar el estado.");
  }
}

// 🔍 Mostrar detalles de pedido
window.verDetalle = function (items) {
  const parsed = typeof items === "string" ? JSON.parse(decodeURIComponent(items)) : items;
  const detalles = parsed.map(i =>
    `🛍️ ${i.name} - Talla: ${i.talla || "N/A"} - Cantidad: ${i.cantidad}`
  ).join("\n");

  alert(`📦 Productos:\n${detalles}`);
};

// 🔤 Capitalizar
function capitalizar(str) {
  return str.charAt(0).toUpperCase() + str.slice(1).replace("_", " ");
}

window.goBack = goBack;
