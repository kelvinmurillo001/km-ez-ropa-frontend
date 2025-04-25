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

let promocionId = null;

// 🚀 Inicialización
document.addEventListener("DOMContentLoaded", () => {
  cargarPromocion();
  formPromo?.addEventListener("submit", guardarPromocion);
  document.getElementById("promoTipo")?.addEventListener("change", mostrarCampoMultimedia);
});

/* ───────────────────────────────────────────── */
/* 📺 MOSTRAR CAMPO MULTIMEDIA                   */
/* ───────────────────────────────────────────── */
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

/* ───────────────────────────────────────────── */
/* 📦 CARGAR PROMOCIÓN ACTUAL                    */
/* ───────────────────────────────────────────── */
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

/* ───────────────────────────────────────────── */
/* ✏️ RELLENAR FORMULARIO CON PROMO EXISTENTE    */
/* ───────────────────────────────────────────── */
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

/* ───────────────────────────────────────────── */
/* 💾 GUARDAR PROMOCIÓN                          */
/* ───────────────────────────────────────────── */
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
  } catch (err) {
    console.error("❌", err);
    mostrarError("❌ No se pudo guardar la promoción.");
  } finally {
    btn.disabled = false;
  }
}

/* ───────────────────────────────────────────── */
/* 🧱 CONSTRUIR PAYLOAD                          */
/* ───────────────────────────────────────────── */
async function construirPayload() {
  const mensaje = formPromo.promoMensaje.value.trim();
  const tipo = formPromo.promoTipo.value;
  const activo = formPromo.promoActivo.checked;
  const inicio = formPromo.promoInicio.value || null;
  const fin = formPromo.promoFin.value || null;
  const tema = formPromo.promoTema.value;
  const position = formPromo.promoPosition.value;
  const pages = Array.from(document.querySelectorAll("input[name='promoPages']:checked")).map(cb => cb.value);

  if (!mensaje || mensaje.length < 3) return mostrarError("⚠️ El mensaje debe tener al menos 3 caracteres.");
  if (!tipo || pages.length === 0) return mostrarError("⚠️ Elige tipo de contenido y al menos una página.");

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
    const url = document.getElementById("promoVideo")?.value?.trim();
    if (!url || !url.startsWith("http")) return mostrarError("⚠️ URL de video inválida.");
    payload.mediaType = "video";
    payload.mediaUrl = url;
  }

  if (tipo === "imagen") {
    const file = document.getElementById("promoImagen")?.files[0];
    if (!file || !file.type.startsWith("image/")) return mostrarError("⚠️ Selecciona una imagen válida.");
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

/* ───────────────────────────────────────────── */
/* ⚠️ MOSTRAR ERRORES AL USUARIO                */
/* ───────────────────────────────────────────── */
function mostrarError(msg) {
  msgPromo.textContent = msg;
  msgPromo.style.color = "orangered";
  return null;
}

// 🔙 Función global
window.goBack = goBack;
