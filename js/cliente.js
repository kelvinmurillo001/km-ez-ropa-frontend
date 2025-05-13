"use strict";

import { API_BASE } from "./config.js";
import { mostrarMensaje } from "./sesion-utils.js";

// 📌 Elementos del DOM
const listaPedidos = document.getElementById("listaPedidos");
const saludo = document.getElementById("saludoUsuario");
const cerrarSesionBtn = document.getElementById("cerrarSesionBtn");
const filtroEstado = document.getElementById("filtroEstado");

// Endpoints
const API_ME = `${API_BASE}/auth/me`;
const API_PEDIDOS = `${API_BASE}/api/orders/mis-pedidos`;

document.addEventListener("DOMContentLoaded", async () => {
  const usuario = await obtenerUsuario();

  if (!usuario) {
    mostrarMensaje("🔒 Sesión no iniciada. Redirigiendo...", "error");
    setTimeout(() => (window.location.href = "/login.html"), 1500);
    return;
  }

  if (saludo) {
    saludo.textContent = `👤 Hola, ${sanitize(usuario.name || usuario.username || "Cliente")}`;
  }

  await cargarPedidos();

  cerrarSesionBtn?.addEventListener("click", async () => {
    try {
      await fetch(`${API_BASE}/auth/logout`, { credentials: "include" });
    } catch (err) {
      console.warn("⚠️ Error al cerrar sesión:", err);
    } finally {
      window.location.href = "/login.html";
    }
  });

  filtroEstado?.addEventListener("change", cargarPedidos);
});

/**
 * 🔐 Obtiene los datos del usuario autenticado
 * @returns {Promise<object|null>}
 */
async function obtenerUsuario() {
  try {
    const res = await fetch(API_ME, { credentials: "include" });
    const data = await res.json();
    return res.ok ? data.user : null;
  } catch (err) {
    console.error("❌ Error al obtener usuario:", err);
    return null;
  }
}

/**
 * 📦 Cargar pedidos del usuario
 */
async function cargarPedidos() {
  if (!listaPedidos) return;

  const estadoFiltro = filtroEstado?.value?.trim().toLowerCase();

  try {
    const res = await fetch(API_PEDIDOS, { credentials: "include" });
    const data = await res.json();

    if (!res.ok || !Array.isArray(data.pedidos)) {
      throw new Error(data.message || "❌ No se pudieron cargar los pedidos.");
    }

    const pedidos = estadoFiltro
      ? data.pedidos.filter(p => (p.estado || "").toLowerCase() === estadoFiltro)
      : data.pedidos;

    listaPedidos.innerHTML = pedidos.length
      ? pedidos.map(renderPedidoHTML).join("")
      : `<p class="text-center">📭 No hay pedidos con ese estado.</p>`;

    // Agregar eventos a botones
    document.querySelectorAll(".ver-detalles").forEach(btn => {
      btn.addEventListener("click", e => {
        const id = e.currentTarget.closest(".pedido-card")?.dataset?.id;
        if (id) window.location.href = `/detalle-pedido.html?id=${id}`;
      });
    });

  } catch (err) {
    console.error("❌ Error al cargar pedidos:", err);
    listaPedidos.innerHTML = `<p class="text-center" style="color:red;">❌ ${sanitize(err.message)}</p>`;
  }
}

/**
 * 🧾 Genera el HTML de un pedido
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
 * 🔁 Traduce un estado técnico en una representación legible
 * @param {string} e
 * @returns {string}
 */
function traducirEstado(e = "") {
  const estados = {
    pendiente: "⏳ Pendiente",
    procesando: "🛠️ Procesando",
    preparando: "🛠️ Preparando",
    enviado: "🚚 Enviado",
    entregado: "📬 Entregado",
    cancelado: "❌ Cancelado"
  };
  return estados[e.toLowerCase()] || "🔘 Otro";
}

/**
 * 🧼 Escapa texto para evitar XSS
 * @param {string} text
 * @returns {string}
 */
function sanitize(text = "") {
  const div = document.createElement("div");
  div.textContent = String(text);
  return div.innerHTML.trim();
}
