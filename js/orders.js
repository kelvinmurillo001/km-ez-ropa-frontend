"use strict";

// 🌐 Configuración
const API_ORDERS = "https://km-ez-ropa-backend.onrender.com/api/orders";
const container = document.getElementById("pedidos-container");
const token = localStorage.getItem("token");

if (!token || token.length < 10) {
  alert("⚠️ No autorizado. Inicia sesión.");
  window.location.href = "login.html";
}

let pedidosPrevios = 0;
let todosLosPedidos = [];

// ▶️ Inicialización
document.addEventListener("DOMContentLoaded", () => {
  cargarPedidos();
  setInterval(monitorearPedidos, 10000);
});

/* 📥 Cargar pedidos desde backend */
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
    container.innerHTML = "<p class='mensaje-error'>❌ No se pudieron cargar los pedidos.</p>";
  }
}

/* 🔄 Obtener pedidos con token */
async function fetchPedidos() {
  const res = await fetch(API_ORDERS, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error("❌ Error al obtener pedidos");

  const data = await res.json();
  if (!Array.isArray(data)) throw new Error("❌ Formato de pedidos inválido");

  return data;
}

/* 🧾 Renderizar pedidos */
function renderPedidos(pedidos) {
  container.innerHTML = pedidos.length
    ? ""
    : "<p class='mensaje-error'>📭 No hay pedidos registrados.</p>";

  pedidos.forEach(p => container.appendChild(crearCardPedido(p)));
}

/* 🧱 Crear tarjeta de pedido */
function crearCardPedido(p) {
  const card = document.createElement("div");
  card.className = "pedido-card fade-in";

  const fecha = p.createdAt ? new Date(p.createdAt).toLocaleString() : "N/A";
  const estado = p.estado || "pendiente";

  const itemsHTML = (p.items || [])
    .map(i => `<li>${i.nombre || "Producto"} (x${i.cantidad || 1}) - $${i.precio || 0}</li>`)
    .join("");

  card.innerHTML = `
    <h3>📌 ${p.nombreCliente || "Cliente desconocido"}</h3>
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

/* 🔠 Formatear estado */
function formatearEstado(estado) {
  return estado.replace("_", " ").replace(/^\w/, c => c.toUpperCase());
}

/* 🔁 Obtener valor de estado seleccionado */
function getEstadoSeleccionado(id) {
  return document.querySelector(`#estado-${id}`)?.value || "pendiente";
}

/* 🔄 Actualizar estado en backend */
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

    const result = await res.json();

    if (res.ok) {
      alert("✅ Estado actualizado correctamente.");
      cargarPedidos();
    } else {
      alert("❌ " + (result.message || "Error al actualizar"));
    }
  } catch (err) {
    console.error("❌", err);
    alert("❌ No se pudo conectar con el servidor.");
  } finally {
    if (boton) {
      boton.disabled = false;
      boton.textContent = "🔄 Actualizar";
    }
  }
}

/* 🛠️ Iconos visuales para estados */
function estadoIcono(estado) {
  const iconos = {
    pendiente: "⏳",
    en_proceso: "⚙️",
    enviado: "📦",
    cancelado: "❌"
  };
  return iconos[estado] || "📋";
}

/* 🔍 Filtro de estado */
function filtrarPedidos() {
  const filtro = document.getElementById("filtroEstado")?.value || "todos";
  const filtrados = filtro === "todos"
    ? todosLosPedidos
    : todosLosPedidos.filter(p => (p.estado || "pendiente") === filtro);
  renderPedidos(filtrados);
}

/* 📤 Exportar pedidos */
function exportarPedidos() {
  const contenido = todosLosPedidos.map(p => {
    const items = (p.items || []).map(i =>
      `- ${i.nombre || "Producto"} x${i.cantidad} ($${i.precio})`
    ).join("\n");

    return `Cliente: ${p.nombreCliente || "Desconocido"}
Total: $${p.total}
Estado: ${formatearEstado(p.estado || "pendiente")}
Fecha: ${new Date(p.createdAt).toLocaleString()}
Nota: ${p.nota || "—"}
Items:\n${items}
==============================`;
  }).join("\n\n");

  const blob = new Blob([contenido], { type: "text/plain" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `pedidos_km-ezropa_${Date.now()}.txt`;
  link.click();
}

/* 🔔 Monitorear nuevos pedidos */
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

/* ⬅️ Volver al panel */
function regresarAlPanel() {
  window.location.href = "panel.html";
}
