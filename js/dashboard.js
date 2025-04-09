"use strict";
import { verificarSesion, goBack } from "./admin-utils.js";

// 🔐 Validar sesión
const token = verificarSesion();

// APIs
const API_BASE = "https://km-ez-ropa-backend.onrender.com/api";
const API_ORDERS = `${API_BASE}/orders`;
const API_PRODUCTS = `${API_BASE}/products`;
const API_RESUMEN = `${API_BASE}/stats/resumen`;

// Almacenamiento global
let resumenPedidos = null;
let categoriasOrdenadas = [];
let resumenVentas = null;

document.addEventListener("DOMContentLoaded", loadDashboard);

/**
 * 🔁 Cargar todos los datos del dashboard
 */
async function loadDashboard() {
  try {
    const [pedidos, productos, resumen] = await Promise.all([
      fetchData(API_ORDERS, true),
      fetchData(API_PRODUCTS),
      fetchData(API_RESUMEN, true),
    ]);

    resumenPedidos = contarPedidos(pedidos);
    resumenVentas = resumen;

    renderMetrics(resumenPedidos, resumenVentas);
    renderTopCategorias(productos);
  } catch (err) {
    console.error("❌ Error cargando datos:", err);
    alert("❌ No se pudieron cargar los datos del dashboard.");
  }
}

/**
 * 🔄 Fetch genérico con autorización opcional
 */
async function fetchData(url, auth = false) {
  const res = await fetch(url, {
    headers: auth ? { Authorization: `Bearer ${token}` } : {}
  });

  if (!res.ok) throw new Error(`Error al obtener: ${url}`);
  return await res.json();
}

/**
 * 🧮 Conteo de pedidos por estado y día
 */
function contarPedidos(pedidos) {
  const hoy = new Date().setHours(0, 0, 0, 0);

  const resumen = {
    pendiente: 0,
    en_proceso: 0,
    enviado: 0,
    cancelado: 0,
    hoy: 0,
    total: pedidos.length,
  };

  pedidos.forEach(p => {
    const estado = (p.estado || "pendiente").toLowerCase();
    if (resumen[estado] !== undefined) resumen[estado]++;

    const fecha = new Date(p.createdAt).setHours(0, 0, 0, 0);
    if (fecha === hoy) resumen.hoy++;
  });

  return resumen;
}

/**
 * 🧾 Mostrar datos en tarjetas del dashboard
 */
function renderMetrics(pedidos, resumen) {
  setText("ventasTotales", `$${resumen.ventasTotales}`);
  setText("visitasTotales", resumen.totalVisitas);
  setText("totalProductos", resumen.totalProductos);
  setText("promosActivas", resumen.productosDestacados);

  setText("total", pedidos.total);
  setText("pendientes", pedidos.pendiente);
  setText("en_proceso", pedidos.en_proceso);
  setText("enviado", pedidos.enviado);
  setText("cancelado", pedidos.cancelado);
  setText("hoy", pedidos.hoy);
}

/**
 * 📦 Agrupar productos por categoría y mostrar
 */
function renderTopCategorias(productos) {
  const categorias = {};

  productos.forEach(p => {
    const cat = p.category || "Sin categoría";
    categorias[cat] = (categorias[cat] || 0) + 1;
  });

  categoriasOrdenadas = Object.entries(categorias).sort((a, b) => b[1] - a[1]);

  const lista = document.getElementById("topCategorias");
  lista.innerHTML = "";

  categoriasOrdenadas.forEach(([cat, cantidad]) => {
    const li = document.createElement("li");
    li.textContent = `📁 ${cat}: ${cantidad}`;
    lista.appendChild(li);
  });
}

/**
 * 🧾 Asignar texto a un ID
 */
function setText(id, valor) {
  const el = document.getElementById(id);
  if (el) el.textContent = valor;
}

/**
 * 📤 Exportar toda la info a CSV
 */
function exportarEstadisticas() {
  if (!resumenVentas || !resumenPedidos || categoriasOrdenadas.length === 0) {
    alert("❌ Datos no disponibles para exportar.");
    return;
  }

  const fecha = new Date().toLocaleString("es-ES");

  let csv = `📊 Estadísticas - KM & EZ ROPA\nFecha: ${fecha}\n\n`;

  csv += "Resumen de Ventas\n";
  csv += `Ventas Totales,${resumenVentas.ventasTotales}\n`;
  csv += `Visitas Totales,${resumenVentas.totalVisitas}\n`;
  csv += `Total Productos,${resumenVentas.totalProductos}\n`;
  csv += `Promociones Activas,${resumenVentas.productosDestacados}\n\n`;

  csv += "Resumen de Pedidos\n";
  csv += `Pedidos Totales,${resumenPedidos.total}\n`;
  csv += `Pendientes,${resumenPedidos.pendiente}\n`;
  csv += `En Proceso,${resumenPedidos.en_proceso}\n`;
  csv += `Enviados,${resumenPedidos.enviado}\n`;
  csv += `Cancelados,${resumenPedidos.cancelado}\n`;
  csv += `Pedidos del Día,${resumenPedidos.hoy}\n\n`;

  csv += "Top Categorías\n";
  categoriasOrdenadas.forEach(([cat, cantidad]) => {
    csv += `${cat},${cantidad}\n`;
  });

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `dashboard_km-ez-ropa_${Date.now()}.csv`;
  link.click();
}

// 🌐 Exponer funciones al DOM
window.exportarEstadisticas = exportarEstadisticas;
window.goBack = goBack;
