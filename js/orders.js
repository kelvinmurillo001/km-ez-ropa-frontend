"use strict";

// 🌐 Configuración
const API_ORDERS = "https://km-ez-ropa-backend.onrender.com/api/orders";
const container = document.getElementById("pedidos-container");
const token = localStorage.getItem("token");

if (!token) {
  alert("⚠️ No autorizado. Inicia sesión primero.");
  window.location.href = "login.html";
}

let pedidosPrevios = 0;
let todosLosPedidos = [];

// ▶️ Inicializar
cargarPedidos();
setInterval(monitorearPedidos, 10000);

/**
 * 📥 Obtener y mostrar pedidos
 */
async function cargarPedidos() {
  if (!container) return;
  container.innerHTML = "⏳ Cargando pedidos...";

  try {
    const pedidos = await fetchPedidos();
    todosLosPedidos = pedidos;
    pedidosPrevios = pedidos.length;
    renderPedidos(pedidos);
  } catch (err) {
    console.error("❌", err);
    container.innerHTML = "❌ No se pudieron cargar los pedidos.";
  }
}

/**
 * 🌐 Obtener pedidos desde el backend
 */
async function fetchPedidos() {
  const res = await fetch(API_ORDERS, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) throw new Error("Error al obtener pedidos");

  const data = await res.json();
  if (!Array.isArray(data)) throw new Error("❌ Respuesta inválida");

  return data;
}

/**
 * 🧾 Renderizar pedidos en pantalla
 */
function renderPedidos(pedidos) {
  container.innerHTML = pedidos.length
    ? ""
    : "<p>No hay pedidos para mostrar.</p>";

  pedidos.forEach(pedido => {
    const card = crearCardPedido(pedido);
    container.appendChild(card);
  });
}

/**
 * 🧱 Crear HTML de cada pedido
 */
function crearCardPedido(p) {
  const card = document.createElement("div");
  card.className = "pedido-card fade-in";

  const itemsHTML = p.items.map(i =>
    `<li>${i.nombre} (x${i.cantidad}) - $${i.precio}</li>`
  ).join("");

  card.innerHTML = `
    <h3>📌 ${p.nombreCliente || "Sin nombre"}</h3>
    <p><strong>Total:</strong> $${p.total}</p>
    <ul>${itemsHTML}</ul>
    <p><strong>Nota:</strong> ${p.nota || "—"}</p>
    <p class="fecha">📅 ${new Date(p.createdAt).toLocaleString()}</p>

    <label>Estado:</label>
    <select class="estado-select" data-id="${p._id}">
      ${["pendiente", "en_proceso", "enviado", "cancelado"].map(estado => `
        <option value="${estado}" ${p.estado === estado ? "selected" : ""}>
          ${estadoIcono(estado)} ${estado.charAt(0).toUpperCase() + estado.slice(1).replace("_", " ")}
        </option>
      `).join("")}
    </select>

    <button onclick="actualizarEstado('${p._id}', getEstadoSeleccionado('${p._id}'))">
      🔄 Actualizar
    </button>
  `;

  return card;
}

/**
 * 🔄 Obtener estado seleccionado del select
 */
function getEstadoSeleccionado(id) {
  const select = document.querySelector(`select[data-id="${id}"]`);
  return select?.value || "pendiente";
}

/**
 * ✏️ Iconos por estado
 */
function estadoIcono(estado) {
  const iconos = {
    pendiente: "⏳",
    en_proceso: "⚙️",
    enviado: "📦",
    cancelado: "❌"
  };
  return iconos[estado] || "";
}

/**
 * ✅ Actualizar estado del pedido
 */
async function actualizarEstado(id, estado) {
  try {
    const res = await fetch(`${API_ORDERS}/${id}/estado`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ estado })
    });

    const result = await res.json();
    if (res.ok) {
      alert("✅ Estado actualizado");
      cargarPedidos();
    } else {
      alert("❌ " + (result.message || "No se pudo actualizar"));
    }

  } catch (err) {
    console.error("❌", err);
    alert("❌ Error al conectar con el servidor");
  }
}

/**
 * 🔍 Filtrar por estado
 */
function filtrarPedidos() {
  const filtro = document.getElementById("filtroEstado")?.value || "todos";
  const filtrados = filtro === "todos"
    ? todosLosPedidos
    : todosLosPedidos.filter(p => p.estado === filtro);
  renderPedidos(filtrados);
}

/**
 * 📤 Exportar pedidos a TXT
 */
function exportarPedidos() {
  const contenido = todosLosPedidos.map(p => {
    const items = p.items.map(i => `- ${i.nombre} x${i.cantidad}`).join("\n");
    return `Cliente: ${p.nombreCliente}
Total: $${p.total}
Estado: ${p.estado}
Fecha: ${new Date(p.createdAt).toLocaleString()}
Items:
${items}
==============================`;
  }).join("\n");

  const blob = new Blob([contenido], { type: "text/plain" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "pedidos_km_ez_ropa.txt";
  link.click();
}

/**
 * 🔔 Monitorear nuevos pedidos
 */
async function monitorearPedidos() {
  try {
    const nuevos = await fetchPedidos();
    if (nuevos.length > pedidosPrevios) {
      const sonido = new Audio("https://notificationsounds.com/storage/sounds/file-sounds-1152-pristine.mp3");
      sonido.play();
    }
    pedidosPrevios = nuevos.length;
  } catch (err) {
    console.warn("❌ Error monitoreando pedidos:", err);
  }
}

/**
 * 🔙 Volver al panel
 */
function regresarAlPanel() {
  window.location.href = "panel.html";
}
