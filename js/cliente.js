"use strict";

// ✅ Importar utilidades necesarias
import { API_BASE } from "./config.js";
import { mostrarMensaje, verificarSesion, getUsuarioActivo } from "./admin-utils.js";

// 🌐 Endpoints
const API_PEDIDOS = `${API_BASE}/api/orders/mis-pedidos`;

// 📌 Elementos del DOM
const listaPedidos = document.getElementById("listaPedidos");
const saludo = document.getElementById("saludoUsuario");
const cerrarSesionBtn = document.getElementById("cerrarSesionBtn");
const filtroEstado = document.getElementById("filtroEstado");

// 🔐 Validar sesión
const token = verificarSesion();
const usuario = getUsuarioActivo();

// ▶️ Al cargar el documento
document.addEventListener("DOMContentLoaded", () => {
  if (usuario && saludo) {
    saludo.textContent = `👤 Hola, ${sanitize(usuario.name)}`;
  }

  cargarPedidos();

  cerrarSesionBtn?.addEventListener("click", () => {
    if (confirm("¿Cerrar sesión?")) {
      localStorage.removeItem("km_ez_token");
      localStorage.removeItem("km_ez_user");
      window.location.href = "/";
    }
  });

  filtroEstado?.addEventListener("change", cargarPedidos);
});

/**
 * 🚚 Cargar pedidos del usuario autenticado
 */
async function cargarPedidos() {
  const estadoFiltrado = filtroEstado?.value?.trim().toLowerCase();

  try {
    const res = await fetch(API_PEDIDOS, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await res.json();

    if (!res.ok || !Array.isArray(data.pedidos)) {
      throw new Error(data.message || "No se pudieron cargar los pedidos.");
    }

    const pedidos = estadoFiltrado
      ? data.pedidos.filter(p => (p.estado || "").toLowerCase() === estadoFiltrado)
      : data.pedidos;

    if (pedidos.length === 0) {
      listaPedidos.innerHTML = `<p class="text-center">📭 No hay pedidos con ese estado.</p>`;
      return;
    }

    listaPedidos.innerHTML = pedidos.map(pedidoHTML).join("");
  } catch (err) {
    console.error("❌ Error al cargar pedidos:", err);
    listaPedidos.innerHTML = `<p class="text-center" style="color:red;">❌ ${err.message}</p>`;
  }
}

/**
 * 🧾 Generar HTML de cada pedido
 * @param {object} p - Pedido
 * @returns {string} - HTML
 */
function pedidoHTML(p) {
  const fecha = new Date(p.createdAt).toLocaleDateString("es-EC");
  const estado = estadoBonito(p.estado);
  const total = `$${p.total?.toFixed(2) || "0.00"}`;
  const id = p._id?.slice(-6)?.toUpperCase() || "XXXXXX";

  return `
    <div class="pedido-card" role="region" aria-label="Pedido ${id}">
      <p><strong>Pedido:</strong> #${id}</p>
      <p><strong>Fecha:</strong> ${fecha}</p>
      <p><strong>Total:</strong> ${total}</p>
      <p><strong>Estado:</strong> <span class="estado-${p.estado || 'otro'}">${estado}</span></p>
      <button class="btn-secundario" onclick="verDetalles('${p._id}')">👁️ Ver Detalles</button>
    </div>
  `;
}

/**
 * ✅ Traducir estado a formato legible con ícono
 * @param {string} e - Estado interno
 * @returns {string}
 */
function estadoBonito(e = "") {
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
 * 🔍 Redirigir a la vista de detalles del pedido
 */
window.verDetalles = (id) => {
  if (id) {
    window.location.href = `/detalle-pedido.html?id=${id}`;
  }
};

/**
 * 🧼 Sanitizar texto contra inyecciones simples
 */
function sanitize(text = "") {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML.trim();
}
