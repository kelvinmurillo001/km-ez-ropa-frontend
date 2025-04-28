"use strict";

// ✅ Configuración base
import { API_BASE } from "./config.js";

// 🔎 Elementos del DOM
const codigoInput = document.getElementById("codigoSeguimiento");
const btnBuscar = document.getElementById("btnBuscar");
const barraProgreso = document.getElementById("barraProgreso");
const resumenPedido = document.getElementById("resumenPedido");
const mensajeEstado = document.getElementById("mensajeEstado");

// 📡 URL API
const API_TRACK = `${API_BASE}/api/orders/track`;

// ▶️ Evento inicial
document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const codigo = params.get("codigo");
  if (codigo) {
    codigoInput.value = codigo;
    buscarPedido(codigo);
  }
});

// 🔍 Buscar pedido al hacer click
btnBuscar?.addEventListener("click", () => {
  const codigo = codigoInput.value.trim();
  if (!codigo) return mostrarMensaje("⚠️ Debes ingresar un código de pedido.", "warn");
  buscarPedido(codigo);
});

// 📦 Función buscar pedido
async function buscarPedido(codigo) {
  mostrarMensaje("⏳ Buscando pedido...", "info");
  try {
    const res = await fetch(`${API_TRACK}/${codigo}`);
    const data = await res.json();

    if (!res.ok) throw new Error(data.message || "Error desconocido");

    mostrarProgreso(data.estadoActual);
    mostrarResumen(data.resumen);
    mostrarMensaje("✅ Pedido encontrado.", "success");

  } catch (err) {
    console.error("❌", err);
    barraProgreso.hidden = true;
    resumenPedido.hidden = true;
    mostrarMensaje(err.message || "❌ No se pudo buscar el pedido.", "error");
  }
}

// 🚚 Mostrar progreso de envío
function mostrarProgreso(estado) {
  barraProgreso.hidden = false;
  document.querySelectorAll(".paso").forEach(p => p.classList.remove("active"));

  switch (estado?.toLowerCase()) {
    case "pendiente":
    case "recibido":
      activarPaso("paso-recibido");
      break;
    case "preparando":
      activarPaso("paso-recibido");
      activarPaso("paso-preparando");
      break;
    case "en camino":
    case "enviado":
      activarPaso("paso-recibido");
      activarPaso("paso-preparando");
      activarPaso("paso-en-camino");
      break;
    case "entregado":
      activarPaso("paso-recibido");
      activarPaso("paso-preparando");
      activarPaso("paso-en-camino");
      activarPaso("paso-entregado");
      break;
    default:
      activarPaso("paso-recibido");
  }
}

// ⭐ Activar un paso en progreso
function activarPaso(id) {
  document.getElementById(id)?.classList.add("active");
}

// 🧾 Mostrar resumen de pedido
function mostrarResumen(resumen = {}) {
  resumenPedido.hidden = false;
  document.getElementById("nombreCliente").textContent = resumen.nombre || "-";
  document.getElementById("direccionCliente").textContent = resumen.direccion || "-";
  document.getElementById("metodoPago").textContent = resumen.metodoPago || "-";
  document.getElementById("totalPedido").textContent = `$${(resumen.total || 0).toFixed(2)}`;
}

// 💬 Mostrar mensajes de estado
function mostrarMensaje(texto, tipo = "info") {
  mensajeEstado.textContent = texto;
  mensajeEstado.style.color =
    tipo === "success" ? "limegreen" :
    tipo === "error" ? "tomato" :
    tipo === "warn" ? "orange" :
    "#666";
}
