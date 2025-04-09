"use strict";

// 🛠️ Importación de funciones desde admin-utils.js
import { verificarSesion, goBack } from "./admin-utils.js";

// 🔐 Verificación de sesión
const token = verificarSesion(); // 🔐 Validación de sesión segura

const API_BASE = "https://km-ez-ropa-backend.onrender.com/api";
const API_ORDERS = `${API_BASE}/orders`;
const API_PRODUCTS = `${API_BASE}/products`;

document.addEventListener("DOMContentLoaded", loadDashboard);

/**
 * 📊 Cargar estadísticas generales desde el backend
 */
async function loadDashboard() {
  try {
    const pedidos = await fetchData(API_ORDERS, true);
    const productos = await fetchData(API_PRODUCTS);

    const resumen = contarPedidos(pedidos);
    renderMetrics(resumen);
    renderProducts(productos);

  } catch (err) {
    console.error("❌ Error cargando datos:", err);
    alert("❌ No se pudieron cargar los datos del dashboard.");
  }
}

/**
 * 🌐 Realiza un fetch con o sin autorización (token)
 */
async function fetchData(url, auth = false) {
  const res = await fetch(url, {
    headers: auth ? { Authorization: `Bearer ${token}` } : {}
  });

  if (!res.ok) throw new Error(`❌ Error al obtener: ${url}`);
  
  const data = await res.json();
  if (!data) throw new Error(`❌ Respuesta vacía desde: ${url}`);
  return data;
}

/**
 * 🧮 Contar pedidos por estado (pendiente, enviado, cancelado, etc.)
 */
function contarPedidos(pedidos) {
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
    if (resumen[estado] !== undefined) resumen[estado]++;

    const fecha = new Date(p.createdAt).setHours(0, 0, 0, 0);
    if (fecha === hoy) resumen.hoy++;
  });

  return resumen;
}

/**
 * 🧾 Renderiza las métricas de pedidos en el DOM
 */
function renderMetrics(datos) {
  const ids = {
    total: datos.total,
    pendientes: datos.pendiente,
    en_proceso: datos.en_proceso,
    enviado: datos.enviado,
    cancelado: datos.cancelado,
    hoy: datos.hoy
  };

  Object.entries(ids).forEach(([id, valor]) => {
    const el = document.getElementById(id);
    if (el) el.textContent = valor;
  });
}

/**
 * 📦 Mostrar productos y categorías
 */
function renderProducts(productos) {
  const categorias = {};
  productos.forEach(p => {
    const cat = p.category || "Sin categoría";
    categorias[cat] = (categorias[cat] || 0) + 1;
  });

  const lista = document.getElementById("topCategorias");
  lista.innerHTML = "";

  const ordenado = Object.entries(categorias).sort((a, b) => b[1] - a[1]);

  ordenado.forEach(([cat, cantidad]) => {
    const li = document.createElement("li");
    li.textContent = `📁 ${cat}: ${cantidad}`;
    lista.appendChild(li);
  });
}

/**
 * 📤 Exportar estadísticas a CSV
 */
function exportarEstadisticas() {
  const fecha = new Date().toLocaleString("es-ES");

  let csv = `📊 Estadísticas de KM & EZ ROPA\nFecha: ${fecha}\n\n`;

  csv += "Resumen de pedidos\n";
  csv += `Ventas Totales,$${ventasTotales}\n`;
  csv += `Pedidos Totales,${pedidosTotales}\n`;
  csv += `Pedidos del Día,${pedidosHoy}\n`;

  csv += "Top Categorías\n";
  categorias.forEach(([cat, cantidad]) => {
    csv += `${cat},${cantidad}\n`;
  });

  // Descargar el archivo CSV
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `estadisticas_km-ez-ropa_${Date.now()}.csv`;
  link.click();
}

// 🧾 Exportar la función exportarEstadisticas y goBack a la ventana global
window.exportarEstadisticas = exportarEstadisticas;
window.goBack = goBack;
