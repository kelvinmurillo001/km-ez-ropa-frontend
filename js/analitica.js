"use strict";

// ✅ Utilidades
import { verificarSesion, goBack } from "./admin-utils.js";
import { API_BASE } from "./config.js";

// 🔐 Verificar sesión
const token = verificarSesion();

// 🔗 Endpoints
const API_RESUMEN = `${API_BASE}/api/stats/resumen`;
const API_PRODUCTS = `${API_BASE}/api/products`;

// 📊 Variables globales
let estadisticas = null;
let productos = [];
let pedidosPorDia = [];

// ▶️ Inicializar
document.addEventListener("DOMContentLoaded", () => {
  mostrarCargando();
  cargarEstadisticas();
});

/**
 * 📊 Obtener datos principales
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
    pedidosPorDia = resumen.pedidosPorDia || [];

    renderResumen(resumen);
    renderCategorias(productos);
    renderGraficaPedidosPorDia(pedidosPorDia);

  } catch (err) {
    console.error("❌ Error cargando estadísticas:", err);
    alert("❌ No se pudieron obtener los datos del sistema.");
  }
}

/**
 * 🌐 Fetch genérico con token
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
 * ⏳ Mostrar estado cargando
 */
function mostrarCargando() {
  const campos = [
    "totalProductos", "promosActivas", "visitas",
    "ventasTotales", "pedidosTotales", "pedidosHoy"
  ];
  campos.forEach(id => setTexto(id, "⏳"));
}

/**
 * 🧾 Resumen general
 */
function renderResumen(data = {}) {
  setTexto("totalProductos", data.totalProductos ?? 0);
  setTexto("promosActivas", data.productosDestacados ?? 0);
  setTexto("visitas", data.totalVisitas ?? 0);
  setTexto("ventasTotales", `$${(data.ventasTotales ?? 0).toFixed(2)}`);
  setTexto("pedidosTotales", data.pedidosTotales ?? 0);
  setTexto("pedidosHoy", data.pedidosHoy ?? 0);
}

/**
 * 📁 Categorías populares
 */
function renderCategorias(productos = []) {
  const conteo = {};

  productos.forEach(p => {
    const cat = p.category || "Sin categoría";
    conteo[cat] = (conteo[cat] || 0) + 1;
  });

  const lista = document.getElementById("topCategorias");
  if (!lista) return;

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
 * 📉 Gráfico de pedidos por día
 */
function renderGraficaPedidosPorDia(series = []) {
  const contenedor = document.getElementById("graficaPedidos");
  if (!contenedor) return;

  if (typeof Chart === "undefined") {
    contenedor.innerHTML = "<p>📊 Gráfica no disponible. Agrega Chart.js para visualizar.</p>";
    return;
  }

  const labels = series.map(s => s.fecha);
  const valores = series.map(s => s.total);

  contenedor.innerHTML = `<canvas id="graficoPedidosCanvas" height="180"></canvas>`;
  const ctx = document.getElementById("graficoPedidosCanvas").getContext("2d");

  new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Pedidos por día",
        data: valores,
        backgroundColor: "#ff6d00"
      }]
    },
    options: {
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
}

/**
 * 📤 Exportar CSV
 */
function exportarEstadisticas() {
  if (!estadisticas || !Array.isArray(productos)) {
    return alert("⚠️ Aún no se cargaron los datos.");
  }

  const fecha = new Date().toLocaleString("es-ES");
  let csv = `Estadísticas KM & EZ ROPA\nFecha:,${fecha}\n\n`;

  csv += "Resumen General\n";
  csv += `Ventas Totales,${estadisticas.ventasTotales ?? 0}\n`;
  csv += `Pedidos Totales,${estadisticas.pedidosTotales ?? 0}\n`;
  csv += `Pedidos del Día,${estadisticas.pedidosHoy ?? 0}\n`;
  csv += `Total Productos,${estadisticas.totalProductos ?? 0}\n`;
  csv += `Promociones Activas,${estadisticas.productosDestacados ?? 0}\n`;
  csv += `Visitas al Sitio,${estadisticas.totalVisitas ?? 0}\n\n`;

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

/**
 * 🔠 Insertar texto en el DOM
 */
function setTexto(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

// 🌐 Globales
window.exportarEstadisticas = exportarEstadisticas;
window.goBack = goBack;
