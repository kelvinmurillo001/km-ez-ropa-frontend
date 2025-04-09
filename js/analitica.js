"use strict";

// 🔐 Verificación de sesión
const token = localStorage.getItem("token");
if (!token) {
  alert("⚠️ No autorizado. Inicia sesión.");
  window.location.href = "login.html";
}

const API_BASE = "https://km-ez-ropa-backend.onrender.com/api";
const API_PRODUCTS = `${API_BASE}/products`;
const API_ORDERS = `${API_BASE}/orders`;
const API_VISITS = `${API_BASE}/stats/contador`;

document.addEventListener("DOMContentLoaded", loadStatistics);

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

    if (!Array.isArray(products) || !Array.isArray(orders)) {
      throw new Error("❌ Respuesta inesperada");
    }

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

function renderProductStats(products) {
  setText("totalProductos", products.length);
  setText("promosActivas", products.filter(p => p.featured).length);
}

function renderTopCategories(products) {
  const counter = {};

  for (const p of products) {
    const cat = p.category || "Sin categoría";
    counter[cat] = (counter[cat] || 0) + 1;
  }

  const sorted = Object.entries(counter).sort((a, b) => b[1] - a[1]);
  const list = document.getElementById("topCategorias");
  list.innerHTML = "";

  for (const [cat, count] of sorted) {
    const li = document.createElement("li");
    li.textContent = `📁 ${cat}: ${count}`;
    list.appendChild(li);
  }
}

function renderVisitStats(visitasData) {
  const total = visitasData.total || visitasData.length || 0;
  setText("visitas", total);
}

function renderSalesStats(orders) {
  const enviados = orders.filter(p => p.estado === "enviado");
  const total = enviados.reduce((sum, p) => sum + parseFloat(p.total || 0), 0);
  setText("ventasTotales", total.toFixed(2));
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}
