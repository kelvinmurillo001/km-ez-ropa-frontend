"use strict";

// 🔐 Utilidades comunes
import { verificarSesion, goBack, mostrarMensaje } from "./admin-utils.js";
import { API_BASE } from "./config.js";

// 🔗 Endpoints
const API_ORDERS = `${API_BASE}/api/orders`;

// 📌 DOM
const listaPedidos = document.getElementById("listaPedidos");
const filtroEstado = document.getElementById("filtroEstado");

// 🛡️ Verificar sesión y obtener token
const token = verificarSesion();

document.addEventListener("DOMContentLoaded", () => {
  cargarPedidos();
  filtroEstado?.addEventListener("change", cargarPedidos);

  // 🌙 Modo oscuro persistente
  if (localStorage.getItem("modoOscuro") === "true") {
    document.body.classList.add("modo-oscuro");
  }
});

// === 📦 Cargar Pedidos con Token ===
async function cargarPedidos() {
  try {
    const res = await fetch(API_ORDERS, {
      headers: { Authorization: `Bearer ${token}` }
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
  return estado === "todos" ? pedidos : pedidos.filter(p => (p.estado || "").toLowerCase() === estado);
}

// === 🖼️ Renderizar pedidos en tabla ===
function renderPedidos(pedidos) {
  if (!pedidos.length) {
    listaPedidos.innerHTML = `<p class="text-center">📭 No hay pedidos con este estado.</p>`;
    return;
  }

  const filas = pedidos.map(p => {
    const productos = p.items?.map(i => `👕 ${i.name} (x${i.cantidad})`).join("<br>") || "-";
    const total = typeof p.total === "number" ? `$${p.total.toFixed(2)}` : "$0.00";
    const fecha = new Date(p.createdAt).toLocaleDateString("es-EC", {
      day: "2-digit", month: "short", year: "numeric"
    });

    return `
      <tr>
        <td>${p.nombre || "-"}</td>
        <td>${p.email || "-"}</td>
        <td>${p.telefono || "-"}</td>
        <td>${fecha}</td>
        <td>${productos}</td>
        <td>${total}</td>
        <td>${formatearEstado(p.estado)}</td>
        <td>
          <select onchange="cambiarEstado('${p._id}', this.value)">
            ${generarOpcionesEstado(p.estado)}
          </select>
        </td>
      </tr>`;
  }).join("");

  listaPedidos.innerHTML = `
    <table class="tabla-pedidos">
      <thead>
        <tr>
          <th>Cliente</th>
          <th>Email</th>
          <th>Teléfono</th>
          <th>Fecha</th>
          <th>Productos</th>
          <th>Total</th>
          <th>Estado</th>
          <th>Acción</th>
        </tr>
      </thead>
      <tbody>${filas}</tbody>
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
    console.error("❌ Error actualizando estado:", err.message);
    mostrarMensaje("❌ No se pudo cambiar el estado", "error");
  }
}

// === 🎨 Opciones dinámicas del estado
function generarOpcionesEstado(actual) {
  const estados = ["pendiente", "en_proceso", "enviado", "cancelado"];
  return estados.map(e =>
    `<option value="${e}" ${e === actual ? "selected" : ""}>${formatearEstado(e)}</option>`
  ).join("");
}

// === 🎨 Formato visual de estado ===
function formatearEstado(estado) {
  switch ((estado || "").toLowerCase()) {
    case "pendiente": return "⏳ Pendiente";
    case "en_proceso": return "⚙️ En Proceso";
    case "enviado": return "📦 Enviado";
    case "cancelado": return "❌ Cancelado";
    default: return estado || "Desconocido";
  }
}

// ✅ Exponer funciones al HTML
window.goBack = goBack;
window.cambiarEstado = cambiarEstado;
