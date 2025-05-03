"use strict";

// ✅ Importar dependencias necesarias
import { verificarSesion, goBack } from "./admin-utils.js";
import { API_BASE } from "./config.js";

// 🔐 Validar sesión
const token = verificarSesion();

// 🌐 Endpoints
const API_ORDERS = `${API_BASE}/api/orders`;
const API_PRODUCTS = `${API_BASE}/api/products`;
const API_RESUMEN = `${API_BASE}/api/orders/stats/ventas`;

// 📦 Estado global
let resumenPedidos = null;
let resumenVentas = null;
let categoriasOrdenadas = [];

document.addEventListener("DOMContentLoaded", () => {
  loadDashboard();
  document.getElementById("btnExportar")?.addEventListener("click", exportarEstadisticas);
});

/**
 * 🚀 Cargar datos y renderizar dashboard
 */
async function loadDashboard() {
  try {
    const [ordenesRaw, productosRaw, resumenRaw] = await Promise.all([
      fetchData(API_ORDERS, true),
      fetchData(API_PRODUCTS),
      fetchData(API_RESUMEN, true)
    ]);

    const pedidos = Array.isArray(ordenesRaw?.data) ? ordenesRaw.data : [];
    const productos = Array.isArray(productosRaw?.productos) ? productosRaw.productos : [];
    const resumen = typeof resumenRaw === "object" && resumenRaw !== null ? resumenRaw : {};

    if (!Array.isArray(pedidos)) throw new Error("🛑 Pedidos no es un arreglo");
    if (!Array.isArray(productos)) throw new Error("🛑 Productos no es un arreglo");

    resumenPedidos = procesarPedidos(pedidos);
    resumenVentas = {
      ventasTotales: parseFloat(resumen?.ventasTotales || 0),
      totalVisitas: resumen?.totalVisitas || 0,
      totalProductos: productos.length,
      productosDestacados: productos.filter(p => p.featured).length
    };

    renderResumen(resumenPedidos, resumenVentas, productos);
    renderCategoriasTop(productos);
  } catch (err) {
    console.error("❌ Error al cargar dashboard:", err.message || err);
    alert("⚠️ No se pudieron cargar los datos del panel. Intenta más tarde.");
  }
}

/**
 * 🌐 Fetch genérico con headers opcionales
 */
async function fetchData(url, usarToken = false) {
  const headers = usarToken ? { Authorization: `Bearer ${token}` } : {};
  const res = await fetch(url, { headers });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`❌ ${url} → ${error}`);
  }

  return await res.json();
}

/**
 * 📊 Procesar pedidos y contar estados
 */
function procesarPedidos(pedidos = []) {
  const hoy = new Date().setHours(0, 0, 0, 0);
  return pedidos.reduce((resumen, p) => {
    const estado = (p.estado || "").toLowerCase();
    const fecha = new Date(p.createdAt).setHours(0, 0, 0, 0);

    if (estado.includes("pend")) resumen.pendiente++;
    else if (estado.includes("proceso")) resumen.en_proceso++;
    else if (estado.includes("env")) resumen.enviado++;
    else if (estado.includes("cancel")) resumen.cancelado++;

    if (fecha === hoy) resumen.hoy++;
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
 * 📈 Renderizar resumen general
 */
function renderResumen(pedidos, ventas, productos = []) {
  setText("ventasTotales", `$${ventas.ventasTotales.toFixed(2)}`);
  setText("visitasTotales", ventas.totalVisitas);
  setText("totalProductos", ventas.totalProductos);
  setText("promosActivas", ventas.productosDestacados);

  setText("total", pedidos.total);
  setText("pendientes", pedidos.pendiente);
  setText("en_proceso", pedidos.en_proceso);
  setText("enviado", pedidos.enviado);
  setText("cancelado", pedidos.cancelado);
  setText("hoy", pedidos.hoy);
}

/**
 * 🗂️ Mostrar categorías más populares
 */
function renderCategoriasTop(productos = []) {
  const conteo = {};

  productos.forEach(p => {
    const categoria = p.category?.trim().toLowerCase() || "sin categoría";
    conteo[categoria] = (conteo[categoria] || 0) + 1;
  });

  categoriasOrdenadas = Object.entries(conteo).sort((a, b) => b[1] - a[1]);

  const ul = document.getElementById("topCategorias");
  ul.innerHTML = "";

  categoriasOrdenadas.forEach(([cat, total]) => {
    const li = document.createElement("li");
    li.textContent = `📁 ${cat}: ${total}`;
    ul.appendChild(li);
  });
}

/**
 * 📤 Exportar métricas en formato CSV
 */
function exportarEstadisticas() {
  if (!resumenPedidos || !resumenVentas) {
    return alert("⚠️ Espera a que se cargue todo antes de exportar.");
  }

  const fecha = new Date().toLocaleString("es-EC");
  let csv = `Dashboard KM & EZ ROPA\nFecha:,${fecha}\n\n`;

  csv += "Resumen de Ventas\n";
  csv += `Ventas Totales,${resumenVentas.ventasTotales}\n`;
  csv += `Visitas Totales,${resumenVentas.totalVisitas}\n`;
  csv += `Productos Totales,${resumenVentas.totalProductos}\n`;
  csv += `Promociones Activas,${resumenVentas.productosDestacados}\n\n`;

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

/**
 * 📌 Asignar texto a un elemento HTML por ID
 */
function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

// 🌐 Funciones globales para botones HTML
window.goBack = goBack;
window.exportarEstadisticas = exportarEstadisticas;
