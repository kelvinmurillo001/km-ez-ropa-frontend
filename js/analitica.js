"use strict";

// 🔐 Verificar sesión
const token = localStorage.getItem("token");
if (!token) {
  alert("⚠️ No autorizado. Inicia sesión.");
  window.location.href = "login.html";
}

// 🌐 Endpoints
const API_BASE = "https://km-ez-ropa-backend.onrender.com/api";
const API_PRODUCTS = `${API_BASE}/products`;
const API_PEDIDOS = `${API_BASE}/orders`;
const API_VISITAS = `${API_BASE}/stats/contador`;

/**
 * 📊 Cargar estadísticas del sistema
 * - Total productos
 * - Promociones activas
 * - Top categorías
 * - Total visitas
 * - Ventas enviadas
 */
async function loadStatistics() {
  try {
    // 📦 Productos
    const resProd = await fetch(API_PRODUCTS);
    if (!resProd.ok) throw new Error("Error al obtener productos");
    const products = await resProd.json();
    if (!Array.isArray(products)) throw new Error("❌ Formato inválido de productos");

    const totalProductos = products.length;
    const promosActivas = products.filter(p => p.featured).length;

    document.getElementById("totalProductos").textContent = totalProductos;
    document.getElementById("promosActivas").textContent = promosActivas;

    // 📂 Top categorías
    const categoryCount = {};
    products.forEach(p => {
      const cat = p.category || "Sin categoría";
      categoryCount[cat] = (categoryCount[cat] || 0) + 1;
    });

    const categoriaEl = document.getElementById("topCategorias");
    categoriaEl.innerHTML = "";

    const sortedCategories = Object.entries(categoryCount).sort((a, b) => b[1] - a[1]);
    sortedCategories.forEach(([cat, count]) => {
      const li = document.createElement("li");
      li.textContent = `${cat}: ${count}`;
      categoriaEl.appendChild(li);
    });

    // 👁️ Visitas
    const resVisitas = await fetch(API_VISITAS, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!resVisitas.ok) throw new Error("Error al obtener visitas");

    const visitasData = await resVisitas.json();
    document.getElementById("visitas").textContent = visitasData.total || 0;

    // 💰 Ventas (solo pedidos enviados)
    const resPedidos = await fetch(API_PEDIDOS, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!resPedidos.ok) throw new Error("Error al obtener pedidos");

    const pedidos = await resPedidos.json();
    if (!Array.isArray(pedidos)) throw new Error("❌ Formato inválido de pedidos");

    const enviados = pedidos.filter(p => p.estado === "enviado");
    const totalVentas = enviados.reduce((sum, p) => sum + parseFloat(p.total || 0), 0);

    document.getElementById("ventasTotales").textContent = totalVentas.toFixed(2);

  } catch (err) {
    console.error("❌ Error cargando estadísticas:", err);
    alert("❌ No se pudieron cargar las estadísticas.");
  }
}

/**
 * 🔙 Regresar al panel principal
 */
function goBack() {
  window.location.href = "panel.html";
}

// ▶️ Ejecutar carga al iniciar
loadStatistics();
