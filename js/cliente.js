"use strict";

import { API_BASE } from "./config.js";
import { mostrarMensaje } from "./sesion-utils.js";

// 📌 Elementos del DOM
const listaPedidos = document.getElementById("listaPedidos");
const saludo = document.getElementById("saludoUsuario");
const cerrarSesionBtn = document.getElementById("cerrarSesionBtn");
const filtroEstado = document.getElementById("filtroEstado");

const API_ME = `${API_BASE}/auth/me`;
const API_PEDIDOS = `${API_BASE}/api/orders/mis-pedidos`;

// ▶️ Al cargar el documento
document.addEventListener("DOMContentLoaded", async () => {
  const usuario = await obtenerUsuario();

  if (!usuario) {
    mostrarMensaje("🔒 Sesión no iniciada. Redirigiendo...", "error");
    setTimeout(() => {
      window.location.href = "/login.html";
    }, 1200);
    return;
  }

  // Mostrar saludo
  if (saludo) {
    saludo.textContent = `👤 Hola, ${sanitize(usuario.name)}`;
  }

  await cargarPedidos();

  cerrarSesionBtn?.addEventListener("click", async () => {
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        credentials: "include"
      });
    } catch (e) {
      console.warn("⚠️ Error al cerrar sesión:", e);
    }

    window.location.href = "/login.html";
  });

  filtroEstado?.addEventListener("change", cargarPedidos);
});

/**
 * 🔐 Obtener usuario autenticado desde backend
 */
async function obtenerUsuario() {
  try {
    const res = await fetch(API_ME, {
      credentials: "include"
    });
    const data = await res.json();
    return res.ok ? data.user : null;
  } catch (err) {
    console.error("❌ Error al obtener usuario:", err);
    return null;
  }
}

/**
 * 🚚 Cargar pedidos del usuario autenticado
 */
async function cargarPedidos() {
  const estadoFiltrado = filtroEstado?.value?.trim().toLowerCase();

  try {
    const res = await fetch(API_PEDIDOS, {
      credentials: "include"
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

    // 🚫 Sin inline JS: listeners dinámicos
    listaPedidos.querySelectorAll(".ver-detalles").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const id = e.target.closest(".pedido-card")?.dataset?.id;
        if (id) {
          window.location.href = `/detalle-pedido.html?id=${id}`;
        }
      });
    });

  } catch (err) {
    console.error("❌ Error al cargar pedidos:", err);
    listaPedidos.innerHTML = `<p class="text-center" style="color:red;">❌ ${err.message}</p>`;
  }
}

/**
 * 🧾 Generar HTML de cada pedido
 */
function pedidoHTML(p) {
  const fecha = new Date(p.createdAt).toLocaleDateString("es-EC");
  const estado = estadoBonito(p.estado);
  const total = `$${p.total?.toFixed(2) || "0.00"}`;
  const id = p._id?.slice(-6)?.toUpperCase() || "XXXXXX";

  return `
    <div class="pedido-card" data-id="${p._id}" role="region" aria-label="Pedido ${id}">
      <p><strong>Pedido:</strong> #${id}</p>
      <p><strong>Fecha:</strong> ${fecha}</p>
      <p><strong>Total:</strong> ${total}</p>
      <p><strong>Estado:</strong> <span class="estado-${p.estado || 'otro'}">${estado}</span></p>
      <button class="btn-secundario ver-detalles">👁️ Ver Detalles</button>
    </div>
  `;
}

/**
 * ✅ Traducir estado interno a legible
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
 * 🧼 Sanitizar texto contra inyecciones simples
 */
function sanitize(text = "") {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML.trim();
}
