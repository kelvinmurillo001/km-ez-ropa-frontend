const API_ORDERS = "https://km-ez-ropa-backend.onrender.com/api/orders";
const container = document.getElementById("pedidos-container");
let pedidosPrevios = 0;
let todosLosPedidos = [];

// ✅ Verifica el token antes de acceder
function verificarToken() {
  const token = localStorage.getItem("token");
  if (!token) {
    alert("⚠️ No autorizado. Inicia sesión primero.");
    window.location.href = "login.html";
  }
}

// 🔐 Verificación adicional (por seguridad)
const token = localStorage.getItem("token");
if (!token) {
  alert("⚠️ Acceso denegado. Inicia sesión.");
  window.location.href = "login.html";
}

// ▶️ Cargar todos los pedidos
async function cargarPedidos() {
  if (!container) return;
  container.innerHTML = "⏳ Cargando pedidos...";

  try {
    const res = await fetch(API_ORDERS, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = await res.json();

    if (!res.ok || !Array.isArray(data)) {
      throw new Error("Respuesta inválida del servidor");
    }

    todosLosPedidos = data;
    renderPedidos(todosLosPedidos);
    pedidosPrevios = todosLosPedidos.length;

  } catch (err) {
    console.error("❌ Error al cargar pedidos:", err);
    container.innerHTML = "❌ Error al cargar pedidos.";
  }
}

// 🧾 Renderizar pedidos
function renderPedidos(pedidos) {
  container.innerHTML = "";

  if (!pedidos.length) {
    container.innerHTML = "<p>No hay pedidos en este estado.</p>";
    return;
  }

  pedidos.forEach(p => {
    const card = document.createElement("div");
    card.className = `pedido-card fade-in`;

    const itemsHTML = p.items.map(i =>
      `<li>${i.nombre} (x${i.cantidad}) - $${i.precio}</li>`
    ).join("");

    card.innerHTML = `
      <h3>📌 ${p.nombreCliente || "Sin nombre"}</h3>
      <p><strong>Total:</strong> $${p.total}</p>
      <ul>${itemsHTML}</ul>
      <p><strong>Nota:</strong> ${p.nota || '—'}</p>
      <p class="fecha">📅 ${new Date(p.createdAt).toLocaleString()}</p>

      <label class="estado-label">Estado:</label>
      <select class="estado-select estado-${p.estado}" onchange="actualizarEstado('${p._id}', this.value)" data-id="${p._id}">
        <option value="pendiente" ${p.estado === "pendiente" ? "selected" : ""}>⏳ Pendiente</option>
        <option value="en_proceso" ${p.estado === "en_proceso" ? "selected" : ""}>⚙️ En Proceso</option>
        <option value="enviado" ${p.estado === "enviado" ? "selected" : ""}>📦 Enviado</option>
        <option value="cancelado" ${p.estado === "cancelado" ? "selected" : ""}>❌ Cancelado</option>
      </select>

      <button onclick="actualizarEstado('${p._id}', document.querySelector('[data-id=\\'${p._id}\\']').value)">
        🔄 Actualizar
      </button>
    `;

    container.appendChild(card);
  });
}

// 🔄 Cambiar estado del pedido
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

    if (res.ok) {
      alert("✅ Estado actualizado");
      cargarPedidos();
    } else {
      const err = await res.json();
      alert("❌ Error: " + (err.message || "No se pudo actualizar"));
    }
  } catch (err) {
    console.error("❌ Error al actualizar estado:", err);
  }
}

// 🔍 Filtro por estado
function filtrarPedidos() {
  const filtro = document.getElementById("filtroEstado").value;
  const filtrados = filtro === "todos"
    ? todosLosPedidos
    : todosLosPedidos.filter(p => p.estado === filtro);
  renderPedidos(filtrados);
}

// 🧾 Exportar pedidos
function exportarPedidos() {
  const contenido = todosLosPedidos.map(p => {
    const items = p.items.map(i => `- ${i.nombre} x${i.cantidad}`).join("\n");
    return `
Cliente: ${p.nombreCliente}
Total: $${p.total}
Estado: ${p.estado}
Fecha: ${new Date(p.createdAt).toLocaleString()}
Items:
${items}
==============================
`;
  }).join("\n");

  const blob = new Blob([contenido], { type: "text/plain" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "pedidos_km_ez_ropa.txt";
  link.click();
}

// 🔔 Alerta de nuevos pedidos cada 10s
setInterval(async () => {
  try {
    const res = await fetch(API_ORDERS, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const nuevos = await res.json();
    if (Array.isArray(nuevos) && nuevos.length > pedidosPrevios) {
      const audio = new Audio("https://notificationsounds.com/storage/sounds/file-sounds-1152-pristine.mp3");
      audio.play();
    }
    pedidosPrevios = nuevos.length;

  } catch (err) {
    console.warn("❌ Error monitoreando nuevos pedidos");
  }
}, 10000);

// 🔙 Regresar al panel
function regresarAlPanel() {
  window.location.href = "panel.html";
}

// ▶️ Inicial
cargarPedidos();
