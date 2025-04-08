"use strict";

// 🔐 Verificación de sesión antes de cargar dashboard
const token = localStorage.getItem("token");
if (!token) {
  alert("⚠️ No autorizado. Inicia sesión.");
  window.location.href = "login.html";
}

// 🌐 Endpoint API de pedidos
const API_ORDERS = "https://km-ez-ropa-backend.onrender.com/api/orders";

/**
 * 📊 Cargar datos estadísticos del dashboard
 * - Cuenta pedidos por estado
 * - Cuenta cuántos fueron realizados hoy
 */
async function cargarDashboard() {
  try {
    const res = await fetch(API_ORDERS, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!res.ok) throw new Error("Error al obtener pedidos");

    const pedidos = await res.json();
    if (!Array.isArray(pedidos)) throw new Error("Respuesta inesperada del servidor");

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0); // 🕛 Establece el inicio del día

    const estadoContador = {
      pendiente: 0,
      en_proceso: 0,
      enviado: 0,
      cancelado: 0,
      hoy: 0,
      total: pedidos.length
    };

    // 🔄 Clasificar pedidos
    pedidos.forEach(pedido => {
      const estado = pedido.estado || "pendiente";
      if (estadoContador[estado] !== undefined) {
        estadoContador[estado]++;
      }

      const fecha = new Date(pedido.createdAt);
      if (!isNaN(fecha) && fecha >= hoy) {
        estadoContador.hoy++;
      }
    });

    // 🧾 Mostrar métricas en el DOM
    document.getElementById("total").textContent = estadoContador.total;
    document.getElementById("pendientes").textContent = estadoContador.pendiente;
    document.getElementById("en_proceso").textContent = estadoContador.en_proceso;
    document.getElementById("enviado").textContent = estadoContador.enviado;
    document.getElementById("cancelado").textContent = estadoContador.cancelado;
    document.getElementById("hoy").textContent = estadoContador.hoy;

  } catch (err) {
    console.error("❌ Error cargando métricas:", err);
    alert("❌ No se pudieron cargar los datos del dashboard.");
  }
}

// ▶️ Ejecutar al iniciar la vista del panel
cargarDashboard();
