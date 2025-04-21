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
  if (listaPedidos) cargarPedidos();
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

    if (!res.ok) throw new Error("Error al cargar pedidos");
    const data = await res.json();

    const pedidosFiltrados = aplicarFiltro(data);
    renderPedidos(pedidosFiltrados);

  } catch (err) {
    console.error("❌ Error cargando pedidos:", err.message);
    listaPedidos.innerHTML = `<p class="text-center" style="color:red;">❌ No se pudo cargar los pedidos</p>`;
  }
}

// === 🔍 Aplicar filtro por estado ===
function aplicarFiltro(pedidos = []) {
  const estado = filtroEstado?.value || "todos";
  return estado === "todos"
    ? pedidos
    : pedidos.filter(p => (p.estado || "").toLowerCase() === estado);
}

// === 🖼️ Renderizar pedidos en tabla ===
function renderPedidos(pedidos = []) {
  if (!pedidos.length) {
    listaPedidos.innerHTML = `<p class="text-center">📭 No hay pedidos con este estado.</p>`;
    return;
  }

  pedidos.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const filas = pedidos.map(p => {
    const productos = p.items?.map(i =>
      `👕 <strong>${i.name}</strong> (${i.talla || "Única"}) x${i.cantidad}`
    ).join("<br>") || "-";

    const total = typeof p.total === "number" ? `$${p.total.toFixed(2)}` : "$0.00";
    const fecha = new Date(p.createdAt).toLocaleString("es-EC", {
      day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
    });

    const cliente = sanitize(p.nombreCliente || "Sin nombre");
    const nota = sanitize(p.nota || "-");

    const linkWA = p.metodoPago === "transferencia"
      ? generarLinkWhatsapp(p)
      : "";

    return `
      <tr>
        <td>${cliente}</td>
        <td>${nota}</td>
        <td>${fecha}</td>
        <td>${productos}</td>
        <td>${total}</td>
        <td>${formatearEstado(p.estado)}</td>
        <td>
          <select onchange="cambiarEstado('${p._id}', this)" class="select-estado">
            ${generarOpcionesEstado(p.estado)}
          </select>
          ${linkWA}
        </td>
      </tr>`;
  }).join("");

  listaPedidos.innerHTML = `
    <table class="tabla-admin">
      <thead>
        <tr>
          <th>Cliente</th>
          <th>Nota</th>
          <th>Fecha</th>
          <th>Productos</th>
          <th>Total</th>
          <th>Estado</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>${filas}</tbody>
    </table>`;
}

// === 🔁 Cambiar estado del pedido ===
window.cambiarEstado = async (id, selectElem) => {
  const nuevoEstado = selectElem.value;
  if (!nuevoEstado) return;

  selectElem.disabled = true;

  try {
    const res = await fetch(`${API_ORDERS}/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ estado: nuevoEstado })
    });

    if (!res.ok) throw new Error("Error al actualizar el estado");

    mostrarMensaje("✅ Estado actualizado correctamente", "success");
    cargarPedidos(); // Refrescar lista

  } catch (err) {
    console.error("❌ Error actualizando estado:", err.message);
    mostrarMensaje("❌ No se pudo cambiar el estado", "error");
  } finally {
    selectElem.disabled = false;
  }
};

// === 🎨 Opciones dinámicas del estado
function generarOpcionesEstado(actual) {
  const estados = ["pendiente", "en_proceso", "enviado", "cancelado"];
  return estados.map(e =>
    `<option value="${e}" ${e === actual ? "selected" : ""}>${formatearEstado(e)}</option>`
  ).join("");
}

// === 🎨 Formato visual de estado
function formatearEstado(estado) {
  switch ((estado || "").toLowerCase()) {
    case "pendiente": return "⏳ Pendiente";
    case "en_proceso": return "⚙️ En Proceso";
    case "enviado": return "📦 Enviado";
    case "cancelado": return "❌ Cancelado";
    default: return estado || "Desconocido";
  }
}

// ✅ Enlace para contacto por WhatsApp
function generarLinkWhatsapp(pedido) {
  const productos = pedido.items?.map(i =>
    `• ${i.cantidad}x ${i.name} (${i.talla})`
  ).join("\n") || "";

  const texto = encodeURIComponent(`

📦 Pedido de ${pedido.nombreCliente}
📧 ${pedido.email}
📞 ${pedido.telefono}
📍 ${pedido.direccion}

${productos}

💰 Total: $${pedido.total?.toFixed(2) || "0.00"}
💳 Pago: Transferencia
  `);

  return `
    <a href="https://wa.me/593990270864?text=${texto}" target="_blank" class="btn btn-wsp mt-1">💬 WhatsApp</a>
  `;
}

// ✅ Sanitizar texto para prevenir XSS
function sanitize(text) {
  const temp = document.createElement("div");
  temp.textContent = text;
  return temp.innerHTML;
}

// ✅ Exponer funciones
window.goBack = goBack;
