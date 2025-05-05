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

// ▶️ Evento inicial con parámetro GET ?codigo=
document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const codigo = params.get("codigo");

  if (codigo) {
    codigoInput.value = codigo.trim().toUpperCase();
    buscarPedido(codigo.trim());
  }
});

// 🔍 Buscar pedido al hacer click
btnBuscar?.addEventListener("click", () => {
  const codigo = codigoInput.value.trim().toUpperCase();
  if (!codigo || codigo.length < 3) {
    return mostrarMensaje("⚠️ Ingresa un código válido.", "warn");
  }
  buscarPedido(codigo);
});

// 📦 Buscar pedido desde backend
async function buscarPedido(codigo) {
  mostrarMensaje("⏳ Buscando pedido...", "info");

  try {
    const res = await fetch(`${API_TRACK}/${encodeURIComponent(codigo)}`);
    const data = await res.json();

    if (!res.ok) throw new Error(data.message || "❌ Pedido no encontrado");

    mostrarProgreso(data.estadoActual);
    mostrarResumen(data.resumen);
    mostrarMensaje("✅ Pedido encontrado", "success");

  } catch (err) {
    console.error("❌", err.message);
    barraProgreso.hidden = true;
    resumenPedido.hidden = true;
    mostrarMensaje(err.message || "❌ Error al buscar pedido", "error");
  }
}

// 🚚 Visualizar progreso de pedido
function mostrarProgreso(estado = "") {
  barraProgreso.hidden = false;
  document.querySelectorAll(".paso").forEach(p => p.classList.remove("active"));

  const estados = {
    pendiente: ["paso-recibido"],
    recibido: ["paso-recibido"],
    preparando: ["paso-recibido", "paso-preparando"],
    "en proceso": ["paso-recibido", "paso-preparando"],
    enviado: ["paso-recibido", "paso-preparando", "paso-en-camino"],
    "en camino": ["paso-recibido", "paso-preparando", "paso-en-camino"],
    entregado: ["paso-recibido", "paso-preparando", "paso-en-camino", "paso-entregado"],
    cancelado: ["paso-recibido"] // puedes crear visualmente un paso-cancelado si quieres
  };

  const pasosActivos = estados[estado.toLowerCase()] || ["paso-recibido"];
  pasosActivos.forEach(activarPaso);
}

// ⭐ Activar un paso visualmente
function activarPaso(id) {
  document.getElementById(id)?.classList.add("active");
}

// 🧾 Mostrar datos resumen del pedido
function mostrarResumen(resumen = {}) {
  resumenPedido.hidden = false;
  document.getElementById("nombreCliente").textContent = resumen.nombre || "-";
  document.getElementById("direccionCliente").textContent = resumen.direccion || "-";
  document.getElementById("metodoPago").textContent = resumen.metodoPago || "-";
  document.getElementById("totalPedido").textContent = `$${parseFloat(resumen.total || 0).toFixed(2)}`;
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
