"use strict";

// 🔐 Utilidades comunes
import { verificarSesion, goBack, mostrarMensaje } from "./admin-utils.js";
import { API_BASE } from "./config.js";

// 🌐 Endpoints
const API_ORDERS = `${API_BASE}/api/orders`;

// 📌 DOM
const listaPedidos = document.getElementById("listaPedidos");
const filtroEstado = document.getElementById("filtroEstado");
const btnExportar = document.getElementById("btnExportarPedidos");
const paginacion = document.getElementById("paginacionPedidos");
const estadisticasVentas = document.getElementById("estadisticasVentas");

// 🛡️ Token
const token = verificarSesion();

let todosLosPedidos = [];
let paginaActual = 1;
const pedidosPorPagina = 10;

document.addEventListener("DOMContentLoaded", () => {
  cargarPedidos();
  filtroEstado?.addEventListener("change", () => {
    paginaActual = 1;
    renderPedidos();
  });
  btnExportar?.addEventListener("click", exportarPDF);

  if (localStorage.getItem("modoOscuro") === "true") {
    document.body.classList.add("modo-oscuro");
  }
});

/**
 * 📦 Obtener pedidos desde la API
 */
async function cargarPedidos() {
  try {
    const res = await fetch(API_ORDERS, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Error al obtener pedidos");

    todosLosPedidos = Array.isArray(data.data) ? data.data : [];
    renderPedidos();
  } catch (err) {
    console.error("❌ Error cargando pedidos:", err.message);
    listaPedidos.innerHTML = `<p class="text-center" style="color:red;">❌ No se pudo cargar los pedidos</p>`;
  }
}

/**
 * 🧮 Renderizar pedidos según estado y página
 */
function renderPedidos() {
  const pedidosFiltrados = aplicarFiltro(todosLosPedidos);
  const totalPaginas = Math.max(1, Math.ceil(pedidosFiltrados.length / pedidosPorPagina));
  paginaActual = Math.min(paginaActual, totalPaginas);
  const inicio = (paginaActual - 1) * pedidosPorPagina;
  const pagina = pedidosFiltrados.slice(inicio, inicio + pedidosPorPagina);

  renderEstadisticas(pedidosFiltrados);
  renderPaginacion(totalPaginas);

  if (!pagina.length) {
    listaPedidos.innerHTML = `<p class="text-center">📭 No hay pedidos con este estado.</p>`;
    return;
  }

  pagina.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const filas = pagina.map(p => {
    const productos = Array.isArray(p.items)
      ? p.items.map(i =>
          `👕 <strong>${sanitize(i.name)}</strong> (${sanitize(i.talla)}) x${i.cantidad}`
        ).join("<br>")
      : "-";

    const total = typeof p.total === "number" ? `$${p.total.toFixed(2)}` : "$0.00";
    const fecha = new Date(p.createdAt).toLocaleString("es-EC", {
      day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
    });

    const cliente = sanitize(p.nombreCliente || "Sin nombre");
    const nota = sanitize(p.nota || "-");
    const linkWA = ["transferencia", "efectivo"].includes(p.metodoPago) ? generarLinkWhatsapp(p) : "";

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
    <table class="tabla-admin fade-in">
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

/**
 * 📊 Renderizar estadísticas básicas
 */
function renderEstadisticas(pedidos) {
  const total = pedidos.length;
  const totalVentas = pedidos.reduce((acc, p) => acc + (p.total || 0), 0);
  const enviados = pedidos.filter(p => (p.estado || "").toLowerCase() === "enviado").length;
  const pendientes = pedidos.filter(p => (p.estado || "").toLowerCase() === "pendiente").length;
  const pagados = pedidos.filter(p => (p.estado || "").toLowerCase() === "pagado").length;

  estadisticasVentas.innerHTML = `
    <p><strong>Total pedidos:</strong> ${total}</p>
    <p><strong>Ventas acumuladas:</strong> $${totalVentas.toFixed(2)}</p>
    <p><strong>Pagados:</strong> ${pagados}</p>
    <p><strong>Enviados:</strong> ${enviados}</p>
    <p><strong>Pendientes:</strong> ${pendientes}</p>
  `;
}

/**
 * 🔢 Crear controles de paginación
 */
function renderPaginacion(totalPaginas) {
  paginacion.innerHTML = "";
  if (totalPaginas <= 1) return;

  for (let i = 1; i <= totalPaginas; i++) {
    const btn = document.createElement("button");
    btn.textContent = i;
    btn.className = i === paginaActual ? "btn paginacion-activa" : "btn-secundario";
    btn.addEventListener("click", () => {
      paginaActual = i;
      renderPedidos();
    });
    paginacion.appendChild(btn);
  }
}

/**
 * 🔍 Aplicar filtro por estado
 */
function aplicarFiltro(pedidos = []) {
  const estado = filtroEstado?.value || "todos";
  return estado === "todos"
    ? pedidos
    : pedidos.filter(p => (p.estado || "").toLowerCase() === estado.toLowerCase());
}

/**
 * ✏️ Cambiar estado del pedido
 */
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

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Error al actualizar estado");

    mostrarMensaje("✅ Estado actualizado correctamente", "success");
    await cargarPedidos();
  } catch (err) {
    console.error("❌", err.message);
    mostrarMensaje("❌ No se pudo cambiar el estado", "error");
  } finally {
    selectElem.disabled = false;
  }
};

/**
 * 📄 Exportar pedidos a PDF
 */
async function exportarPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.text("Resumen de Pedidos", 14, 14);

  const filas = todosLosPedidos.map(p => [
    p.nombreCliente,
    p.total?.toFixed(2) || "0.00",
    new Date(p.createdAt).toLocaleDateString("es-EC"),
    p.estado
  ]);

  doc.autoTable({
    head: [["Cliente", "Total", "Fecha", "Estado"]],
    body: filas,
    startY: 20
  });

  doc.save("pedidos_kmezropa.pdf");
}

/**
 * 🏷️ Formatear estado visual
 */
function formatearEstado(estado) {
  const est = (estado || "").toLowerCase();
  return {
    pendiente: "⏳ Pendiente",
    en_proceso: "⚙️ En Proceso",
    enviado: "📦 Enviado",
    cancelado: "❌ Cancelado",
    pagado: "💰 Pagado"
  }[est] || estado || "Desconocido";
}

/**
 * 🔄 Generar opciones <select> de estado
 */
function generarOpcionesEstado(actual) {
  const estados = ["pendiente", "en_proceso", "enviado", "pagado", "cancelado"];
  return estados.map(e =>
    `<option value="${e}" ${e === actual ? "selected" : ""}>${formatearEstado(e)}</option>`
  ).join("");
}

/**
 * 💬 Crear enlace a WhatsApp con mensaje de pedido
 */
function generarLinkWhatsapp(p) {
  const productos = Array.isArray(p.items)
    ? p.items.map(i =>
        `• ${i.cantidad}x ${sanitize(i.name)} (${sanitize(i.talla || "Única")})`
      ).join("\n")
    : "";

  const texto = encodeURIComponent(
    `Pedido de ${p.nombreCliente}\n\n${productos}\n\nTotal: $${p.total?.toFixed(2) || "0.00"}`
  );

  return `<a href="https://wa.me/593990270864?text=${texto}" target="_blank" class="btn btn-wsp mt-1">💬 WhatsApp</a>`;
}

/**
 * 🔐 Sanitiza texto para evitar XSS
 */
function sanitize(text) {
  const temp = document.createElement("div");
  temp.textContent = text || "";
  return temp.innerHTML;
}

// 🌍 Exportaciones globales
window.goBack = goBack;
