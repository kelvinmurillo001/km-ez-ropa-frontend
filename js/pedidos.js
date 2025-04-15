"use strict";

import { verificarSesion, goBack, mostrarMensaje } from "./admin-utils.js";
import { API_BASE } from "./config.js";


// 🔐 Verificar sesión admin
const token = verificarSesion();

// 🔗 Endpoints
const API_ORDERS = "https://km-ez-ropa-backend.onrender.com/api/orders";

// DOM
const listaPedidos = document.getElementById("listaPedidos");
const filtroEstado = document.getElementById("filtroEstado");

document.addEventListener("DOMContentLoaded", () => {
  cargarPedidos();

  filtroEstado.addEventListener("change", cargarPedidos);
});

// === CARGAR TODOS LOS PEDIDOS ===
async function cargarPedidos() {
  try {
    const res = await fetch(API_ORDERS, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const pedidos = await res.json();

    if (!res.ok) throw new Error("Error al cargar pedidos");

    renderPedidos(filtrarPedidos(pedidos));
  } catch (err) {
    console.error("❌ Error cargando pedidos:", err);
    listaPedidos.innerHTML = `<p style="color:red; text-align:center;">❌ Error al cargar pedidos</p>`;
  }
}

// === FILTRAR PEDIDOS POR ESTADO ===
function filtrarPedidos(pedidos) {
  const estado = filtroEstado.value;
  if (estado === "todos") return pedidos;
  return pedidos.filter(p => p.estado === estado);
}

// === RENDER DE TABLA ===
function renderPedidos(pedidos) {
  if (!pedidos.length) {
    listaPedidos.innerHTML = "<p class='text-center'>🛑 No hay pedidos en este estado.</p>";
    return;
  }

  let html = `
    <table>
      <thead>
        <tr>
          <th>Cliente</th>
          <th>Email</th>
          <th>Productos</th>
          <th>Total</th>
          <th>Estado</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
  `;

  pedidos.forEach(p => {
    const productos = p.items?.map(i => `${i.name} (${i.quantity})`).join(", ") || "-";
    html += `
      <tr>
        <td>${p.nombre || "-"}</td>
        <td>${p.email || "-"}</td>
        <td>${productos}</td>
        <td>$${p.total?.toFixed(2) || "0.00"}</td>
        <td>${formatearEstado(p.estado)}</td>
        <td>
          <select onchange="cambiarEstado('${p._id}', this.value)">
            <option value="">Estado</option>
            <option value="pendiente">Pendiente</option>
            <option value="en_proceso">En Proceso</option>
            <option value="enviado">Enviado</option>
            <option value="cancelado">Cancelado</option>
          </select>
        </td>
      </tr>
    `;
  });

  html += "</tbody></table>";
  listaPedidos.innerHTML = html;
}

// === CAMBIAR ESTADO DE PEDIDO ===
async function cambiarEstado(id, nuevoEstado) {
  if (!nuevoEstado) return;

  try {
    const res = await fetch(`${API_ORDERS}/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ estado: nuevoEstado })
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.message || "Error al actualizar");

    mostrarMensaje("✅ Pedido actualizado", "success");
    cargarPedidos();
  } catch (err) {
    console.error("❌ Error actualizando estado:", err);
    mostrarMensaje("❌ No se pudo cambiar el estado", "error");
  }
}

// === FORMATEAR NOMBRE DE ESTADO ===
function formatearEstado(estado) {
  switch (estado) {
    case "pendiente": return "⏳ Pendiente";
    case "en_proceso": return "⚙️ En Proceso";
    case "enviado": return "📦 Enviado";
    case "cancelado": return "❌ Cancelado";
    default: return estado;
  }
}

// ✅ Botón de regreso
window.goBack = goBack;
window.cambiarEstado = cambiarEstado;
