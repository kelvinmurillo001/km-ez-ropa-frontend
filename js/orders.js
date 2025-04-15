"use strict";

import { verificarSesion, goBack } from "./admin-utils.js";

const token = verificarSesion();
const API_ORDERS = "https://km-ez-ropa-backend.onrender.com/api/orders";
let pedidos = [];

document.addEventListener("DOMContentLoaded", async () => {
  await cargarPedidos();
});

async function cargarPedidos() {
  try {
    const res = await fetch(API_ORDERS, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) throw new Error("Error al cargar pedidos");
    pedidos = await res.json();

    mostrarPedidos(pedidos);
  } catch (err) {
    document.getElementById("pedidosLista").innerHTML =
      "<p>Error al cargar los pedidos.</p>";
    console.error(err);
  }
}

function mostrarPedidos(lista) {
  const contenedor = document.getElementById("pedidosLista");
  contenedor.innerHTML = "";

  if (!lista.length) {
    contenedor.innerHTML = "<p>No hay pedidos registrados.</p>";
    return;
  }

  lista.forEach(pedido => {
    const card = document.createElement("div");
    card.className = "pedido-card fade-in";
    card.innerHTML = `
      <h3>📄 Pedido de ${pedido.nombreCliente}</h3>
      <p class="fecha">🗓️ ${new Date(pedido.createdAt).toLocaleString()}</p>
      <ul>
        ${pedido.items.map(item => `
          <li>
            ${item.nombre} x${item.cantidad} 
            ${item.talla ? `| Talla: ${item.talla}` : ""} 
            ${item.color ? `| Color: ${item.color}` : ""}
          </li>`).join("")}
      </ul>
      <p><strong>Total:</strong> $${pedido.total}</p>
      <p><strong>Nota:</strong> ${pedido.nota || "(sin nota)"}</p>

      <span class="badge-estado badge-${pedido.estado}">${estadoLabel(pedido.estado)}</span>

      <select class="estado-select" onchange="cambiarEstado('${pedido._id}', this.value)">
        <option value="">📝 Cambiar estado...</option>
        <option value="pendiente">🕒 Pendiente</option>
        <option value="en_proceso">🔧 En Proceso</option>
        <option value="enviado">🚚 Enviado</option>
        <option value="cancelado">❌ Cancelado</option>
      </select>
    `;

    contenedor.appendChild(card);
  });
}

function estadoLabel(estado) {
  switch (estado) {
    case "pendiente": return "Pendiente";
    case "en_proceso": return "En Proceso";
    case "enviado": return "Enviado";
    case "cancelado": return "Cancelado";
    default: return "Sin estado";
  }
}

async function cambiarEstado(id, nuevoEstado) {
  if (!nuevoEstado) return;

  const res = await fetch(`${API_ORDERS}/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ estado: nuevoEstado })
  });

  if (!res.ok) return alert("❌ No se pudo actualizar el estado.");
  await cargarPedidos();
}

function filtrarPedidos(estado) {
  if (estado === "todos") return mostrarPedidos(pedidos);
  const filtrados = pedidos.filter(p => p.estado === estado);
  mostrarPedidos(filtrados);
}

window.goBack = goBack;
window.cambiarEstado = cambiarEstado;
window.filtrarPedidos = filtrarPedidos;
