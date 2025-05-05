"use strict";

import { API_BASE } from "./config.js";
import { mostrarMensaje, verificarSesion, getUsuarioActivo } from "./admin-utils.js";

const API_PEDIDOS = `${API_BASE}/api/orders/mis-pedidos`;
const listaPedidos = document.getElementById("listaPedidos");
const saludo = document.getElementById("saludoUsuario");
const cerrarSesionBtn = document.getElementById("cerrarSesionBtn");

const token = verificarSesion();
const usuario = getUsuarioActivo();

document.addEventListener("DOMContentLoaded", () => {
  if (usuario) saludo.textContent = `👤 Hola, ${usuario.name}`;
  cargarPedidos();

  cerrarSesionBtn?.addEventListener("click", () => {
    localStorage.removeItem("km_ez_token");
    localStorage.removeItem("km_ez_user");
    window.location.href = "/";
  });
});

async function cargarPedidos() {
  try {
    const res = await fetch(API_PEDIDOS, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = await res.json();
    if (!res.ok || !Array.isArray(data.pedidos)) throw new Error(data.message || "No se pudieron cargar los pedidos");

    if (data.pedidos.length === 0) {
      listaPedidos.innerHTML = `<p class="text-center">📭 Aún no tienes pedidos registrados.</p>`;
      return;
    }

    listaPedidos.innerHTML = data.pedidos.map(pedidoHTML).join("");
  } catch (err) {
    console.error("❌ Error al cargar pedidos:", err);
    listaPedidos.innerHTML = `<p class="text-center" style="color:red;">❌ ${err.message}</p>`;
  }
}

function pedidoHTML(p) {
  const fecha = new Date(p.createdAt).toLocaleDateString();
  const estado = estadoBonito(p.estado);
  const total = `$${p.total?.toFixed(2) || "0.00"}`;
  const id = p._id?.slice(-6)?.toUpperCase() || "";

  return `
    <div class="pedido-card">
      <p><strong>Pedido:</strong> #${id}</p>
      <p><strong>Fecha:</strong> ${fecha}</p>
      <p><strong>Total:</strong> ${total}</p>
      <p><strong>Estado:</strong> <span class="estado-${p.estado}">${estado}</span></p>
      <button class="btn-secundario" onclick="verDetalles('${p._id}')">👁️ Ver Detalles</button>
    </div>
  `;
}

function estadoBonito(e = "") {
  const estados = {
    pendiente: "⏳ Pendiente",
    procesando: "🛠️ Procesando",
    enviado: "🚚 Enviado",
    entregado: "📬 Entregado",
    cancelado: "❌ Cancelado"
  };
  return estados[e] || e;
}

window.verDetalles = (id) => {
  if (id) {
    window.location.href = `/detalle-pedido.html?id=${id}`;
  }
};
