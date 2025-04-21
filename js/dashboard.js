"use strict";

import { verificarSesion, goBack } from "./admin-utils.js";
import { API_BASE } from "./config.js";

const token = verificarSesion();

const API_ORDERS = `${API_BASE}/api/orders`;
const API_PRODUCTS = `${API_BASE}/api/products`;
const API_RESUMEN = `${API_BASE}/api/orders/stats/ventas`;

let resumenPedidos = null;
let resumenVentas = null;
let categoriasOrdenadas = [];

document.addEventListener("DOMContentLoaded", loadDashboard);

async function loadDashboard() {
  try {
    const [pedidos, productos, resumen] = await Promise.all([
      fetchData(API_ORDERS, true),
      fetchData(API_PRODUCTS),
      fetchData(API_RESUMEN, true)
    ]);

    resumenPedidos = contarPedidos(pedidos || []);
    resumenVentas = resumen || {};

    renderMetrics(resumenPedidos, resumenVentas);
    renderTopCategorias(productos || []);
  } catch (err) {
    console.error("❌ Error al cargar dashboard:", err);
    alert("❌ No se pudieron cargar los datos del dashboard.");
  }
}

async function fetchData(url, necesitaToken = false) {
  const headers = necesitaToken ? { Authorization: `Bearer ${token}` } : {};
  const res = await fetch(url, { headers });

  if (!res.ok) {
    const errorText = await res.text();
    console.warn(`⚠️ Error en ${url}: ${errorText}`);
    throw new Error(`❌ Fallo al consultar: ${url}`);
  }

  return await res.json();
}

function contarPedidos(pedidos = []) {
  const hoy = new Date().setHours(0, 0, 0, 0);
  const resumen = {
    pendiente: 0,
    en_proceso: 0,
    enviado: 0,
    cancelado: 0,
    hoy: 0,
    total: pedidos.length
  };

  pedidos.forEach(p => {
    const estado = (p.estado || "pendiente").toLowerCase();
    if (estado.includes("pend")) resumen.pendiente++;
    else if (estado.includes("proceso")) resumen.en_proceso++;
    else if (estado.includes("env")) resumen.enviado++;
    else if (estado.includes("cancel")) resumen.cancelado++;

    const fechaPedido = new Date(p.createdAt).setHours(0, 0, 0, 0);
    if (fechaPedido === hoy) resumen.hoy++;
  });

  return resumen;
}

function renderMetrics(pedidos, resumen) {
  setText("ventasTotales", `$${resumen.ventasTotales?.toFixed(2) || "0.00"}`);
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

function renderTopCategorias(productos = []) {
  const conteo = {};

  productos.forEach(p => {
    const cat = p.category?.toLowerCase() || "Sin categoría";
    conteo[cat] = (conteo[cat] || 0) + 1;
  });

  categoriasOrdenadas = Object.entries(conteo).sort((a, b) => b[1] - a[1]);

  const lista = document.getElementById("topCategorias");
  lista.innerHTML = "";

  categoriasOrdenadas.forEach(([nombre, cantidad]) => {
    const li = document.createElement("li");
    li.textContent = `${nombre}: ${cantidad}`;
    lista.appendChild(li);
  });
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function exportarEstadisticas() {
  if (!resumenVentas || !resumenPedidos) {
    return alert("⚠️ Datos incompletos. Intenta recargar la página.");
  }

  const fecha = new Date().toLocaleString("es-ES");
  let csv = `Dashboard - KM & EZ ROPA\nFecha:,${fecha}\n\n`;

  csv += "Resumen de Ventas\n";
  csv += `Ventas Totales,${resumenVentas.ventasTotales}\n`;
  csv += `Visitas Totales,${resumenVentas.totalVisitas || 0}\n`;
  csv += `Productos Totales,${resumenVentas.totalProductos || 0}\n`;
  csv += `Promociones Activas,${resumenVentas.productosDestacados || 0}\n\n`;

  csv += "Resumen de Pedidos\n";
  csv += `Pedidos Totales,${resumenPedidos.total}\n`;
  csv += `Pendientes,${resumenPedidos.pendiente}\n`;
  csv += `En Proceso,${resumenPedidos.en_proceso}\n`;
  csv += `Enviados,${resumenPedidos.enviado}\n`;
  csv += `Cancelados,${resumenPedidos.cancelado}\n`;
  csv += `Pedidos Hoy,${resumenPedidos.hoy}\n\n`;

  csv += "Top Categorías\n";
  categoriasOrdenadas.forEach(([nombre, cantidad]) => {
    csv += `${nombre},${cantidad}\n`;
  });

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `dashboard_km-ez-ropa_${Date.now()}.csv`;
  a.click();
}

// Exponer funciones globales
window.exportarEstadisticas = exportarEstadisticas;
window.goBack = goBack;
