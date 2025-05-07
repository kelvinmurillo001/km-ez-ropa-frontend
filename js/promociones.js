"use strict";

import { verificarSesion, goBack, mostrarMensaje } from "./admin-utils.js";
import { API_BASE } from "./config.js";

// 🔐 Verificación de sesión
const token = verificarSesion();

// 🌐 Endpoints
const API_PROMOS = `${API_BASE}/api/promos`;
const API_UPLOAD = `${API_BASE}/api/uploads`;

// 📌 Elementos DOM
const formPromo = document.getElementById("formPromo");
const msgPromo = document.getElementById("msgPromo");
const estadoActual = document.getElementById("estadoActual");
const contenedorListaPromos = document.getElementById("promo-container");

let promocionId = null;

// 🚀 Inicialización
document.addEventListener("DOMContentLoaded", () => {
  cargarPromocion();
  cargarTodasPromociones();
  formPromo?.addEventListener("submit", guardarPromocion);
  document.getElementById("promoTipo")?.addEventListener("change", mostrarCampoMultimedia);
});

/* 🖼 Mostrar campos multimedia dinámicamente */
function mostrarCampoMultimedia() {
  const tipo = document.getElementById("promoTipo").value;
  const container = document.getElementById("mediaUploadContainer");
  container.innerHTML = "";

  if (tipo === "imagen") {
    container.innerHTML = `
      <label for="promoImagen">Seleccionar imagen:</label>
      <input type="file" id="promoImagen" accept="image/*" />
    `;
  } else if (tipo === "video") {
    container.innerHTML = `
      <label for="promoVideo">URL de video (YouTube o MP4):</label>
      <input type="url" id="promoVideo" placeholder="https://..." />
    `;
  }
}

/* 📦 Cargar promoción actual */
async function cargarPromocion() {
  try {
    const res = await fetch(API_PROMOS);
    const promos = await res.json();
    const promo = Array.isArray(promos.data) ? promos.data[0] : null;

    if (!promo) {
      estadoActual.innerHTML = "<p>📭 No hay promociones activas.</p>";
      return;
    }

    promocionId = promo._id;
    renderPromocionActual(promo);
    cargarFormularioDesdePromocion(promo);
  } catch (err) {
    console.error("❌ Error al cargar promoción:", err);
    estadoActual.innerHTML = "<p style='color:red;'>❌ No se pudo cargar la promoción.</p>";
  }
}

function renderPromocionActual(promo) {
  const estadoTexto = promo.active ? "✅ Activa" : "⛔ Inactiva";
  const inicio = promo.startDate ? new Date(promo.startDate).toLocaleDateString() : "No definido";
  const fin = promo.endDate ? new Date(promo.endDate).toLocaleDateString() : "Sin fecha";
  const mediaPreview = generarPreviewMedia(promo);

  estadoActual.innerHTML = `
    <div class="promo-actual">
      <p><strong>Estado:</strong> ${estadoTexto}</p>
      <p><strong>Mensaje:</strong> ${promo.message}</p>
      <p><strong>Vigencia:</strong> ${inicio} - ${fin}</p>
      <p><strong>Tema:</strong> ${promo.theme}</p>
      <p><strong>Páginas:</strong> ${promo.pages?.join(", ")}</p>
      <p><strong>Posición:</strong> ${promo.position}</p>
      <p><strong>Tipo:</strong> ${promo.mediaType ?? "texto"}</p>
      ${mediaPreview}
    </div>
  `;
}

function generarPreviewMedia(promo) {
  if (!promo.mediaUrl) return "";
  if (promo.mediaType === "image") {
    return `<img src="${promo.mediaUrl}" alt="Imagen promo" style="max-width:100%; border-radius:6px;" />`;
  }
  if (promo.mediaType === "video") {
    return `
      <video controls style="max-width:100%; border-radius:6px;">
        <source src="${promo.mediaUrl}" type="video/mp4" />
        Tu navegador no soporta video.
      </video>
    `;
  }
  return "";
}

/* ✏️ Rellenar el formulario */
function cargarFormularioDesdePromocion(promo) {
  formPromo.promoMensaje.value = promo.message ?? "";
  formPromo.promoActivo.checked = promo.active ?? false;
  formPromo.promoTema.value = promo.theme ?? "blue";
  formPromo.promoInicio.value = promo.startDate?.substring(0, 10) ?? "";
  formPromo.promoFin.value = promo.endDate?.substring(0, 10) ?? "";
  formPromo.promoTipo.value = promo.mediaType ?? "texto";
  formPromo.promoPosition.value = promo.position ?? "top";

  mostrarCampoMultimedia();
  if (promo.mediaType === "video") {
    document.getElementById("promoVideo").value = promo.mediaUrl;
  }

  document.querySelectorAll("input[name='promoPages']").forEach(cb => cb.checked = false);
  promo.pages?.forEach(p => {
    const cb = document.querySelector(`input[name='promoPages'][value='${p}']`);
    if (cb) cb.checked = true;
  });
}

/* 💾 Guardar promoción */
async function guardarPromocion(e) {
  e.preventDefault();
  msgPromo.textContent = "";
  const btn = formPromo.querySelector("button[type='submit']");
  btn.disabled = true;

  const payload = await construirPayload();
  if (!payload) {
    btn.disabled = false;
    return;
  }

  try {
    msgPromo.textContent = "⏳ Guardando...";
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
    if (!res.ok) throw new Error(data.message);

    msgPromo.textContent = "✅ Promoción guardada correctamente.";
    msgPromo.style.color = "limegreen";
    await cargarPromocion();
    await cargarTodasPromociones();
  } catch (err) {
    console.error("❌", err);
    mostrarError("❌ No se pudo guardar la promoción.");
  } finally {
    btn.disabled = false;
  }
}

