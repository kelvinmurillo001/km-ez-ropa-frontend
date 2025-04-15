"use strict";

// ✅ Importar funciones utilitarias
import {
  verificarSesion,
  mostrarMensaje,
  isDateInRange,
  logout,
  goBack
} from "./admin-utils.js";

// 🌐 API + token
const API_PROMO = "https://km-ez-ropa-backend.onrender.com/api/promos";
const token = verificarSesion();

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("promoForm");
  const promoInput = document.getElementById("promoMessage");
  const isActive = document.getElementById("isActive");
  const themeSelect = document.getElementById("theme");
  const startDate = document.getElementById("startDate");
  const endDate = document.getElementById("endDate");
  const mensajeExito = document.getElementById("promoFeedback");
  const promoPreview = document.getElementById("promoPreview");

  // 🎯 Previsualización
  const updatePreview = () => {
    const mensaje = promoInput.value.trim() || "Tu mensaje aparecerá aquí...";
    const tema = themeSelect.value || "blue";

    promoPreview.textContent = mensaje;
    promoPreview.className = `promo-preview ${tema}`;
  };

  // ❌ Mostrar error en preview
  const mostrarErrorPreview = (msg = "⚠️ Error de vista previa", clase = "inactive") => {
    promoPreview.textContent = msg;
    promoPreview.className = `promo-preview ${clase}`;
  };

  // 📥 Obtener promoción actual
  const loadPromotion = async () => {
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
      isActive.checked = data.active ?? false;
      themeSelect.value = data.theme || "blue";
      startDate.value = data.startDate?.split("T")[0] || "";
      endDate.value = data.endDate?.split("T")[0] || "";

      if (data.active && isDateInRange(data.startDate, data.endDate)) {
        promoPreview.textContent = data.message;
        promoPreview.className = `promo-preview ${data.theme || "blue"}`;
      } else {
        mostrarErrorPreview("⚠️ Promoción inactiva o fuera de fecha");
      }
    } catch (err) {
      console.error("❌ Error cargando promoción:", err);
      mostrarErrorPreview("❌ Error de red.");
    }
  };

  // 💾 Guardar promoción
  const guardarPromocion = async (e) => {
    e.preventDefault();

    const mensaje = promoInput.value.trim();
    const start = startDate.value;
    const end = endDate.value;

    if (!mensaje) {
      mostrarMensaje(mensajeExito, "⚠️ El mensaje no puede estar vacío", "warning");
      return;
    }

    if (start && end && new Date(start) > new Date(end)) {
      mostrarMensaje(mensajeExito, "⚠️ La fecha de inicio no puede ser mayor a la de fin", "warning");
      return;
    }

    const payload = {
      message: mensaje,
      active: isActive.checked,
      theme: themeSelect.value,
      startDate: start,
      endDate: end
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

      const result = await res.json();
      mensajeExito.classList.remove("oculto");

      if (res.ok) {
        mostrarMensaje(mensajeExito, "✅ Promoción actualizada correctamente", "success");
        await loadPromotion();
      } else {
        mostrarMensaje(mensajeExito, `❌ ${result.message || "Error inesperado"}`, "error");
      }
    } catch (err) {
      console.error("❌ Error al guardar promoción:", err);
      mostrarMensaje(mensajeExito, "❌ Error de red o servidor", "error");
    }
  };

  // 🧩 Eventos
  promoInput?.addEventListener("input", updatePreview);
  themeSelect?.addEventListener("change", updatePreview);
  form?.addEventListener("submit", guardarPromocion);

  // ▶️ Inicial
  loadPromotion();

  // 🔓 Acciones globales
  window.logout = logout;
  window.goBack = goBack;
});
