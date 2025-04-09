"use strict";

const API_ORDERS = "https://km-ez-ropa-backend.onrender.com/api/orders";

// 🔐 Validación inicial de sesión
const token = localStorage.getItem("token");
if (!esTokenValido(token)) {
  alert("⚠️ No autorizado. Inicia sesión.");
  window.location.href = "login.html";
}

/**
 * ✅ Verifica si el token tiene estructura válida (JWT)
 */
function esTokenValido(token) {
  return token && typeof token === "string" && token.split(".").length === 3;
}

/**
 * ▶️ Iniciar carga de métricas
 */
document.addEventListener("DOMContentLoaded", cargarDashboard);

/**
 * 📊 Carga pedidos y muestra resumen
 */
async function cargarDashboard() {
  try {
    const pedidos = await obtenerPedidos();
    const resumen = contarPedidos(pedidos);
    renderizarMétricas(resumen);
  } catch (err) {
    console.error("❌ Error cargando métricas:", err);
    alert("❌ No se pudieron cargar los datos del dashboard.");
  }
}

/**
 * 📥 Fetch de pedidos con token
 */
async function obtenerPedidos() {
  const res = await fetch(API_ORDERS, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) throw new Error("Error al obtener pedidos");

  const data = await res.json();
  if (!Array.isArray(data)) throw new Error("Formato de pedidos inválido");

  return data;
}

/**
 * 🧮 Conteo por estado y pedidos de hoy
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
    if (!isNaN(fecha) && fecha === hoy) resumen.hoy++;
  });

  return resumen;
}

/**
 * 📊 Renderiza valores en HTML
 */
function renderizarMétricas(datos) {
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
