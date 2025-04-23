"use strict";

import { verificarSesion, goBack } from "./admin-utils.js";
import { API_BASE } from "./config.js";

// 🔐 Validar sesión
const token = verificarSesion();

// 🌐 Endpoints
const API_ORDERS = `${API_BASE}/api/orders`;
const API_PRODUCTS = `${API_BASE}/api/products`;
const API_RESUMEN = `${API_BASE}/api/orders/stats/ventas`;

// 📦 Variables globales
let resumenPedidos = null;
let resumenVentas = null;
let categoriasOrdenadas = [];

document.addEventListener("DOMContentLoaded", () => {
  loadDashboard();
  document.getElementById("btnExportar")?.addEventListener("click", exportarEstadisticas);
});

/**
 * 🚀 Cargar datos para el dashboard
 */
async function loadDashboard() {
  try {
    const [pedidos, productos, resumen] = await Promise.all([
      fetchData(API_ORDERS, true),
      fetchData(API_PRODUCTS),
      fetchData(API_RESUMEN, true)
    ]);

    if (!Array.isArray(pedidos) || !Array.isArray(productos) || typeof resumen !== "object") {
      throw new Error("❌ Estructura de datos inválida");
    }

    resumenPedidos = contarPedidos(pedidos);
    resumenVentas = resumen;

    renderMetrics(resumenPedidos, resumenVentas, productos);
    renderTopCategorias(productos);
  } catch (err) {
    console.error("❌ Error al cargar dashboard:", err);
    alert("⚠️ No se pudieron cargar los datos del dashboard.");
  }
}

/**
 * 🌐 Petición genérica con validación
 */
async function fetchData(url, necesitaToken = false) {
  const headers = necesitaToken ? { Authorization: `Bearer ${token}` } : {};
  const res = await fetch(url, { headers });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`⚠️ ${url}: ${errorText}`);
  }

  return await res.json();
}

/**
 * 📊 Procesar resumen de pedidos
 */
function contarPedidos(pedidos = []) {
  const hoy = new Date().setHours(0, 0, 0, 0);
  return pedidos.reduce((resumen, p) => {
    const estado = (p.estado || "").toLowerCase();
    const fechaPedido = new Date(p.createdAt).setHours(0, 0, 0, 0);

    if (estado.includes("pend")) resumen.pendiente++;
    else if (estado.includes("proceso")) resumen.en_proceso++;
    else if (estado.includes("env")) resumen.enviado++;
    else if (estado.includes("cancel")) resumen.cancelado++;

    if (fechaPedido === hoy) resumen.hoy++;
    resumen.total++;
    return resumen;
  }, {
    pendiente: 0,
    en_proceso: 0,
    enviado: 0,
    cancelado: 0,
    hoy: 0,
    total: 0
  });
}

/**
 * 📈 Renderizar métricas
 */
function renderMetrics(pedidos, ventas, productos = []) {
  setText("ventasTotales", `$${parseFloat(ventas.ventasTotales || 0).toFixed(2)}`);
  setText("visitasTotales", ventas.totalVisitas ?? 0);
  setText("totalProductos", productos.length);
  setText("promosActivas", productos.filter(p => p.featured).length);

  setText("total", pedidos.total);
  setText("pendientes", pedidos.pendiente);
  setText("en_proceso", pedidos.en_proceso);
  setText("enviado", pedidos.enviado);
  setText("cancelado", pedidos.cancelado);
  setText("hoy", pedidos.hoy);
}

/**
 * 🗂️ Renderizar top categorías
 */
function renderTopCategorias(productos = []) {
  const conteo = {};

  productos.forEach(p => {
    const cat = p.category?.trim().toLowerCase() || "sin categoría";
    conteo[cat] = (conteo[cat] || 0) + 1;
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
 * 🧾 Asignar texto en elementos del DOM
 */
function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

/**
 * 📤 Exportar CSV con métricas
 */
function exportarEstadisticas() {
  if (!resumenVentas || !resumenPedidos) {
    return alert("⚠️ Carga completa antes de exportar.");
  }

  const fecha = new Date().toLocaleString("es-ES");
  let csv = `Dashboard KM & EZ ROPA\nFecha:,${fecha}\n\n`;

  csv += "Resumen de Ventas\n";
  csv += `Ventas Totales,${resumenVentas.ventasTotales}\n`;
  csv += `Visitas Totales,${resumenVentas.totalVisitas}\n`;
  csv += `Productos Totales,${resumenVentas.totalProductos || "-"}\n`;
  csv += `Promociones Activas,${resumenVentas.productosDestacados || "-"}\n\n`;

  csv += "Resumen de Pedidos\n";
  Object.entries(resumenPedidos).forEach(([key, val]) => {
    csv += `${key},${val}\n`;
  });

  csv += "\nTop Categorías\n";
  categoriasOrdenadas.forEach(([cat, count]) => {
    csv += `${cat},${count}\n`;
  });

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `dashboard_km-ez-ropa_${Date.now()}.csv`;
  a.click();
}

// 🌐 Exponer funciones globales
window.goBack = goBack;
window.exportarEstadisticas = exportarEstadisticas;
