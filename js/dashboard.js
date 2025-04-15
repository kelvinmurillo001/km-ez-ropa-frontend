"use strict";

import { verificarSesion, goBack } from "./admin-utils.js";

// 🔐 Validar sesión del admin
const token = verificarSesion();

// Endpoints
const API_BASE = "https://km-ez-ropa-backend.onrender.com/api";
const API_ORDERS = `${API_BASE}/orders`;
const API_PRODUCTS = `${API_BASE}/products`;
const API_RESUMEN = `${API_BASE}/stats/resumen`;

// Variables globales
let resumenPedidos = null;
let resumenVentas = null;
let categoriasOrdenadas = [];

// ▶️ Inicio
document.addEventListener("DOMContentLoaded", loadDashboard);

/**
 * 🚀 Cargar todos los datos en paralelo
 */
async function loadDashboard() {
  try {
    const [pedidos, productos, resumen] = await Promise.all([
      fetchData(API_ORDERS, true),
      fetchData(API_PRODUCTS),
      fetchData(API_RESUMEN, true)
    ]);

    resumenPedidos = contarPedidos(pedidos);
    resumenVentas = resumen;

    renderMetrics(resumenPedidos, resumenVentas);
    renderTopCategorias(productos);
  } catch (err) {
    console.error("❌ Error al cargar el dashboard:", err);
    alert("❌ No se pudieron cargar los datos del dashboard.");
  }
}

/**
 * 🔄 Función para obtener datos de una URL
 */
async function fetchData(url, auth = false) {
  const res = await fetch(url, {
    headers: auth ? { Authorization: `Bearer ${token}` } : {}
  });

  if (!res.ok) throw new Error(`❌ Error al obtener datos desde: ${url}`);
  return await res.json();
}

/**
 * 📦 Contar pedidos por estado y del día
 */
function contarPedidos(pedidos) {
  const hoy = new Date().setHours(0, 0, 0, 0);
  const resumen = {
    pendiente: 0,
    en_proceso: 0,
    enviado: 0,
    cancelado: 0,
    hoy: 0,
    total: 0
  };

  if (!Array.isArray(pedidos)) return resumen;
  resumen.total = pedidos.length;

  pedidos.forEach(p => {
    const estado = (p.estado || "pendiente").toLowerCase();
    if (resumen.hasOwnProperty(estado)) resumen[estado]++;
    if (new Date(p.createdAt).setHours(0, 0, 0, 0) === hoy) resumen.hoy++;
  });

  return resumen;
}

/**
 * 📊 Pintar métricas en tarjetas del dashboard
 */
function renderMetrics(pedidos, resumen) {
  setText("ventasTotales", `$${resumen.ventasTotales || 0}`);
  setText("visitasTotales", resumen.totalVisitas || 0);
  setText("totalProductos", resumen.totalProductos || 0);
  setText("promosActivas", resumen.productosDestacados || 0);

  setText("total", pedidos.total);
  setText("pendientes", pedidos.pendiente);
  setText("en_proceso", pedidos.en_proceso);
  setText("enviado", pedidos.enviado);
  setText("cancelado", pedidos.cancelado);
  setText("hoy", pedidos.hoy);
}

/**
 * 📁 Mostrar top categorías de productos
 */
function renderTopCategorias(productos) {
  const conteo = {};

  productos.forEach(p => {
    const categoria = p.category || "Sin categoría";
    conteo[categoria] = (conteo[categoria] || 0) + 1;
  });

  categoriasOrdenadas = Object.entries(conteo).sort((a, b) => b[1] - a[1]);

  const lista = document.getElementById("topCategorias");
  lista.innerHTML = "";

  categoriasOrdenadas.forEach(([nombre, cantidad]) => {
    const li = document.createElement("li");
    li.textContent = `📁 ${nombre}: ${cantidad}`;
    lista.appendChild(li);
  });
}

/**
 * 🧾 Helper: asignar texto a un elemento
 */
function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

/**
 * 📤 Exportar todos los datos a CSV
 */
function exportarEstadisticas() {
  if (!resumenVentas || !resumenPedidos) {
    return alert("⚠️ Datos incompletos. Intenta recargar.");
  }

  const fechaActual = new Date().toLocaleString("es-ES");
  let csv = `📊 Dashboard - KM & EZ ROPA\nFecha:,${fechaActual}\n\n`;

  csv += "Resumen de Ventas\n";
  csv += `Ventas Totales,${resumenVentas.ventasTotales}\n`;
  csv += `Visitas Totales,${resumenVentas.totalVisitas}\n`;
  csv += `Productos Totales,${resumenVentas.totalProductos}\n`;
  csv += `Promociones Activas,${resumenVentas.productosDestacados}\n\n`;

  csv += "Resumen de Pedidos\n";
  csv += `Pedidos Totales,${resumenPedidos.total}\n`;
  csv += `Pendientes,${resumenPedidos.pendiente}\n`;
  csv += `En Proceso,${resumenPedidos.en_proceso}\n`;
  csv += `Enviados,${resumenPedidos.enviado}\n`;
  csv += `Cancelados,${resumenPedidos.cancelado}\n`;
  csv += `Pedidos Hoy,${resumenPedidos.hoy}\n\n`;

  csv += "Top Categorías\n";
  categoriasOrdenadas.forEach(([categoria, cantidad]) => {
    csv += `${categoria},${cantidad}\n`;
  });

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = `dashboard_km-ez-ropa_${Date.now()}.csv`;
  enlace.click();
}

// 🌐 Funciones disponibles globalmente
window.exportarEstadisticas = exportarEstadisticas;
window.goBack = goBack;
