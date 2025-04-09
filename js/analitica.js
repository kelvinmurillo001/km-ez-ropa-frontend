"use strict";

// ✅ Importar utilidades comunes del admin
import { verificarSesion, goBack } from "./admin-utils.js";

// 🔐 Validar sesión y obtener token (redirige si no es válido)
const token = verificarSesion();

const API_BASE = "https://km-ez-ropa-backend.onrender.com/api";
const API_RESUMEN = `${API_BASE}/stats/resumen`;
const API_PRODUCTS = `${API_BASE}/products`;

// 🔄 Variables globales para exportación
let estadisticasResumen = null;
let productosGlobal = [];

document.addEventListener("DOMContentLoaded", () => {
  loadStatistics();
});

/**
 * 📊 Cargar estadísticas desde el backend
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
    console.error("❌ Error al cargar estadísticas:", err);
    alert("❌ No se pudieron cargar las estadísticas.");
  }
}

/**
 * 🌐 Fetch con o sin token
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
 * 🧾 Renderizar resumen general en el DOM
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
 * 📁 Renderizar categorías por cantidad
 */
function renderTopCategorias(productos) {
  const categorias = {};

  productos.forEach(p => {
    const cat = p.category || "Sin categoría";
    categorias[cat] = (categorias[cat] || 0) + 1;
  });

  const lista = document.getElementById("topCategorias");
  lista.innerHTML = "";

  Object.entries(categorias)
    .sort((a, b) => b[1] - a[1])
    .forEach(([cat, count]) => {
      const li = document.createElement("li");
      li.textContent = `📁 ${cat}: ${count}`;
      lista.appendChild(li);
    });
}

/**
 * 🔡 Utilidad para insertar texto en un elemento
 */
function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

/**
 * 📤 Exportar estadísticas como archivo CSV
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

  Object.entries(categorias).forEach(([cat, count]) => {
    csv += `${cat},${count}\n`;
  });

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `estadisticas_km-ez-ropa_${Date.now()}.csv`;
  link.click();
}

// 🧾 Exponer funciones necesarias al scope global (para los botones)
window.exportarEstadisticas = exportarEstadisticas;
window.goBack = goBack;
