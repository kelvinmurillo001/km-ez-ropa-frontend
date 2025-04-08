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
  // 📌 Referencias al DOM
  const form = document.getElementById("promoForm");
  const promoInput = document.getElementById("promoMessage");
  const isActive = document.getElementById("isActive");
  const themeSelect = document.getElementById("theme");
  const startDate = document.getElementById("startDate");
  const endDate = document.getElementById("endDate");
  const mensajeExito = document.getElementById("promoFeedback");
  const promoPreview = document.getElementById("promoPreview");

  /**
   * 📅 Valida si la promoción está dentro de la fecha válida
   */
  const isDateInRange = (start, end) => {
    const today = new Date().toISOString().split("T")[0];
    return (!start || start <= today) && (!end || end >= today);
  };

  /**
   * 👁️ Actualiza la vista previa dinámica de la promoción
   */
  const updatePreview = () => {
    const mensaje = promoInput.value || "Tu mensaje aparecerá aquí...";
    const tema = themeSelect.value || "blue";
    promoPreview.textContent = mensaje;
    promoPreview.className = `promo-preview ${tema}`;
  };

  /**
   * 📥 Cargar datos actuales de promoción desde la API
   */
  const loadPromotion = async () => {
    try {
      const res = await fetch(API_PROMO, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();

      if (res.ok && data) {
        promoInput.value = data.message || "";
        isActive.checked = data.active || false;
        themeSelect.value = data.theme || "blue";
        startDate.value = data.startDate ? data.startDate.split("T")[0] : "";
        endDate.value = data.endDate ? data.endDate.split("T")[0] : "";

        // Mostrar vista previa según estado
        if (data.active && isDateInRange(data.startDate, data.endDate)) {
          promoPreview.textContent = data.message;
          promoPreview.className = `promo-preview ${data.theme || "blue"}`;
        } else {
          promoPreview.textContent = "⚠️ Promoción inactiva o fuera de fecha.";
          promoPreview.className = "promo-preview inactive";
        }

      } else {
        promoPreview.textContent = "❌ No se pudo cargar la promoción.";
        promoPreview.className = "promo-preview error";
      }

    } catch (err) {
      console.error("❌ Error al obtener promoción:", err);
      promoPreview.textContent = "❌ Error de red.";
      promoPreview.className = "promo-preview error";
    }
  };

  /**
   * 💾 Guardar o actualizar la promoción
   */
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
        mensajeExito.textContent = "✅ Promoción actualizada correctamente";
        mensajeExito.style.backgroundColor = "#e8f5e9";
        mensajeExito.style.color = "#2e7d32";
        loadPromotion();
      } else {
        mensajeExito.textContent = "❌ Error: " + (data.message || "Error inesperado");
        mensajeExito.style.backgroundColor = "#ffebee";
        mensajeExito.style.color = "#b71c1c";
      }

    } catch (error) {
      console.error("❌ Error al guardar:", error);
      mensajeExito.classList.remove("oculto");
      mensajeExito.textContent = "❌ Error del servidor.";
      mensajeExito.style.backgroundColor = "#ffebee";
      mensajeExito.style.color = "#b71c1c";
    }

    setTimeout(() => mensajeExito.classList.add("oculto"), 3000);
  };

  /**
   * 🎯 Listeners
   */
  promoInput?.addEventListener("input", updatePreview);
  themeSelect?.addEventListener("change", updatePreview);
  form?.addEventListener("submit", guardarPromocion);

  /**
   * 🔙 Ir al panel principal
   */
  window.goBack = () => window.location.href = "panel.html";

  /**
   * 🔒 Cerrar sesión
   */
  window.logout = () => {
    localStorage.removeItem("token");
    window.location.href = "login.html";
  };

  // ▶️ Iniciar cargando la promoción actual
  loadPromotion();
});
