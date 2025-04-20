"use strict";

import { verificarSesion, goBack, mostrarMensaje } from "./admin-utils.js";
import { API_BASE } from "./config.js";

const token = verificarSesion();
const API_PROMOS = `${API_BASE}/api/promos`;

const formPromo = document.getElementById("formPromo");
const msgPromo = document.getElementById("msgPromo");

document.addEventListener("DOMContentLoaded", () => {
  cargarPromocion();
  formPromo?.addEventListener("submit", guardarPromocion);
  document.getElementById("promoTipo")?.addEventListener("change", mostrarCampoMultimedia);
});

// 🧠 Mostrar campo dinámico según tipo (imagen/video)
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

// ✅ Cargar promoción activa actual
async function cargarPromocion() {
  try {
    const res = await fetch(API_PROMOS);
    const promos = await res.json();
    const promo = Array.isArray(promos) ? promos[0] : promos;

    if (!promo) {
      document.getElementById("estadoActual").innerHTML = "<p>📭 No hay promociones activas.</p>";
      return;
    }

    const estadoColor = promo.active ? "green" : "red";
    const estadoTexto = promo.active ? "✅ Activa" : "⛔ Inactiva";
    const inicio = promo.startDate ? new Date(promo.startDate).toLocaleDateString() : "No definido";
    const fin = promo.endDate ? new Date(promo.endDate).toLocaleDateString() : "Sin fecha";
    const badgeTheme = promo.theme || "blue";

    // Vista previa multimedia
    let mediaPreview = "";
    if (promo.mediaType === "image" && promo.mediaUrl) {
      mediaPreview = `<img src="${promo.mediaUrl}" alt="Promo" style="max-width:100%; border-radius:6px;" />`;
    } else if (promo.mediaType === "video" && promo.mediaUrl) {
      mediaPreview = `
        <video controls style="max-width:100%; border-radius:6px;">
          <source src="${promo.mediaUrl}" type="video/mp4">
          Tu navegador no soporta video.
        </video>`;
    }

    document.getElementById("estadoActual").innerHTML = `
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

    // Prellenar
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

    // Marcar checkboxes de páginas
    if (Array.isArray(promo.pages)) {
      promo.pages.forEach(p => {
        const cb = document.querySelector(`input[name='promoPages'][value='${p}']`);
        if (cb) cb.checked = true;
      });
    }

  } catch (err) {
    console.error("❌ Error cargando promoción:", err);
    document.getElementById("estadoActual").innerHTML = "<p style='color:red;'>❌ Error al cargar promoción.</p>";
  }
}

// 📝 Guardar promoción
async function guardarPromocion(e) {
  e.preventDefault();
  msgPromo.textContent = "";
  const btn = formPromo.querySelector("button[type='submit']");
  btn.disabled = true;

  const mensaje = document.getElementById("promoMensaje").value.trim();
  const tipo = document.getElementById("promoTipo").value;
  const activo = document.getElementById("promoActivo").checked;
  const inicio = document.getElementById("promoInicio").value || null;
  const fin = document.getElementById("promoFin").value || null;
  const tema = document.getElementById("promoTema").value;
  const position = document.getElementById("promoPosition").value;

  // Leer múltiples páginas
  const pages = Array.from(document.querySelectorAll("input[name='promoPages']:checked")).map(cb => cb.value);

  if (!mensaje || mensaje.length < 3) {
    msgPromo.textContent = "⚠️ El mensaje debe tener al menos 3 caracteres.";
    msgPromo.style.color = "orange";
    btn.disabled = false;
    return;
  }

  if (!tipo || pages.length === 0) {
    msgPromo.textContent = "⚠️ Debes seleccionar tipo y al menos una página.";
    msgPromo.style.color = "orange";
    btn.disabled = false;
    return;
  }

  let mediaUrl = "";

  if (tipo === "video") {
    mediaUrl = document.getElementById("promoVideo")?.value?.trim() || "";
    if (!mediaUrl.startsWith("http")) {
      msgPromo.textContent = "⚠️ URL del video inválida.";
      msgPromo.style.color = "orange";
      btn.disabled = false;
      return;
    }
  }

  // Armado de payload inicial
  const payload = {
    message: mensaje,
    active: activo,
    theme: tema,
    startDate: inicio,
    endDate: fin,
    mediaType: tipo !== "texto" ? tipo : null,
    mediaUrl: tipo === "video" ? mediaUrl : null,
    pages,
    position
  };

  // Subida de imagen si aplica
  if (tipo === "imagen") {
    const file = document.getElementById("promoImagen")?.files[0];
    if (file && file.type.startsWith("image/")) {
      try {
        const formData = new FormData();
        formData.append("image", file);

        const resImg = await fetch(`${API_BASE}/api/uploads`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`
          },
          body: formData
        });

        const imgData = await resImg.json();
        if (!resImg.ok) throw new Error("Error al subir imagen");

        payload.mediaUrl = imgData.secure_url || imgData.url;
      } catch (err) {
        console.error("❌ Error al subir imagen", err);
        msgPromo.textContent = "❌ No se pudo subir la imagen.";
        msgPromo.style.color = "red";
        btn.disabled = false;
        return;
      }
    }
  }

  // Envío final
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
