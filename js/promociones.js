"use strict";

import { verificarSesion, goBack, mostrarMensaje } from "./admin-utils.js";
import { API_BASE } from "./config.js";

const token = verificarSesion();
const API_PROMOS = `${API_BASE}/api/promos`;
const API_UPLOAD = `${API_BASE}/api/uploads`;

const formPromo = document.getElementById("formPromo");
const msgPromo = document.getElementById("msgPromo");
const estadoActual = document.getElementById("estadoActual");

let promocionId = null;

document.addEventListener("DOMContentLoaded", () => {
  cargarPromocion();
  formPromo?.addEventListener("submit", guardarPromocion);
  document.getElementById("promoTipo")?.addEventListener("change", mostrarCampoMultimedia);
});

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

async function cargarPromocion() {
  try {
    const res = await fetch(API_PROMOS);
    const promos = await res.json();
    const promo = Array.isArray(promos) ? promos[0] : promos;

    if (!promo) {
      estadoActual.innerHTML = "<p>📭 No hay promociones activas en este momento.</p>";
      return;
    }

    promocionId = promo._id;

    const estadoColor = promo.active ? "green" : "red";
    const estadoTexto = promo.active ? "✅ Activa" : "⛔ Inactiva";
    const inicio = promo.startDate ? new Date(promo.startDate).toLocaleDateString() : "No definido";
    const fin = promo.endDate ? new Date(promo.endDate).toLocaleDateString() : "Sin fecha";
    const badgeTheme = promo.theme || "blue";

    let mediaPreview = "";
    if (promo.mediaType === "image" && promo.mediaUrl) {
      mediaPreview = `<img src="${promo.mediaUrl}" alt="Imagen promocional" style="max-width:100%; border-radius:6px;" />`;
    } else if (promo.mediaType === "video" && promo.mediaUrl) {
      mediaPreview = `
        <video controls style="max-width:100%; border-radius:6px;">
          <source src="${promo.mediaUrl}" type="video/mp4">
          Tu navegador no soporta video.
        </video>`;
    }

    estadoActual.innerHTML = `
      <div class="promo-actual">
        <p><strong>Estado:</strong> <span style="color:${estadoColor}">${estadoTexto}</span></p>
        <p><strong>Mensaje:</strong> ${promo.message ?? "Sin mensaje disponible"}</p>
        <p><strong>Vigencia:</strong> ${inicio} - ${fin}</p>
        <p><strong>Tema:</strong> <span class="badge ${badgeTheme}">${badgeTheme}</span></p>
        <p><strong>Páginas:</strong> ${promo.pages?.join(", ") || "Ninguna"}</p>
        <p><strong>Posición:</strong> ${promo.position || "top"}</p>
        <p><strong>Tipo:</strong> ${promo.mediaType || "texto"}</p>
        ${mediaPreview}
      </div>
    `;

    document.getElementById("promoMensaje").value = promo.message || "";
    document.getElementById("promoActivo").checked = promo.active || false;
    document.getElementById("promoTema").value = promo.theme || "blue";
    document.getElementById("promoInicio").value = promo.startDate?.substring(0, 10) || "";
    document.getElementById("promoFin").value = promo.endDate?.substring(0, 10) || "";
    document.getElementById("promoTipo").value = promo.mediaType || "texto";
    document.getElementById("promoPosition").value = promo.position || "top";

    mostrarCampoMultimedia();
    if (promo.mediaType === "video" && promo.mediaUrl) {
      document.getElementById("promoVideo").value = promo.mediaUrl;
    }

    document.querySelectorAll("input[name='promoPages']").forEach(cb => cb.checked = false);
    promo.pages?.forEach(p => {
      const cb = document.querySelector(`input[name='promoPages'][value='${p}']`);
      if (cb) cb.checked = true;
    });

  } catch (err) {
    console.error("❌ Error al cargar promoción:", err);
    estadoActual.innerHTML = "<p style='color:red;'>❌ No se pudo cargar la promoción activa.</p>";
  }
}

async function guardarPromocion(e) {
  e.preventDefault();
  msgPromo.textContent = "";
  const btn = formPromo.querySelector("button[type='submit']");
  btn.disabled = true;

  const mensaje = formPromo.promoMensaje.value.trim();
  const tipo = formPromo.promoTipo.value;
  const activo = formPromo.promoActivo.checked;
  const inicio = formPromo.promoInicio.value || null;
  const fin = formPromo.promoFin.value || null;
  const tema = formPromo.promoTema.value;
  const position = formPromo.promoPosition.value;
  const pages = Array.from(document.querySelectorAll("input[name='promoPages']:checked")).map(cb => cb.value);

  if (!mensaje || mensaje.length < 3) return mostrarError("⚠️ El mensaje debe tener al menos 3 caracteres.");
  if (!tipo || pages.length === 0) return mostrarError("⚠️ Selecciona un tipo de contenido y al menos una página.");

  let mediaUrl = "";

  if (tipo === "video") {
    mediaUrl = document.getElementById("promoVideo")?.value?.trim() || "";
    if (!mediaUrl.startsWith("http")) return mostrarError("⚠️ La URL del video no es válida.");
  }

  if (tipo === "imagen") {
    const file = document.getElementById("promoImagen")?.files[0];
    if (file && file.type.startsWith("image/")) {
      try {
        const formData = new FormData();
        formData.append("image", file);

        const resImg = await fetch(API_UPLOAD, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData
        });

        const imgData = await resImg.json();
        if (!resImg.ok) throw new Error("Error al subir imagen");
        mediaUrl = imgData.secure_url || imgData.url;
      } catch (err) {
        console.error("❌", err);
        return mostrarError("❌ Falló la subida de imagen. Intenta de nuevo.");
      }
    }
  }

  const payload = {
    message: mensaje,
    active: activo,
    theme: tema,
    startDate: inicio,
    endDate: fin,
    pages,
    position
  };

  if (tipo === "video" && mediaUrl) {
    payload.mediaType = "video";
    payload.mediaUrl = mediaUrl;
  }

  if (tipo === "imagen" && mediaUrl) {
    payload.mediaType = "image";
    payload.mediaUrl = mediaUrl;
  }

  try {
    msgPromo.textContent = "⏳ Guardando promoción...";
    msgPromo.style.color = "#888";

    const method = promocionId ? "PUT" : "POST";
    const res = await fetch(API_PROMOS, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Error al guardar");

    msgPromo.textContent = "✅ Promoción guardada con éxito.";
    msgPromo.style.color = "limegreen";
    await cargarPromocion();
  } catch (err) {
    console.error("❌", err);
    mostrarError("❌ No se pudo guardar la promoción.");
  } finally {
    btn.disabled = false;
  }
}

function mostrarError(msg) {
  msgPromo.textContent = msg;
  msgPromo.style.color = "orange";
  formPromo.querySelector("button[type='submit']").disabled = false;
}

window.goBack = goBack;
