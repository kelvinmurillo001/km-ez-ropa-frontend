"use strict";

// ✅ Importar utilidades comunes
import { verificarSesion, goBack } from "./admin-utils.js";

// 🔐 Validar sesión
const token = verificarSesion();

// 🔗 API Endpoints
const API_BASE = "https://km-ez-ropa-backend.onrender.com/api";
const API_RESUMEN = `${API_BASE}/stats/resumen`;
const API_PRODUCTS = `${API_BASE}/products`;

// 🔄 Datos globales
let estadisticas = null;
let productos = [];

// ▶️ Inicializar
document.addEventListener("DOMContentLoaded", () => {
  cargarEstadisticas();
});

/**
 * 📊 Cargar estadísticas y productos
 */
async function cargarEstadisticas() {
  try {
    const [resumen, productosData] = await Promise.all([
      fetchAPI(API_RESUMEN, true),
      fetchAPI(API_PRODUCTS)
    ]);

    if (!resumen || !Array.isArray(productosData)) throw new Error("❌ Datos inválidos");

    estadisticas = resumen;
    productos = productosData;

    renderResumen(resumen);
    renderCategorias(productos);
  } catch (err) {
    console.error("❌ Error cargando estadísticas:", err);
    alert("❌ No se pudieron obtener los datos del sistema.");
  }
}

/**
 * 🌐 Fetch genérico con/sin autorización
 * @param {string} url
 * @param {boolean} auth
 * @returns {Promise<any>}
 */
async function fetchAPI(url, auth = false) {
  const res = await fetch(url, {
    headers: auth ? { Authorization: `Bearer ${token}` } : {}
  });

  if (!res.ok) throw new Error(`❌ Error al obtener datos de ${url}`);

  const data = await res.json();
  if (!data) throw new Error(`❌ Respuesta vacía de ${url}`);

  return data;
}

/**
 * 🧾 Mostrar resumen en DOM
 * @param {object} data
 */
function renderResumen(data) {
  setTexto("totalProductos", data.totalProductos);
  setTexto("promosActivas", data.productosDestacados);
  setTexto("visitas", data.totalVisitas);
  setTexto("ventasTotales", `$${data.ventasTotales}`);
  setTexto("pedidosTotales", data.pedidosTotales);
  setTexto("pedidosHoy", data.pedidosHoy);
}

/**
 * 📁 Mostrar top categorías
 * @param {Array<object>} productos
 */
function renderCategorias(productos) {
  const conteo = {};

  productos.forEach(p => {
    const cat = p.category || "Sin categoría";
    conteo[cat] = (conteo[cat] || 0) + 1;
  });

  const lista = document.getElementById("topCategorias");
  lista.innerHTML = "";

  Object.entries(conteo)
    .sort((a, b) => b[1] - a[1])
    .forEach(([cat, count]) => {
      const li = document.createElement("li");
      li.textContent = `📁 ${cat}: ${count}`;
      lista.appendChild(li);
    });
}

/**
 * 🔠 Establecer texto de un elemento
 * @param {string} id
 * @param {string|number} value
 */
function setTexto(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

/**
 * 📤 Exportar resumen como CSV
 */
function exportarEstadisticas() {
  if (!estadisticas || productos.length === 0) {
    return alert("⚠️ Aún no se cargaron los datos.");
  }

  const fecha = new Date().toLocaleString("es-ES");
  let csv = `Estadísticas KM & EZ ROPA\nFecha:,${fecha}\n\n`;

  csv += "Resumen General\n";
  csv += `Ventas Totales,${estadisticas.ventasTotales}\n`;
  csv += `Pedidos Totales,${estadisticas.pedidosTotales}\n`;
  csv += `Pedidos del Día,${estadisticas.pedidosHoy}\n`;
  csv += `Total Productos,${estadisticas.totalProductos}\n`;
  csv += `Promociones Activas,${estadisticas.productosDestacados}\n`;
  csv += `Visitas al Sitio,${estadisticas.totalVisitas}\n\n`;

  const categorias = {};
  productos.forEach(p => {
    const cat = p.category || "Sin categoría";
    categorias[cat] = (categorias[cat] || 0) + 1;
  });

  csv += "Top Categorías\n";
  Object.entries(categorias).forEach(([cat, count]) => {
    csv += `${cat},${count}\n`;
  });

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `analitica_km-ez-ropa_${Date.now()}.csv`;
  link.click();
}

// 🌐 Exponer funciones al global scope
window.exportarEstadisticas = exportarEstadisticas;
window.goBack = goBack;
