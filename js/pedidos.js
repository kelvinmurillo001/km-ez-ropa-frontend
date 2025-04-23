"use strict";

// 🔐 Utilidades comunes
import { verificarSesion, goBack, mostrarMensaje } from "./admin-utils.js";
import { API_BASE } from "./config.js";

// 🔗 Endpoints
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
 * 📦 Cargar todos los pedidos
 */
async function cargarPedidos() {
  try {
    const res = await fetch(API_ORDERS, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = await res.json();
    if (!res.ok) throw new Error("Error al obtener pedidos");

    todosLosPedidos = Array.isArray(data) ? data : [];
    renderPedidos();

  } catch (err) {
    console.error("❌ Error cargando pedidos:", err.message);
    listaPedidos.innerHTML = `<p class="text-center" style="color:red;">❌ No se pudo cargar los pedidos</p>`;
  }
}

/**
 * 🔍 Filtro y render
 */
function renderPedidos() {
  let pedidosFiltrados = aplicarFiltro(todosLosPedidos);

  const totalPaginas = Math.ceil(pedidosFiltrados.length / pedidosPorPagina);
  const inicio = (paginaActual - 1) * pedidosPorPagina;
  const pagina = pedidosFiltrados.slice(inicio, inicio + pedidosPorPagina);

  renderEstadisticas(pedidosFiltrados);

  if (!pagina.length) {
    listaPedidos.innerHTML = `<p class="text-center">📭 No hay pedidos con este estado.</p>`;
    paginacion.innerHTML = "";
    return;
  }

  pagina.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const filas = pagina.map(p => {
    const productos = p.items?.map(i =>
      `👕 <strong>${i.name}</strong> (${i.talla || "Única"}) x${i.cantidad}`
    ).join("<br>") || "-";

    const total = typeof p.total === "number" ? `$${p.total.toFixed(2)}` : "$0.00";
    const fecha = new Date(p.createdAt).toLocaleString("es-EC", {
      day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
    });

    const cliente = sanitize(p.nombreCliente || "Sin nombre");
    const nota = sanitize(p.nota || "-");

    const linkWA = p.metodoPago === "transferencia" ? generarLinkWhatsapp(p) : "";

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

  renderPaginacion(totalPaginas);
}

/**
 * 📊 Mostrar estadísticas básicas
 */
function renderEstadisticas(pedidos) {
  const total = pedidos.length;
  const totalVentas = pedidos.reduce((acc, p) => acc + (p.total || 0), 0);
  const enviados = pedidos.filter(p => p.estado === "enviado").length;
  const pendientes = pedidos.filter(p => p.estado === "pendiente").length;

  estadisticasVentas.innerHTML = `
    <p><strong>Total pedidos:</strong> ${total}</p>
    <p><strong>Ventas acumuladas:</strong> $${totalVentas.toFixed(2)}</p>
    <p><strong>Enviados:</strong> ${enviados}</p>
    <p><strong>Pendientes:</strong> ${pendientes}</p>
  `;
}

/**
 * 🔢 Paginación dinámica
 */
function renderPaginacion(total) {
  paginacion.innerHTML = "";
  if (total <= 1) return;

  for (let i = 1; i <= total; i++) {
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
 * 🔍 Filtro por estado
 */
function aplicarFiltro(pedidos = []) {
  const estado = filtroEstado?.value || "todos";
  return estado === "todos"
    ? pedidos
    : pedidos.filter(p => (p.estado || "").toLowerCase() === estado);
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

    if (!res.ok) throw new Error("Error al actualizar estado");

    mostrarMensaje("✅ Estado actualizado correctamente", "success");
    await cargarPedidos();
  } catch (err) {
    console.error("❌", err);
    mostrarMensaje("❌ No se pudo cambiar el estado", "error");
  } finally {
    selectElem.disabled = false;
  }
};

/**
 * 📄 Exportar a PDF
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
 * 🎨 Estado visual
 */
function formatearEstado(estado) {
  switch ((estado || "").toLowerCase()) {
    case "pendiente": return "⏳ Pendiente";
    case "en_proceso": return "⚙️ En Proceso";
    case "enviado": return "📦 Enviado";
    case "cancelado": return "❌ Cancelado";
    default: return estado || "Desconocido";
  }
}

/**
 * 🧩 Opciones de estado
 */
function generarOpcionesEstado(actual) {
  const estados = ["pendiente", "en_proceso", "enviado", "cancelado"];
  return estados.map(e =>
    `<option value="${e}" ${e === actual ? "selected" : ""}>${formatearEstado(e)}</option>`
  ).join("");
}

/**
 * 💬 Generar mensaje de WhatsApp
 */
function generarLinkWhatsapp(p) {
  const productos = p.items?.map(i =>
    `• ${i.cantidad}x ${i.name} (${i.talla})`
  ).join("\n") || "";

  const texto = encodeURIComponent(`
📦 Pedido de ${p.nombreCliente}
📧 ${p.email}
📞 ${p.telefono}
📍 ${p.direccion}

${productos}

💰 Total: $${p.total?.toFixed(2) || "0.00"}
💳 Pago: Transferencia
  `);

  return `<a href="https://wa.me/593990270864?text=${texto}" target="_blank" class="btn btn-wsp mt-1">💬 WhatsApp</a>`;
}

/**
 * 🔐 Evitar XSS
 */
function sanitize(text) {
  const temp = document.createElement("div");
  temp.textContent = text;
  return temp.innerHTML;
}

// 🔄 Global
window.goBack = goBack;
