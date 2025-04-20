"use strict";

import { API_BASE } from "./config.js";
import { verificarSesion } from "./admin-utils.js";

const token = verificarSesion();
const API_PROMOS_ADMIN = `${API_BASE}/api/promos/admin`;
const API_PROMOS_TOGGLE = id => `${API_BASE}/api/promos/${id}/estado`;
const API_PROMOS_DELETE = id => `${API_BASE}/api/promos/${id}`;

document.addEventListener("DOMContentLoaded", () => {
  cargarTodasPromos();
});

async function cargarTodasPromos() {
  try {
    const res = await fetch(API_PROMOS_ADMIN, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const promos = await res.json();
    renderPromos(promos);
  } catch (error) {
    console.error("❌ Error al cargar promociones:", error);
    document.getElementById("promo-container").innerHTML = "<p style='color:red;'>❌ Error al cargar promociones.</p>";
  }
}

function renderPromos(promos) {
  const container = document.getElementById("promo-container");
  container.innerHTML = "";

  if (!Array.isArray(promos) || promos.length === 0) {
    container.innerHTML = "<p>📭 No hay promociones creadas.</p>";
    return;
  }

  promos.sort((a, b) => new Date(a.startDate || a.createdAt) - new Date(b.startDate || b.createdAt));

  promos.forEach(promo => {
    const card = document.createElement("div");
    card.className = `promo-card ${getPromoEstadoClass(promo)}`;

    card.innerHTML = `
      <div class="promo-header">
        <span class="badge ${promo.active ? 'active' : 'inactive'}">${promo.active ? '✅ Activa' : '⛔ Inactiva'}</span>
        <span class="position">📌 ${promo.position}</span>
        <span class="theme">🎨 ${promo.theme}</span>
      </div>

      <p class="promo-message">${promo.message}</p>
      <p><strong>Vigencia:</strong> ${formatearFecha(promo.startDate)} - ${formatearFecha(promo.endDate)}</p>

      <p><strong>Páginas:</strong> ${promo.pages?.map(p => `<span class="chip">${p}</span>`).join(" ") || "N/A"}</p>

      ${renderMedia(promo)}

      <div class="promo-actions">
        <button class="btn-secundario" onclick="togglePromo('${promo._id}', this)">
          ${promo.active ? '⛔ Desactivar' : '✅ Activar'}
        </button>
        <button class="btn" onclick="alert('Editar promo ${promo._id} aún no implementado')">✏️ Editar</button>
        <button class="btn-borrar" onclick="eliminarPromo('${promo._id}', this)">🗑️ Eliminar</button>
      </div>
    `;

    container.appendChild(card);
  });
}

function formatearFecha(fecha) {
  return fecha ? new Date(fecha).toLocaleDateString() : "–";
}

function getPromoEstadoClass(promo) {
  const now = new Date();
  const start = promo.startDate ? new Date(promo.startDate) : null;
  const end = promo.endDate ? new Date(promo.endDate) : null;

  if (!promo.active) return "promo-inactiva";
  if (end && end < now) return "promo-expirada";
  if (start && start > now) return "promo-futura";
  return "promo-activa";
}

function renderMedia(promo) {
  if (promo.mediaType === "image" && promo.mediaUrl) {
    return `<div class="preview"><img src="${promo.mediaUrl}" alt="Imagen promo" /></div>`;
  }
  if (promo.mediaType === "video" && promo.mediaUrl) {
    return `<div class="preview"><video src="${promo.mediaUrl}" controls></video></div>`;
  }
  return "";
}

window.togglePromo = async (id, btn) => {
  try {
    btn.disabled = true;
    const res = await fetch(API_PROMOS_TOGGLE(id), {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error("❌ Error al cambiar estado");
    await cargarTodasPromos();
  } catch (err) {
    console.error(err);
    alert("❌ No se pudo cambiar el estado de la promoción.");
  } finally {
    btn.disabled = false;
  }
};

window.eliminarPromo = async (id, btn) => {
  if (!confirm("🗑️ ¿Estás seguro de eliminar esta promoción?")) return;
  try {
    btn.disabled = true;
    const res = await fetch(API_PROMOS_DELETE(id), {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error("❌ Error al eliminar");
    await cargarTodasPromos();
  } catch (err) {
    console.error(err);
    alert("❌ No se pudo eliminar la promoción.");
  } finally {
    btn.disabled = false;
  }
};
