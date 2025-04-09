"use strict";

// 🔐 Verificación de sesión
const token = localStorage.getItem("token");
if (!token) {
  alert("⚠️ No autorizado. Inicia sesión.");
  window.location.href = "login.html";
}

const API_BASE = "https://km-ez-ropa-backend.onrender.com/api";
const API_RESUMEN = `${API_BASE}/stats/resumen`;
const API_PRODUCTS = `${API_BASE}/products`;

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
 * 📥 Renderiza resumen general (ventas, visitas, pedidos, etc)
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
 * 📦 Muestra productos agrupados por categoría
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
 * 🧾 Helper para asignar valores al DOM
 */
function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

/**
 * 🔙 Volver al panel
 */
function goBack() {
  window.location.href = "panel.html";
}
