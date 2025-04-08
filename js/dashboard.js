"use strict";

// 🌐 Endpoint API de pedidos
const API_ORDERS = "https://km-ez-ropa-backend.onrender.com/api/orders";

// 🔐 Verificar token y rol al iniciar
const token = localStorage.getItem("token");
if (!esTokenValido(token)) {
  alert("⚠️ No autorizado. Inicia sesión.");
  window.location.href = "login.html";
}

/**
 * ✅ Valida estructura mínima del token
 */
function esTokenValido(token) {
  return token && typeof token === "string" && token.split(".").length === 3;
}

/**
 * 📊 Cargar datos estadísticos del dashboard
 */
async function cargarDashboard() {
  try {
    const pedidos = await obtenerPedidos();

    const resumen = contarPedidos(pedidos);
    mostrarMétricas(resumen);
  } catch (err) {
    console.error("❌ Error cargando métricas:", err);
    alert("❌ No se pudieron cargar los datos del dashboard.");
  }
}

/**
 * 📥 Solicita pedidos al backend
 */
async function obtenerPedidos() {
  const res = await fetch(API_ORDERS, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!res.ok) throw new Error("Error al obtener pedidos");

  const data = await res.json();
  if (!Array.isArray(data)) throw new Error("Respuesta inesperada del servidor");

  return data;
}

/**
 * 🧮 Cuenta los pedidos por estado y los del día
 */
function contarPedidos(pedidos) {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const contador = {
    pendiente: 0,
    en_proceso: 0,
    enviado: 0,
    cancelado: 0,
    hoy: 0,
    total: pedidos.length
  };

  pedidos.forEach(p => {
    const estado = p.estado || "pendiente";
    if (contador[estado] !== undefined) contador[estado]++;

    const fecha = new Date(p.createdAt);
    if (!isNaN(fecha) && fecha >= hoy) contador.hoy++;
  });

  return contador;
}

/**
 * 🖼️ Renderiza métricas en el DOM
 */
function mostrarMétricas(data) {
  document.getElementById("total").textContent = data.total;
  document.getElementById("pendientes").textContent = data.pendiente;
  document.getElementById("en_proceso").textContent = data.en_proceso;
  document.getElementById("enviado").textContent = data.enviado;
  document.getElementById("cancelado").textContent = data.cancelado;
  document.getElementById("hoy").textContent = data.hoy;
}

// ▶️ Iniciar carga del dashboard
cargarDashboard();
