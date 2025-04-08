"use strict";

// 🌐 Endpoint y token
const API_PROMO = "https://km-ez-ropa-backend.onrender.com/api/promos";
const token = localStorage.getItem("token");

// 🔐 Verificación de sesión
if (!token || typeof token !== "string" || token.length < 10) {
  alert("⚠️ Acceso no autorizado. Por favor, inicia sesión.");
  window.location.href = "login.html";
}

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

  // 📅 Validar si fecha está dentro del rango
  const isDateInRange = (start, end) => {
    const today = new Date().toISOString().split("T")[0];
    return (!start || start <= today) && (!end || end >= today);
  };

  // 👁️ Vista previa dinámica
  const updatePreview = () => {
    const mensaje = promoInput.value || "Tu mensaje aparecerá aquí...";
    const tema = themeSelect.value || "blue";
    promoPreview.textContent = mensaje;
    promoPreview.className = `promo-preview ${tema}`;
  };

  // 📥 Cargar promoción actual
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
  };

  // ⚠️ Mostrar errores en preview
  const mostrarErrorPreview = (mensaje, clase = "error") => {
    promoPreview.textContent = mensaje;
    promoPreview.className = `promo-preview ${clase}`;
  };

  // 💾 Guardar promoción
  const guardarPromocion = async (e) => {
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
        mostrarMensaje("✅ Promoción actualizada correctamente", "success");
        await loadPromotion();
      } else {
        mostrarMensaje("❌ " + (data.message || "Error inesperado"), "error");
      }

    } catch (error) {
      console.error("❌ Error al guardar:", error);
      mostrarMensaje("❌ Error del servidor.", "error");
    }
  };

  // ✅ Mostrar mensaje visual de éxito/error
  const mostrarMensaje = (msg, tipo = "info") => {
    mensajeExito.textContent = msg;
    mensajeExito.classList.remove("oculto");

    const colores = {
      success: { bg: "#e8f5e9", color: "#2e7d32" },
      error: { bg: "#ffebee", color: "#b71c1c" },
      warning: { bg: "#fff8e1", color: "#f57c00" },
      info: { bg: "#e3f2fd", color: "#0277bd" }
    };

    const { bg, color } = colores[tipo] || colores.info;
    mensajeExito.style.backgroundColor = bg;
    mensajeExito.style.color = color;

    setTimeout(() => mensajeExito.classList.add("oculto"), 3000);
  };

  // 🔗 Navegación
  window.goBack = () => window.location.href = "panel.html";
  window.logout = () => {
    localStorage.removeItem("token");
    window.location.href = "login.html";
  };

  // ▶️ Init
  promoInput?.addEventListener("input", updatePreview);
  themeSelect?.addEventListener("change", updatePreview);
  form?.addEventListener("submit", guardarPromocion);
  loadPromotion();
});
