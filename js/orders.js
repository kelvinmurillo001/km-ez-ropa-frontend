"use strict";

// 🌐 Configuración
const API_ORDERS = "https://km-ez-ropa-backend.onrender.com/api/orders";
const container = document.getElementById("pedidos-container");
const token = localStorage.getItem("token");

// ⛔ Verificación mínima de seguridad
if (!token || typeof token !== "string" || token.length < 10) {
  alert("⚠️ No autorizado. Inicia sesión primero.");
  window.location.href = "login.html";
}

let pedidosPrevios = 0;
let todosLosPedidos = [];

// ▶️ Inicializar
document.addEventListener("DOMContentLoaded", () => {
  cargarPedidos();
  setInterval(monitorearPedidos, 10000); // cada 10s
});

/**
 * 📥 Obtener y mostrar pedidos
 */
async function cargarPedidos() {
  if (!container) return;
  container.innerHTML = "<p>⏳ Cargando pedidos...</p>";

  try {
    const pedidos = await fetchPedidos();
    todosLosPedidos = pedidos;
    pedidosPrevios = pedidos.length;
    renderPedidos(pedidos);
  } catch (err) {
    console.error("❌ Error al cargar pedidos:", err);
    container.innerHTML = "<p>❌ No se pudieron cargar los pedidos.</p>";
  }
}

/**
 * 🌐 Obtener pedidos desde backend
 */
async function fetchPedidos() {
  const res = await fetch(API_ORDERS, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) throw new Error("❌ Error al obtener pedidos");
  const data = await res.json();
  if (!Array.isArray(data)) throw new Error("❌ Formato de datos incorrecto");

  return data;
}

/**
 * 🧾 Renderizar pedidos
 */
function renderPedidos(pedidos) {
  container.innerHTML = pedidos.length
    ? ""
    : "<p class='mensaje-error'>📭 No hay pedidos registrados.</p>";

  pedidos.forEach(p => container.appendChild(crearCardPedido(p)));
}

/**
 * 🧱 Crear tarjeta de pedido
 */
function crearCardPedido(p) {
  const card = document.createElement("div");
  card.className = "pedido-card fade-in";

  const itemsHTML = (p.items || []).map(i =>
    `<li>${i.nombre || "Producto"} (x${i.cantidad || 1}) - $${i.precio || 0}</li>`
  ).join("");

  const fecha = p.createdAt ? new Date(p.createdAt).toLocaleString() : "N/A";
  const estado = p.estado || "pendiente";

  card.innerHTML = `
    <h3>📌 ${p.nombreCliente || "Sin nombre"}</h3>
    <p><strong>Total:</strong> $${p.total || "0.00"}</p>
    <ul>${itemsHTML}</ul>
    <p><strong>Nota:</strong> ${p.nota || "—"}</p>
    <p class="fecha">📅 ${fecha}</p>

    <label for="estado-${p._id}">Estado:</label>
    <select id="estado-${p._id}" class="estado-select" data-id="${p._id}">
      ${["pendiente", "en_proceso", "enviado", "cancelado"].map(e => `
        <option value="${e}" ${estado === e ? "selected" : ""}>
          ${estadoIcono(e)} ${formatearEstado(e)}
        </option>
      `).join("")}
    </select>

    <button class="btn-actualizar" onclick="actualizarEstado('${p._id}', getEstadoSeleccionado('${p._id}'), this)">
      🔄 Actualizar
    </button>
  `;

  return card;
}

/**
 * 🔠 Formatea texto del estado
 */
function formatearEstado(str) {
  return str.replace("_", " ").replace(/^\w/, l => l.toUpperCase());
}

/**
 * 🔄 Obtener estado actual del select
 */
function getEstadoSeleccionado(id) {
  return document.querySelector(`#estado-${id}`)?.value || "pendiente";
}

/**
 * ✅ Actualizar estado de pedido
 */
async function actualizarEstado(id, estado, boton) {
  if (boton) {
    boton.disabled = true;
    boton.textContent = "⏳ Guardando...";
  }

  try {
    const res = await fetch(`${API_ORDERS}/${id}/estado`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ estado })
    });

    const data = await res.json();
    if (res.ok) {
      alert("✅ Estado actualizado correctamente.");
      cargarPedidos();
    } else {
      alert("❌ " + (data.message || "No se pudo actualizar"));
    }
  } catch (err) {
    console.error("❌", err);
    alert("❌ Error al conectar con el servidor");
  } finally {
    if (boton) {
      boton.disabled = false;
      boton.textContent = "🔄 Actualizar";
    }
  }
}

/**
 * 🛠️ Icono de estado
 */
function estadoIcono(estado) {
  const iconos = {
    pendiente: "⏳",
    en_proceso: "⚙️",
    enviado: "📦",
    cancelado: "❌"
  };
  return iconos[estado] || "📋";
}

/**
 * 🔍 Filtrar pedidos por estado
 */
function filtrarPedidos() {
  const filtro = document.getElementById("filtroEstado")?.value || "todos";
  const filtrados = filtro === "todos"
    ? todosLosPedidos
    : todosLosPedidos.filter(p => (p.estado || "pendiente") === filtro);
  renderPedidos(filtrados);
}

/**
 * 📤 Exportar pedidos como TXT
 */
function exportarPedidos() {
  const contenido = todosLosPedidos.map(p => {
    const items = p.items?.map(i =>
      `- ${i.nombre || "Producto"} x${i.cantidad} ($${i.precio})`
    ).join("\n") || "";

    return `Cliente: ${p.nombreCliente || "Desconocido"}
Total: $${p.total}
Estado: ${formatearEstado(p.estado || "pendiente")}
Fecha: ${new Date(p.createdAt).toLocaleString()}
Nota: ${p.nota || "N/A"}
Items:\n${items}
==============================`;
  }).join("\n\n");

  const blob = new Blob([contenido], { type: "text/plain" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `pedidos_km-ezropa_${Date.now()}.txt`;
  link.click();
}

/**
 * 🔔 Sonido si hay nuevos pedidos
 */
async function monitorearPedidos() {
  try {
    const nuevos = await fetchPedidos();
    if (nuevos.length > pedidosPrevios) {
      new Audio("https://notificationsounds.com/storage/sounds/file-sounds-1152-pristine.mp3").play();
    }
    pedidosPrevios = nuevos.length;
  } catch (err) {
    console.warn("❌ Error monitoreando pedidos:", err);
  }
}

/**
 * 🔙 Volver al panel de administración
 */
function regresarAlPanel() {
  window.location.href = "panel.html";
}
