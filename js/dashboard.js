"use strict";

const API_BASE = "https://km-ez-ropa-backend.onrender.com/api";
const API_RESUMEN = `${API_BASE}/stats/resumen`;
const API_PRODUCTS = `${API_BASE}/products`;

// 🔐 Validación de sesión
const token = localStorage.getItem("token");
if (!token || !esTokenValido(token)) {
  alert("⚠️ No autorizado. Inicia sesión.");
  window.location.href = "login.html";
}

function esTokenValido(token) {
  return typeof token === "string" && token.split(".").length === 3;
}

let datosResumen = null;
let productosGlobal = [];

document.addEventListener("DOMContentLoaded", cargarDashboard);

/**
 * ▶️ Inicia el dashboard
 */
async function cargarDashboard() {
  try {
    const [resumen, productos] = await Promise.all([
      fetchData(API_RESUMEN, true),
      fetchData(API_PRODUCTS)
    ]);

    datosResumen = resumen;
    productosGlobal = productos;

    renderResumen(resumen);
    renderTopCategorias(productos);
  } catch (err) {
    console.error("❌ Error cargando dashboard:", err);
    alert("❌ No se pudo cargar el dashboard");
  }
}

/**
 * 🌐 Fetch API con token opcional
 */
async function fetchData(url, auth = false) {
  const res = await fetch(url, {
    headers: auth ? { Authorization: `Bearer ${token}` } : {}
  });

  if (!res.ok) throw new Error(`❌ Error al obtener: ${url}`);
  const data = await res.json();
  if (!data) throw new Error("❌ Respuesta vacía");
  return data;
}

/**
 * 📊 Renderiza las métricas principales
 */
function renderResumen(data) {
  setText("ventasTotales", `$${data.ventasTotales}`);
  setText("visitasTotales", data.totalVisitas);
  setText("totalProductos", data.totalProductos);
  setText("promosActivas", data.productosDestacados);
}

/**
 * 📁 Muestra categorías ordenadas
 */
function renderTopCategorias(productos) {
  const categorias = {};
  productos.forEach(p => {
    const cat = p.category || "Sin categoría";
    categorias[cat] = (categorias[cat] || 0) + 1;
  });

  const lista = document.getElementById("topCategorias");
  lista.innerHTML = "";

  const ordenadas = Object.entries(categorias).sort((a, b) => b[1] - a[1]);

  ordenadas.forEach(([cat, count]) => {
    const li = document.createElement("li");
    li.textContent = `📁 ${cat}: ${count}`;
    lista.appendChild(li);
  });
}

/**
 * 🧾 Asigna texto a un span por ID
 */
function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

/**
 * 📤 Exportar CSV
 */
function exportarEstadisticas() {
  if (!datosResumen) {
    alert("❌ Aún no se cargan los datos.");
    return;
  }

  const now = new Date().toLocaleString();
  const resumen = datosResumen;

  let csv = `📊 Estadísticas KM & EZ ROPA\nFecha: ${now}\n\nResumen General\n`;
  csv += `Ventas Totales,${resumen.ventasTotales}\n`;
  csv += `Pedidos Totales,${resumen.pedidosTotales}\n`;
  csv += `Pedidos del Día,${resumen.pedidosHoy}\n`;
  csv += `Total Productos,${resumen.totalProductos}\n`;
  csv += `Promociones Activas,${resumen.productosDestacados}\n`;
  csv += `Visitas al Sitio,${resumen.totalVisitas}\n\n`;

  csv += "Top Categorías\n";
  const categorias = {};
  productosGlobal.forEach(p => {
    const cat = p.category || "Sin categoría";
    categorias[cat] = (categorias[cat] || 0) + 1;
  });

  for (const [cat, count] of Object.entries(categorias)) {
    csv += `${cat},${count}\n`;
  }

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `dashboard_km-ez-ropa_${Date.now()}.csv`;
  link.click();
}

/**
 * 🔙 Regresar al panel principal
 */
function goBack() {
  window.location.href = "panel.html";
}

window.exportarEstadisticas = exportarEstadisticas;
