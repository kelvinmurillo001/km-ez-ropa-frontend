"use strict";

import { API_BASE } from "./config.js";
import {
  mostrarMensaje,
  getUsuarioSesionSeguro,
  cerrarSesionCliente
} from "./sesion-utils.js";

// 📌 Referencias del DOM
const listaPedidos = document.getElementById("listaPedidos");
const saludo = document.getElementById("saludoUsuario");
const cerrarSesionBtn = document.getElementById("cerrarSesionBtn");
const filtroEstado = document.getElementById("filtroEstado");

// Endpoint
const API_PEDIDOS = `${API_BASE}/api/orders/mis-pedidos`;

document.addEventListener("DOMContentLoaded", async () => {
  try {
    // 🔐 Verificar sesión activa de cliente
    const usuario = await getUsuarioSesionSeguro();
    if (!usuario) return;

    if (saludo) {
      saludo.textContent = `👤 Hola, ${sanitize(usuario.name || usuario.username || "Cliente")}`;
    }

    await cargarPedidos();

    cerrarSesionBtn?.addEventListener("click", cerrarSesionCliente);
    filtroEstado?.addEventListener("change", cargarPedidos);
  } catch (error) {
    console.error("❌ Error general en cliente.js:", error);
    mostrarMensaje("❌ Ocurrió un error inesperado.", "error");
  }
});

/**
 * 📦 Carga y renderiza los pedidos del usuario
 */
async function cargarPedidos() {
  if (!listaPedidos) return;

  listaPedidos.innerHTML = `<p class="text-center">⏳ Cargando pedidos...</p>`;
  const estadoFiltro = filtroEstado?.value?.trim().toLowerCase();

  try {
    const res = await fetch(API_PEDIDOS, { credentials: "include" });
    const data = await res.json();

    if (!res.ok || !Array.isArray(data.pedidos)) {
      throw new Error(data.message || "❌ No se pudieron cargar los pedidos.");
    }

    const pedidosFiltrados = estadoFiltro
      ? data.pedidos.filter(p => (p.estado || "").toLowerCase() === estadoFiltro)
      : data.pedidos;

    listaPedidos.innerHTML = pedidosFiltrados.length
      ? pedidosFiltrados.map(renderPedidoHTML).join("")
      : `<p class="text-center">📭 No hay pedidos con ese estado.</p>`;

    agregarEventosDetalles();
  } catch (err) {
    console.error("❌ Error al cargar pedidos:", err);
    listaPedidos.innerHTML = `<p class="text-center" style="color:red;">❌ ${sanitize(err.message)}</p>`;
  }
}

/**
 * 🧾 Renderiza el HTML de un pedido
 * @param {object} p - Pedido
 * @returns {string}
 */
function renderPedidoHTML(p) {
  const fecha = p.createdAt
    ? new Date(p.createdAt).toLocaleDateString("es-EC")
    : "--";
  const estado = traducirEstado(p.estado);
  const total = `$${parseFloat(p.total || 0).toFixed(2)}`;
  const id = p._id?.slice(-6)?.toUpperCase() || "XXXXXX";

  return `
    <div class="pedido-card" data-id="${sanitize(p._id)}" role="region" aria-label="Pedido ${id}">
      <p><strong>Pedido:</strong> #${id}</p>
      <p><strong>Fecha:</strong> ${fecha}</p>
      <p><strong>Total:</strong> ${total}</p>
      <p><strong>Estado:</strong> 
        <span class="estado-${sanitize(p.estado || "otro")}">${estado}</span>
      </p>
      <button class="btn-secundario ver-detalles">👁️ Ver Detalles</button>
    </div>
  `;
}

/**
 * 🧭 Asocia eventos a los botones de ver detalles
 */
function agregarEventosDetalles() {
  document.querySelectorAll(".ver-detalles").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const id = e.currentTarget.closest(".pedido-card")?.dataset?.id;
      if (id) window.location.href = `/detalle-pedido.html?id=${id}`;
    });
  });
}

/**
 * 🔁 Traduce estado técnico a texto legible
 * @param {string} estado
 * @returns {string}
 */
function traducirEstado(estado = "") {
  const estados = {
    pendiente: "⏳ Pendiente",
    procesando: "🛠️ Procesando",
    preparando: "🛠️ Preparando",
    enviado: "🚚 Enviado",
    entregado: "📬 Entregado",
    cancelado: "❌ Cancelado"
  };
  return estados[estado.toLowerCase()] || "🔘 Otro";
}

/**
 * 🧼 Previene XSS escapando texto
 * @param {string} text
 * @returns {string}
 */
function sanitize(text = "") {
  const div = document.createElement("div");
  div.textContent = String(text);
  return div.innerHTML.trim();
}
