"use strict";

import { API_BASE } from "./config.js";

// 🧩 DOM Elements
const codigoInput = document.getElementById("codigoSeguimiento");
const btnBuscar = document.getElementById("btnBuscar");
const barraProgreso = document.getElementById("barraProgreso");
const resumenPedido = document.getElementById("resumenPedido");
const mensajeEstado = document.getElementById("mensajeEstado");

const API_TRACK = `${API_BASE}/api/orders/track`;
let procesando = false;

document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const codigo = params.get("codigo");
  if (codigo) {
    codigoInput.value = codigo.trim().toUpperCase();
    buscarPedido(codigo.trim());
  }
});

btnBuscar?.addEventListener("click", () => {
  const codigo = codigoInput.value.trim().toUpperCase();
  if (!codigo || !/^[A-Z0-9\-]{3,30}$/.test(codigo)) {
    return mostrarMensaje("⚠️ Código inválido. Usa letras, números o guiones.", "warn");
  }
  if (procesando) return;
  buscarPedido(codigo);
});

/**
 * 🔍 Busca el pedido por código
 */
async function buscarPedido(codigo) {
  procesando = true;
  mostrarMensaje("⏳ Buscando pedido...", "info");

  try {
    const res = await fetch(`${API_TRACK}/${encodeURIComponent(codigo)}`);
    const data = await res.json();

    if (!res.ok || !data || !data.estadoActual) {
      throw new Error(data?.message || "❌ Pedido no encontrado.");
    }

    mostrarProgreso(data.estadoActual);
    mostrarResumen(data.resumen);
    mostrarMensaje("✅ Pedido encontrado y cargado.", "success");

  } catch (err) {
    console.error("❌ Error al buscar pedido:", err);
    barraProgreso.hidden = true;
    resumenPedido.hidden = true;
    mostrarMensaje(err.message || "❌ Error inesperado al buscar.", "error");
  } finally {
    procesando = false;
  }
}

/**
 * 📈 Activa los pasos de progreso del pedido
 */
function mostrarProgreso(estado = "") {
  barraProgreso.hidden = false;
  document.querySelectorAll(".paso").forEach(p => p.classList.remove("active"));

  const pasos = {
    pendiente: ["paso-recibido"],
    recibido: ["paso-recibido"],
    preparando: ["paso-recibido", "paso-preparando"],
    "en proceso": ["paso-recibido", "paso-preparando"],
    enviado: ["paso-recibido", "paso-preparando", "paso-en-camino"],
    "en camino": ["paso-recibido", "paso-preparando", "paso-en-camino"],
    entregado: ["paso-recibido", "paso-preparando", "paso-en-camino", "paso-entregado"],
    cancelado: ["paso-recibido"]
  };

  const activos = pasos[estado.toLowerCase()] || ["paso-recibido"];
  activos.forEach(id => {
    document.getElementById(id)?.classList.add("active");
  });
}

/**
 * 🧾 Muestra la información del resumen del pedido
 */
function mostrarResumen(resumen = {}) {
  resumenPedido.hidden = false;
  document.getElementById("nombreCliente").textContent = sanitize(resumen.nombre || "-");
  document.getElementById("direccionCliente").textContent = sanitize(resumen.direccion || "-");
  document.getElementById("metodoPago").textContent = sanitize(resumen.metodoPago || "-");
  document.getElementById("totalPedido").textContent = `$${parseFloat(resumen.total || 0).toFixed(2)}`;
}

/**
 * 🔔 Muestra un mensaje con estilo y color según tipo
 */
function mostrarMensaje(texto, tipo = "info") {
  mensajeEstado.textContent = texto;
  mensajeEstado.style.color = {
    success: "limegreen",
    error: "tomato",
    warn: "orange",
    info: "#666"
  }[tipo] || "#666";
  mensajeEstado.setAttribute("role", "alert");
  mensajeEstado.setAttribute("aria-live", "assertive");
}

/**
 * 🧼 Limpieza de texto para evitar XSS
 */
function sanitize(text = "") {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}
