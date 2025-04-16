"use strict";

// 🔐 Importaciones necesarias
import { verificarSesion, goBack, mostrarMensaje } from "./admin-utils.js";
import { API_BASE } from "./config.js";

// 🔗 Endpoints
const API_ORDERS = `${API_BASE}/api/orders`;

// 📌 Variables del DOM
const listaPedidos = document.getElementById("listaPedidos");
const filtroEstado = document.getElementById("filtroEstado");

// 🛡️ Verificar sesión y obtener token
const token = verificarSesion();

document.addEventListener("DOMContentLoaded", () => {
  cargarPedidos();

  filtroEstado?.addEventListener("change", cargarPedidos);
});

// === 📦 Cargar Pedidos con Token ===
async function cargarPedidos() {
  try {
    const res = await fetch(API_ORDERS, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.message || "Error al cargar pedidos");

    const pedidosFiltrados = aplicarFiltro(data);
    renderPedidos(pedidosFiltrados);

  } catch (err) {
    console.error("❌ Error cargando pedidos:", err.message);
    listaPedidos.innerHTML = `<p class="text-center" style="color:red;">❌ No se pudo cargar los pedidos</p>`;
  }
}

// === 🔍 Aplicar filtro por estado ===
function aplicarFiltro(pedidos) {
  const estado = filtroEstado.value;
  return estado === "todos" ? pedidos : pedidos.filter(p => p.estado === estado);
}

// === 🧾 Renderizar pedidos ===
function renderPedidos(pedidos) {
  if (!pedidos.length) {
    listaPedidos.innerHTML = `<p class="text-center">📭 No hay pedidos con este estado.</p>`;
    return;
  }

  const filas = pedidos.map(p => {
    const productos = p.items?.map(i => `${i.name} (${i.quantity})`).join(", ") || "-";
    const total = p.total?.toFixed(2) || "0.00";

    return `
      <tr>
        <td>${p.nombre || "-"}</td>
        <td>${p.email || "-"}</td>
        <td>${productos}</td>
        <td>$${total}</td>
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
      </tr>`;
  }).join("");

  listaPedidos.innerHTML = `
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
        ${filas}
      </tbody>
    </table>`;
}

// === 🔁 Cambiar estado del pedido ===
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

    if (!res.ok) throw new Error(data.message || "Error al actualizar el estado");

    mostrarMensaje("✅ Estado actualizado correctamente", "success");
    cargarPedidos();

  } catch (err) {
    console.error("❌ Error actualizando pedido:", err.message);
    mostrarMensaje("❌ No se pudo cambiar el estado", "error");
  }
}

// === 🎨 Formato de estado visual ===
function formatearEstado(estado) {
  switch (estado) {
    case "pendiente": return "⏳ Pendiente";
    case "en_proceso": return "⚙️ En Proceso";
    case "enviado": return "📦 Enviado";
    case "cancelado": return "❌ Cancelado";
    default: return estado || "Desconocido";
  }
}

// ✅ Exponer funciones globales
window.goBack = goBack;
window.cambiarEstado = cambiarEstado;
