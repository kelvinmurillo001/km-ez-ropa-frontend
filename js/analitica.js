"use strict";

// 🔐 Verificación de sesión
const token = localStorage.getItem("token");
if (!token || typeof token !== "string" || token.length < 10) {
  alert("⚠️ No autorizado. Inicia sesión.");
  window.location.href = "login.html";
}

const API_BASE = "https://km-ez-ropa-backend.onrender.com/api";
const API_RESUMEN = `${API_BASE}/stats/resumen`;
const API_PRODUCTS = `${API_BASE}/products`;

let estadisticasResumen = null;
let productosGlobal = [];

document.addEventListener("DOMContentLoaded", loadStatistics);

/**
 * 📊 Cargar estadísticas generales desde el backend
 */
async function loadStatistics() {
  try {
    const [resumen, productos] = await Promise.all([
      fetchData(API_RESUMEN, true),
      fetchData(API_PRODUCTS)
    ]);

    if (!resumen || !Array.isArray(productos)) {
      throw new Error("❌ Datos inválidos");
    }

    estadisticasResumen = resumen;
    productosGlobal = productos;

    renderResumen(resumen);
    renderTopCategorias(productos);
  } catch (err) {
    console.error("❌ Error cargando estadísticas:", err);
    alert("❌ No se pudieron cargar las estadísticas.");
  }
}

/**
 * 🌐 Realiza fetch con o sin autorización
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
 * 🧾 Mostrar resumen general en el DOM
 */
function renderResumen(data) {
  setText("totalProductos", data.totalProductos);
  setText("promosActivas", data.productosDestacados);
  setText("visitas", data.totalVisitas);
  setText("ventasTotales", `$${data.ventasTotales}`);
  setText("pedidosTotales", data.pedidosTotales);
  setText("pedidosHoy", data.pedidosHoy);
}

/**
 * 📦 Mostrar categorías más utilizadas
 */
function renderTopCategorias(productos) {
  const categorias = {};

  productos.forEach(p => {
    const cat = p.category || "Sin categoría";
    categorias[cat] = (categorias[cat] || 0) + 1;
  });

  const lista = document.getElementById("topCategorias");
  lista.innerHTML = "";

  const ordenado = Object.entries(categorias).sort((a, b) => b[1] - a[1]);

  for (const [cat, cantidad] of ordenado) {
    const li = document.createElement("li");
    li.textContent = `📁 ${cat}: ${cantidad}`;
    lista.appendChild(li);
  }
}

/**
 * 🧾 Utilidad para asignar valores a elementos del DOM
 */
function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

/**
 * 🔙 Volver al panel principal
 */
function goBack() {
  window.location.href = "panel.html";
}

/**
 * 📤 Exportar las estadísticas actuales a un archivo CSV
 */
function exportarEstadisticas() {
  if (!estadisticasResumen || productosGlobal.length === 0) {
    alert("❌ Datos aún no cargados.");
    return;
  }

  const fecha = new Date().toLocaleString("es-ES");
  const r = estadisticasResumen;

  let csv = `📊 Estadísticas de KM & EZ ROPA\nFecha:,${fecha}\n\n`;
  csv += "Resumen General\n";
  csv += `Ventas Totales,${r.ventasTotales}\n`;
  csv += `Pedidos Totales,${r.pedidosTotales}\n`;
  csv += `Pedidos del Día,${r.pedidosHoy}\n`;
  csv += `Total Productos,${r.totalProductos}\n`;
  csv += `Promociones Activas,${r.productosDestacados}\n`;
  csv += `Visitas al Sitio,${r.totalVisitas}\n\n`;

  csv += "Top Categorías\n";
  const categorias = {};
  productosGlobal.forEach(p => {
    const cat = p.category || "Sin categoría";
    categorias[cat] = (categorias[cat] || 0) + 1;
  });

  for (const [cat, count] of Object.entries(categorias)) {
    csv += `${cat},${count}\n`;
  }

  // 🧾 Descargar archivo CSV
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `estadisticas_km-ez-ropa_${Date.now()}.csv`;
  link.click();
}

// ⬆️ Hacer accesible desde el botón del HTML
window.exportarEstadisticas = exportarEstadisticas;
window.goBack = goBack;
