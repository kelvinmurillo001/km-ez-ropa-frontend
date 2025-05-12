"use strict";

import { API_BASE } from "./config.js";
import { verificarSesion, mostrarMensaje } from "./admin-utils.js";

const token = verificarSesion();
const pedidoId = new URLSearchParams(window.location.search).get("id");
const container = document.getElementById("pedidoDetalle");
let pedidoActual = null;

document.addEventListener("DOMContentLoaded", () => {
  if (!pedidoId || pedidoId.length < 8) {
    mostrarError("❌ Pedido no válido.");
    return;
  }

  cargarDetallePedido();

  document.getElementById("descargarPdfBtn")?.addEventListener("click", generarPDF);
});

/**
 * 🔍 Obtener y mostrar detalle del pedido
 */
async function cargarDetallePedido() {
  try {
    const res = await fetch(`${API_BASE}/api/orders/${pedidoId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = await res.json();
    if (!res.ok || !data.pedido) throw new Error(data.message || "Pedido no encontrado");

    pedidoActual = data.pedido;
    renderizarDetalle(pedidoActual);
  } catch (err) {
    console.error("❌ Error al obtener pedido:", err);
    mostrarError(`❌ ${sanitize(err.message)}`);
  }
}

/**
 * 🎨 Renderiza el pedido completo
 */
function renderizarDetalle(p) {
  const fecha = new Date(p.createdAt).toLocaleDateString("es-ES", {
    day: "numeric", month: "long", year: "numeric"
  });

  const estado = traducirEstado(p.estado);
  const total = `$${p.total?.toFixed(2) || "0.00"}`;

  container.innerHTML = `
    <section class="info-principal" aria-label="Información general del pedido">
      <p><strong>Pedido ID:</strong> #${p._id.slice(-6).toUpperCase()}</p>
      <p><strong>Fecha:</strong> ${fecha}</p>
      <p><strong>Estado:</strong> <span class="estado-${sanitize(p.estado)}">${estado}</span></p>
      <p><strong>Total:</strong> ${total}</p>
    </section>

    <h3 class="text-center mt-2">🧾 Productos incluidos</h3>
    <div class="productos-lista" role="list" aria-label="Lista de productos del pedido">
      ${renderItemsHTML(p.items)}
    </div>

    <div class="mt-3 text-center">
      <a href="/cliente.html" class="btn-secundario" aria-label="Volver a mis pedidos">🔙 Volver a mis pedidos</a>
    </div>
  `;
}

/**
 * 🧾 Renderizar items del pedido
 */
function renderItemsHTML(items = []) {
  return items.map(item => {
    const imagen = sanitize(item.imagen || "/assets/logo.jpg");
    const nombre = sanitize(item.nombre || "Producto");
    const subtotal = (item.precio * item.cantidad).toFixed(2);

    return `
      <div class="producto-detalle fade-in" role="listitem" aria-label="Producto: ${nombre}">
        <img src="${imagen}" alt="${nombre}" loading="lazy"
             onerror="this.src='/assets/logo.jpg'; this.alt='Imagen no disponible';" />
        <div>
          <p><strong>${nombre}</strong></p>
          <p>Talla: ${sanitize(item.talla || "-")}</p>
          <p>Color: ${sanitize(item.color || "-")}</p>
          <p>Cantidad: ${item.cantidad}</p>
          <p>Subtotal: $${subtotal}</p>
        </div>
      </div>`;
  }).join("");
}

/**
 * 📄 Generar PDF con jsPDF y autoTable
 */
async function generarPDF() {
  if (!pedidoActual) return;

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  const fecha = new Date(pedidoActual.createdAt).toLocaleDateString("es-ES");
  const items = pedidoActual.items || [];

  doc.setFontSize(16);
  doc.text("Detalle del Pedido", 14, 20);

  doc.setFontSize(11);
  doc.text(`Pedido ID: #${pedidoActual._id.slice(-6).toUpperCase()}`, 14, 30);
  doc.text(`Fecha: ${fecha}`, 14, 36);
  doc.text(`Estado: ${traducirEstado(pedidoActual.estado)}`, 14, 42);
  doc.text(`Total: $${pedidoActual.total?.toFixed(2) || "0.00"}`, 14, 48);

  const rows = items.map(item => [
    item.nombre || "Producto",
    item.talla || "-",
    item.color || "-",
    item.cantidad,
    `$${item.precio?.toFixed(2) || "0.00"}`,
    `$${(item.precio * item.cantidad).toFixed(2)}`
  ]);

  doc.autoTable({
    startY: 55,
    head: [["Producto", "Talla", "Color", "Cantidad", "Precio", "Subtotal"]],
    body: rows,
    theme: "grid",
    headStyles: { fillColor: [255, 109, 0] }
  });

  doc.save(`pedido-${pedidoActual._id.slice(-6)}.pdf`);
}

/**
 * 💬 Traducir estado técnico
 */
function traducirEstado(e = "") {
  const estados = {
    pendiente: "⏳ Pendiente",
    procesando: "🛠️ Procesando",
    preparando: "🔧 Preparando",
    enviado: "🚚 Enviado",
    entregado: "📬 Entregado",
    cancelado: "❌ Cancelado"
  };
  return estados[e.toLowerCase()] || capitalize(e);
}

/**
 * 🧼 Prevención básica de XSS
 */
function sanitize(str = "") {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML.trim();
}

/**
 * 🔠 Capitalizar cadena
 */
function capitalize(str = "") {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * 🚨 Mostrar error en contenedor
 */
function mostrarError(mensaje) {
  container.innerHTML = `<p class="text-center" style="color:red;">${mensaje}</p>`;
}
