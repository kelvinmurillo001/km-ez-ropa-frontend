// 🔐 Verificación de sesión
const token = localStorage.getItem("token");
if (!token) {
  alert("⚠️ No autorizado. Inicia sesión.");
  window.location.href = "login.html";
}

// 🌐 API backend
const API_ORDERS = "https://km-ez-ropa-backend.onrender.com/api/orders";

// 📊 Cargar datos del dashboard
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
    hoy.setHours(0, 0, 0, 0);

    const estadoContador = {
      pendiente: 0,
      en_proceso: 0,
      enviado: 0,
      cancelado: 0,
      hoy: 0,
      total: pedidos.length
    };

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

    // 🧾 Mostrar datos en el DOM
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

// ▶️ Ejecutar al iniciar
cargarDashboard();
