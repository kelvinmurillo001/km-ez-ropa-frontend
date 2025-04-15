"use strict";

import { verificarSesion, goBack } from "./admin-utils.js";

const token = verificarSesion();
const API_PROMO = "https://km-ez-ropa-backend.onrender.com/api/promos";

document.addEventListener("DOMContentLoaded", () => {
  cargarPromocion();
  document.getElementById("formPromo").addEventListener("submit", guardarPromocion);
});

async function cargarPromocion() {
  try {
    const res = await fetch(API_PROMO, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) throw new Error("No se pudo obtener la promo");
    const data = await res.json();

    document.getElementById("mensaje").value = data.message || "";
    document.getElementById("fechaInicio").value = data.startDate || "";
    document.getElementById("fechaFin").value = data.endDate || "";
    document.getElementById("tema").value = data.theme || "blue";
    document.getElementById("activa").checked = data.active;

    renderPreview(data);
  } catch (err) {
    mostrarMensaje("❌ No se pudo cargar la promoción actual", "error");
  }
}

async function guardarPromocion(e) {
  e.preventDefault();

  const payload = {
    message: document.getElementById("mensaje").value.trim(),
    startDate: document.getElementById("fechaInicio").value,
    endDate: document.getElementById("fechaFin").value,
    theme: document.getElementById("tema").value,
    active: document.getElementById("activa").checked
  };

  try {
    const res = await fetch(API_PROMO, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) throw new Error("Error al guardar");
    const data = await res.json();

    mostrarMensaje("✅ Promoción guardada con éxito", "success");
    renderPreview(data);
  } catch (err) {
    mostrarMensaje("❌ Error al guardar la promoción", "error");
  }
}

function renderPreview(data) {
  const preview = document.getElementById("previewBanner");
  preview.className = `promo-preview fade-in ${data.theme || "blue"}`;
  preview.textContent = data.message;
  preview.classList.remove("oculto");
}

function mostrarMensaje(texto, tipo = "info") {
  const mensaje = document.getElementById("mensajeFinal");
  mensaje.textContent = texto;
  mensaje.className = tipo === "success" ? "admin-message success" : "admin-message error";
  mensaje.classList.remove("oculto");
}

// Exportar para HTML
window.goBack = goBack;
