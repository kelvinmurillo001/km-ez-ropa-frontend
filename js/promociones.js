"use strict";

// ✅ Importar funciones necesarias
import {
  verificarSesion,
  mostrarMensaje,
  isDateInRange,
  logout,
  goBack
} from "./admin-utils.js";

// 🌐 Endpoint y token
const API_PROMO = "https://km-ez-ropa-backend.onrender.com/api/promos";
const token = verificarSesion();

document.addEventListener("DOMContentLoaded", () => {
  // 📌 DOM Elements
  const form = document.getElementById("promoForm");
  const promoInput = document.getElementById("promoMessage");
  const isActive = document.getElementById("isActive");
  const themeSelect = document.getElementById("theme");
  const startDate = document.getElementById("startDate");
  const endDate = document.getElementById("endDate");
  const mensajeExito = document.getElementById("promoFeedback");
  const promoPreview = document.getElementById("promoPreview");

  /**
   * 👁️ Actualizar vista previa de promoción
   */
  function updatePreview() {
    const mensaje = promoInput.value || "Tu mensaje aparecerá aquí...";
    const tema = themeSelect.value || "blue";
    promoPreview.textContent = mensaje;
    promoPreview.className = `promo-preview ${tema}`;
  }

  /**
   * ⚠️ Mostrar error visual en la vista previa
   */
  function mostrarErrorPreview(msg, clase = "error") {
    promoPreview.textContent = msg;
    promoPreview.className = `promo-preview ${clase}`;
  }

  /**
   * 📥 Cargar promoción actual desde backend
   */
  async function loadPromotion() {
    try {
      const res = await fetch(API_PROMO, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();

      if (!res.ok || !data) {
        mostrarErrorPreview("❌ No se pudo cargar la promoción.");
        return;
      }

      promoInput.value = data.message || "";
      isActive.checked = data.active || false;
      themeSelect.value = data.theme || "blue";
      startDate.value = data.startDate?.split("T")[0] || "";
      endDate.value = data.endDate?.split("T")[0] || "";

      if (data.active && isDateInRange(data.startDate, data.endDate)) {
        promoPreview.textContent = data.message;
        promoPreview.className = `promo-preview ${data.theme || "blue"}`;
      } else {
        mostrarErrorPreview("⚠️ Promoción inactiva o fuera de fecha.", "inactive");
      }
    } catch (err) {
      console.error("❌ Error al obtener promoción:", err);
      mostrarErrorPreview("❌ Error de red.");
    }
  }

  /**
   * 💾 Guardar promoción en backend
   */
  async function guardarPromocion(e) {
    e.preventDefault();

    const payload = {
      message: promoInput.value.trim(),
      active: isActive.checked,
      theme: themeSelect.value,
      startDate: startDate.value,
      endDate: endDate.value
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

      const data = await res.json();
      mensajeExito.classList.remove("oculto");

      if (res.ok) {
        mostrarMensaje(mensajeExito, "✅ Promoción actualizada correctamente", "success");
        await loadPromotion();
      } else {
        mostrarMensaje(mensajeExito, "❌ " + (data.message || "Error inesperado"), "error");
      }
    } catch (error) {
      console.error("❌ Error al guardar:", error);
      mostrarMensaje(mensajeExito, "❌ Error del servidor.", "error");
    }
  }

  // ▶️ Inicializar eventos
  promoInput?.addEventListener("input", updatePreview);
  themeSelect?.addEventListener("change", updatePreview);
  form?.addEventListener("submit", guardarPromocion);

  // ▶️ Cargar promoción al iniciar
  loadPromotion();

  // 🔗 Asignar funciones globales
  window.goBack = goBack;
  window.logout = logout;
});
