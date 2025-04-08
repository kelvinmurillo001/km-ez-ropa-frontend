"use strict";

// 🔐 Verificación de sesión
const token = localStorage.getItem("token");
if (!token) {
  alert("⚠️ No autorizado. Inicia sesión.");
  window.location.href = "login.html";
}

// 🌐 Endpoints
const API_BASE = "https://km-ez-ropa-backend.onrender.com/api";
const API_PRODUCTS = `${API_BASE}/products`;
const API_ORDERS = `${API_BASE}/orders`;
const API_VISITS = `${API_BASE}/stats/contador`;

/**
 * 📊 Cargar estadísticas generales
 */
async function loadStatistics() {
  try {
    const [products, orders, visits] = await Promise.all([
      fetchData(API_PRODUCTS),
      fetchData(API_ORDERS, true),
      fetchData(API_VISITS, true)
    ]);

    renderProductStats(products);
    renderTopCategories(products);
    renderVisitStats(visits);
    renderSalesStats(orders);

  } catch (err) {
    console.error("❌ Error cargando estadísticas:", err);
    alert("❌ No se pudieron cargar las estadísticas.");
  }
}

/**
 * 🌐 Obtener datos de un endpoint
 */
async function fetchData(url, auth = false) {
  const res = await fetch(url, {
    headers: auth ? { Authorization: `Bearer ${token}` } : {}
  });

  if (!res.ok) throw new Error(`❌ Error al obtener datos de: ${url}`);

  const data = await res.json();
  if (!data) throw new Error(`❌ Respuesta vacía desde: ${url}`);

  return data;
}

/**
 * 🧮 Mostrar total de productos y promociones activas
 */
function renderProductStats(products) {
  const total = products.length;
  const destacados = products.filter(p => p.featured).length;

  document.getElementById("totalProductos").textContent = total;
  document.getElementById("promosActivas").textContent = destacados;
}

/**
 * 📂 Calcular y mostrar top categorías
 */
function renderTopCategories(products) {
  const counter = {};

  products.forEach(p => {
    const cat = p.category || "Sin categoría";
    counter[cat] = (counter[cat] || 0) + 1;
  });

  const sorted = Object.entries(counter).sort((a, b) => b[1] - a[1]);
  const listEl = document.getElementById("topCategorias");
  listEl.innerHTML = "";

  sorted.forEach(([name, count]) => {
    const li = document.createElement("li");
    li.textContent = `${name}: ${count}`;
    listEl.appendChild(li);
  });
}

/**
 * 👁️ Mostrar visitas registradas
 */
function renderVisitStats(visitasData) {
  const total = visitasData.total || 0;
  document.getElementById("visitas").textContent = total;
}

/**
 * 💰 Mostrar total de ventas (solo pedidos enviados)
 */
function renderSalesStats(orders) {
  const enviados = orders.filter(p => p.estado === "enviado");
  const totalVentas = enviados.reduce((acc, p) => acc + parseFloat(p.total || 0), 0);
  document.getElementById("ventasTotales").textContent = totalVentas.toFixed(2);
}

/**
 * 🔙 Regresar al panel
 */
function goBack() {
  window.location.href = "panel.html";
}

// ▶️ Ejecutar carga al iniciar
loadStatistics();
