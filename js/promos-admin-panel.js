"use strict";

import { API_BASE } from "./config.js";
import { verificarSesion } from "./admin-utils.js";
import { abrirModal, cerrarModal } from "./modal.js";

const token = verificarSesion();
const API_PROMOS_ADMIN = `${API_BASE}/api/promos/admin`;
const API_PROMOS_TOGGLE = id => `${API_BASE}/api/promos/${id}/estado`;
const API_PROMOS_DELETE = id => `${API_BASE}/api/promos/${id}`;
const API_PROMOS_GET = id => `${API_BASE}/api/promos/${id}`;

// DOM
const inputBuscar = document.getElementById("buscarPromo");
const filtroEstado = document.getElementById("filtroEstado");
const container = document.getElementById("promo-container");

document.addEventListener("DOMContentLoaded", () => {
  cargarTodasPromos();
  inputBuscar?.addEventListener("input", cargarTodasPromos);
  filtroEstado?.addEventListener("change", cargarTodasPromos);
});

/**
 * 🔄 Cargar promociones con filtros
 */
async function cargarTodasPromos() {
  container.innerHTML = "<p class='text-center'>⏳ Cargando promociones...</p>";

  try {
    const nombre = inputBuscar?.value.trim().toLowerCase() || "";
    const estado = filtroEstado?.value || "";

    const params = new URLSearchParams();
    if (nombre) params.append("nombre", nombre);
    if (estado) params.append("estado", estado);

    const res = await fetch(`${API_PROMOS_ADMIN}?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const promos = await res.json();
    if (!res.ok || !Array.isArray(promos)) throw new Error(promos.message || "Error al obtener promociones");

    renderPromos(promos);
  } catch (error) {
    console.error("❌", error);
    container.innerHTML = "<p class='text-danger'>❌ No se pudo cargar las promociones.</p>";
  }
}

/**
 * 🎨 Renderizar tarjetas de promociones
 */
function renderPromos(promos = []) {
  container.innerHTML = "";

  if (!promos.length) {
    container.innerHTML = "<p>📭 No hay promociones encontradas.</p>";
    return;
  }

  promos.sort((a, b) => new Date(b.startDate || b.createdAt) - new Date(a.startDate || a.createdAt));

  promos.forEach(promo => {
    const card = document.createElement("div");
    card.className = `promo-card ${getPromoEstadoClass(promo)}`;
    card.setAttribute("role", "article");
    card.setAttribute("aria-label", `Promoción ${sanitize(promo.message || "sin mensaje")}`);

    card.innerHTML = `
      <div class="promo-header">
        <span class="badge ${promo.active ? 'active' : 'inactive'}">${promo.active ? '✅ Activa' : '⛔ Inactiva'}</span>
        <span class="position">📌 ${sanitize(promo.position)}</span>
        <span class="theme">🎨 ${sanitize(promo.theme)}</span>
      </div>

      <p class="promo-message">${sanitize(promo.message)}</p>
      <p><strong>Vigencia:</strong> ${formatearFecha(promo.startDate)} - ${formatearFecha(promo.endDate)}</p>
      <p><strong>Páginas:</strong> ${promo.pages?.map(p => `<span class="chip">${sanitize(p)}</span>`).join(" ") || "N/A"}</p>

      ${renderMedia(promo)}

      <div class="promo-actions">
        <button class="btn-secundario" onclick="togglePromo('${promo._id}', this)">
          ${promo.active ? '⛔ Desactivar' : '✅ Activar'}
        </button>
        <button class="btn" onclick="editarPromo('${promo._id}')">✏️ Editar</button>
        <button class="btn-borrar" onclick="confirmarEliminarPromo('${promo._id}')">🗑️ Eliminar</button>
      </div>
    `;

    container.appendChild(card);
  });
}

/**
 * 📅 Formato de fecha
 */
function formatearFecha(fecha) {
  return fecha ? new Date(fecha).toLocaleDateString("es-EC") : "–";
}

/**
 * 🎨 Clase CSS de estado de promoción
 */
function getPromoEstadoClass(promo) {
  const now = new Date();
  const start = promo.startDate ? new Date(promo.startDate) : null;
  const end = promo.endDate ? new Date(promo.endDate) : null;

  if (!promo.active) return "promo-inactiva";
  if (end && end < now) return "promo-expirada";
  if (start && start > now) return "promo-futura";
  return "promo-activa";
}

/**
 * 📷 Renderizar multimedia de la promoción
 */
function renderMedia(promo) {
  if (promo.mediaType === "image" && promo.mediaUrl) {
    return `<div class="preview"><img src="${promo.mediaUrl}" alt="Imagen promocional" loading="lazy" /></div>`;
  }
  if (promo.mediaType === "video" && promo.mediaUrl) {
    return `<div class="preview"><video src="${promo.mediaUrl}" controls></video></div>`;
  }
  return "";
}

/**
 * 🔁 Cambiar estado de una promoción
 */
window.togglePromo = async (id, btn) => {
  if (!id || !btn) return;
  btn.disabled = true;

  try {
    const res = await fetch(API_PROMOS_TOGGLE(id), {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) throw new Error("❌ Error al cambiar estado");

    await cargarTodasPromos();
  } catch (err) {
    console.error(err);
    abrirModal("⚠️ Estado no actualizado", "No se pudo cambiar el estado de la promoción.");
  } finally {
    btn.disabled = false;
  }
};

/**
 * 🗑️ Confirmar y eliminar promoción
 */
window.confirmarEliminarPromo = (id) => {
  abrirModal("🗑️ Eliminar Promoción", `
    <p>¿Estás seguro de eliminar esta promoción?</p>
    <div class="mt-2 flex gap-1">
      <button class="btn" onclick="eliminarPromo('${id}')">✅ Sí, eliminar</button>
      <button class="btn-secundario" onclick="cerrarModal()">❌ Cancelar</button>
    </div>
  `);
};

/**
 * ❌ Eliminar promoción
 */
window.eliminarPromo = async (id) => {
  try {
    const res = await fetch(API_PROMOS_DELETE(id), {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) throw new Error("❌ Error al eliminar");
    cerrarModal();
    await cargarTodasPromos();
  } catch (err) {
    console.error(err);
    cerrarModal();
    abrirModal("Error", "❌ No se pudo eliminar la promoción.");
  }
};

/**
 * ✏️ Editar una promoción
 */
window.editarPromo = async (id) => {
  try {
    const res = await fetch(API_PROMOS_GET(id), {
      headers: { Authorization: `Bearer ${token}` }
    });

    const promo = await res.json();
    if (!res.ok || !promo?._id) throw new Error("❌ Error al obtener los datos");

    document.getElementById("promoId").value = promo._id;
    document.getElementById("promoMensaje").value = promo.message || "";
    document.getElementById("promoTema").value = promo.theme || "blue";
    document.getElementById("promoPosition").value = promo.position || "top";
    document.getElementById("promoTipo").value = promo.mediaType || "texto";
    document.getElementById("promoInicio").value = promo.startDate?.substring(0, 10) || "";
    document.getElementById("promoFin").value = promo.endDate?.substring(0, 10) || "";
    document.getElementById("promoActivo").checked = !!promo.active;

    document.querySelectorAll("input[name='promoPages']").forEach(cb => cb.checked = false);
    promo.pages?.forEach(p => {
      const cb = document.querySelector(`input[name='promoPages'][value='${p}']`);
      if (cb) cb.checked = true;
    });

    const mediaContainer = document.getElementById("mediaUploadContainer");
    mediaContainer.innerHTML = "";

    if (promo.mediaType === "image") {
      mediaContainer.innerHTML = `
        <label for="promoImagen">Imagen nueva:</label>
        <input type="file" id="promoImagen" accept="image/*" />
        <p class="preview-mini">Actual: <img src="${promo.mediaUrl}" style="max-width:120px;" /></p>
      `;
    } else if (promo.mediaType === "video") {
      mediaContainer.innerHTML = `
        <label for="promoVideo">URL del video:</label>
        <input type="url" id="promoVideo" value="${promo.mediaUrl || ""}" />
      `;
    }

    document.getElementById("formPromo")?.scrollIntoView({ behavior: "smooth" });
  } catch (err) {
    console.error("❌", err);
    abrirModal("⚠️ Error", "No se pudo cargar la promoción para edición.");
  }
};

/**
 * 🛡️ Prevenir inyecciones: sanitizar texto
 */
function sanitize(text = "") {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}
