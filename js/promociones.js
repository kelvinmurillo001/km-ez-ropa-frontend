"use strict";

import { verificarSesion, goBack, mostrarMensaje } from "./admin-utils.js";
import { API_BASE } from "./config.js";

const token = verificarSesion();

// 🔄 CORREGIDA: Ruta correcta al backend
const API_PROMOS = `${API_BASE}/api/promos`;

const formPromo = document.getElementById("formPromo");
const msgPromo = document.getElementById("msgPromo");

document.addEventListener("DOMContentLoaded", () => {
  cargarPromocion();
  formPromo?.addEventListener("submit", guardarPromocion);
});

/**
 * ✅ Cargar promoción activa actual
 */
async function cargarPromocion() {
  try {
    const res = await fetch(API_PROMOS);
    const promo = await res.json();

    if (!promo) {
      document.getElementById("estadoActual").innerHTML = "<p>📭 No hay promociones activas.</p>";
      return;
    }

    const estadoColor = promo.active ? "green" : "red";
    const estadoTexto = promo.active ? "✅ Activa" : "⛔ Inactiva";
    const inicio = promo.startDate ? new Date(promo.startDate).toLocaleDateString() : "No definido";
    const fin = promo.endDate ? new Date(promo.endDate).toLocaleDateString() : "Sin fecha";
    const badgeTheme = promo.theme || "blue";

    document.getElementById("estadoActual").innerHTML = `
      <div class="promo-actual">
        <p><strong>Estado:</strong> <span style="color:${estadoColor}">${estadoTexto}</span></p>
        <p><strong>Mensaje:</strong> ${promo.message}</p>
        <p><strong>Vigencia:</strong> ${inicio} - ${fin}</p>
        <p><strong>Tema:</strong> <span class="badge ${badgeTheme}">${badgeTheme}</span></p>
      </div>
    `;

    // Rellenar formulario
    document.getElementById("promoMensaje").value = promo.message || "";
    document.getElementById("promoActivo").checked = promo.active || false;
    document.getElementById("promoTema").value = promo.theme || "blue";
    document.getElementById("promoInicio").value = promo.startDate?.substring(0, 10) || "";
    document.getElementById("promoFin").value = promo.endDate?.substring(0, 10) || "";

  } catch (err) {
    console.error("❌ Error cargando promoción:", err);
    document.getElementById("estadoActual").innerHTML = "<p style='color:red;'>❌ Error al cargar promoción.</p>";
  }
}

/**
 * 📝 Crear o actualizar promoción
 */
async function guardarPromocion(e) {
  e.preventDefault();
  msgPromo.textContent = "";
  const btn = formPromo.querySelector("button[type='submit']");
  btn.disabled = true;

  const payload = {
    message: document.getElementById("promoMensaje").value.trim(),
    active: document.getElementById("promoActivo").checked,
    theme: document.getElementById("promoTema").value,
    startDate: document.getElementById("promoInicio").value || null,
    endDate: document.getElementById("promoFin").value || null
  };

  if (!payload.message || payload.message.length < 3) {
    msgPromo.textContent = "⚠️ El mensaje debe tener al menos 3 caracteres.";
    msgPromo.style.color = "orange";
    btn.disabled = false;
    return;
  }

  try {
    msgPromo.textContent = "⏳ Guardando promoción...";
    msgPromo.style.color = "#888";

    const res = await fetch(API_PROMOS, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Error");

    msgPromo.textContent = "✅ Promoción guardada correctamente.";
    msgPromo.style.color = "limegreen";

    await cargarPromocion();
  } catch (err) {
    console.error("❌", err);
    msgPromo.textContent = "❌ No se pudo guardar la promoción.";
    msgPromo.style.color = "red";
  } finally {
    btn.disabled = false;
  }
}

window.goBack = goBack;