/* 🧱 Construir datos para enviar */
async function construirPayload() {
  const mensaje = sanitize(formPromo.promoMensaje.value.trim());
  const tipo = formPromo.promoTipo.value;
  const activo = formPromo.promoActivo.checked;
  const inicio = formPromo.promoInicio.value || null;
  const fin = formPromo.promoFin.value || null;
  const tema = formPromo.promoTema.value;
  const position = formPromo.promoPosition.value;
  const pages = Array.from(document.querySelectorAll("input[name='promoPages']:checked")).map(cb => cb.value);

  if (!mensaje || mensaje.length < 3) return mostrarError("⚠️ El mensaje debe tener al menos 3 caracteres.");
  if (!tipo || pages.length === 0) return mostrarError("⚠️ Elige tipo de contenido y al menos una página.");
  if (inicio && fin && new Date(inicio) > new Date(fin)) return mostrarError("⚠️ Fecha de inicio no puede ser posterior a la de fin.");

  const payload = {
    message: mensaje,
    active: activo,
    theme: tema,
    startDate: inicio,
    endDate: fin,
    pages,
    position
  };

  if (tipo === "video") {
    const url = sanitize(document.getElementById("promoVideo")?.value?.trim() || "");
    if (!/^https?:\/\/.+/.test(url)) return mostrarError("⚠️ URL de video inválida.");
    payload.mediaType = "video";
    payload.mediaUrl = url;
  }

  if (tipo === "imagen") {
    const file = document.getElementById("promoImagen")?.files[0];
    if (!file) return mostrarError("⚠️ Selecciona una imagen válida.");
    if (!file.type.startsWith("image/")) return mostrarError("⚠️ Formato de imagen no válido.");
    if (file.size > 2 * 1024 * 1024) return mostrarError("⚠️ Imagen demasiado grande (máx. 2MB)");

    try {
      const formData = new FormData();
      formData.append("image", file);

      const res = await fetch(API_UPLOAD, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      payload.mediaType = "image";
      payload.mediaUrl = data.url || data.secure_url;
    } catch (err) {
      console.error("❌ Error subiendo imagen:", err);
      return mostrarError("❌ Falló la subida de imagen.");
    }
  }

  return payload;
}

/* 🔄 Cargar todas las promociones (admin) */
async function cargarTodasPromociones() {
  try {
    const res = await fetch(`${API_PROMOS}/admin`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message);

    if (!Array.isArray(data.data) || data.data.length === 0) {
      contenedorListaPromos.innerHTML = "<p>📭 No hay promociones registradas.</p>";
      return;
    }

    contenedorListaPromos.innerHTML = data.data.map(promoItemHTML).join("");
  } catch (err) {
    console.error("❌ Error al cargar promociones:", err);
    contenedorListaPromos.innerHTML = "<p style='color:red;'>❌ No se pudieron cargar las promociones.</p>";
  }
}

function promoItemHTML(promo) {
  const estado = promo.active ? "✅ Activa" : "⛔ Inactiva";
  const inicio = promo.startDate ? new Date(promo.startDate).toLocaleDateString() : "Sin inicio";
  const fin = promo.endDate ? new Date(promo.endDate).toLocaleDateString() : "Sin fin";

  return `
    <div class="promo-item">
      <p><strong>${sanitize(promo.message)}</strong></p>
      <p>${estado} | ${promo.mediaType || "Texto"} | ${inicio} → ${fin}</p>
      <div class="promo-acciones">
        <button onclick="editarPromo('${promo._id}')">✏️ Editar</button>
        <button onclick="alternarEstadoPromo('${promo._id}')">🔁 Estado</button>
        <button onclick="eliminarPromo('${promo._id}')">🗑️ Eliminar</button>
      </div>
    </div>
  `;
}

/* 🛠 Acciones */
window.editarPromo = async (id) => {
  try {
    const res = await fetch(`${API_PROMOS}/admin`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    const promo = data.data.find(p => p._id === id);
    if (!promo) return mostrarError("❌ Promoción no encontrada para edición");

    cargarFormularioDesdePromocion(promo);
    scrollTo({ top: 0, behavior: "smooth" });
  } catch (err) {
    mostrarError("❌ No se pudo cargar la promoción para editar");
  }
};

window.alternarEstadoPromo = async (id) => {
  try {
    const res = await fetch(`${API_PROMOS}/${id}/estado`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message);

    mostrarMensaje(data.message, "success");
    await cargarTodasPromociones();
    await cargarPromocion();
  } catch (err) {
    mostrarError("❌ No se pudo cambiar el estado");
  }
};

window.eliminarPromo = async (id) => {
  if (!confirm("¿Eliminar esta promoción?")) return;

  try {
    const res = await fetch(`${API_PROMOS}/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message);

    mostrarMensaje("🗑️ Promoción eliminada", "success");
    await cargarTodasPromociones();
    await cargarPromocion();
  } catch (err) {
    mostrarError("❌ No se pudo eliminar la promoción");
  }
};

/* ⚠️ Mostrar errores */
function mostrarError(msg) {
  msgPromo.textContent = msg;
  msgPromo.style.color = "orangered";
  return null;
}

/* 🧼 Sanitizar entrada */
function sanitize(text = "") {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML.trim();
}

window.goBack = goBack;
