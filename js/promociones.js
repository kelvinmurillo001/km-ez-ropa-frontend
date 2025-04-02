const API_PROMO = "https://km-ez-ropa-backend.onrender.com/api/promos";
const token = localStorage.getItem("token");

// 🔐 Verificación de sesión
if (!token) {
  alert("⚠️ Acceso no autorizado. Por favor, inicia sesión.");
  window.location.href = "login.html";
}

document.addEventListener("DOMContentLoaded", () => {
  // 📌 Elementos del DOM
  const form = document.getElementById("promoForm");
  const promoInput = document.getElementById("promoMessage");
  const isActive = document.getElementById("isActive");
  const themeSelect = document.getElementById("theme");
  const startDate = document.getElementById("startDate");
  const endDate = document.getElementById("endDate");
  const mensajeExito = document.getElementById("promoFeedback");
  const promoPreview = document.getElementById("promoPreview");

  // 📆 Verifica si fecha actual está dentro del rango
  function isDateInRange(start, end) {
    const today = new Date().toISOString().split("T")[0];
    return (!start || start <= today) && (!end || end >= today);
  }

  // ▶️ Cargar promoción existente
  async function loadPromotion() {
    try {
      const res = await fetch(API_PROMO, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();

      if (res.ok && data) {
        promoInput.value = data.message || "";
        isActive.checked = data.active || false;
        themeSelect.value = data.theme || "blue";
        startDate.value = data.startDate || "";
        endDate.value = data.endDate || "";

        updatePreview();

        // Mostrar mensaje si está activa y en rango
        if (data.active && isDateInRange(data.startDate, data.endDate)) {
          promoPreview.textContent = data.message;
          promoPreview.className = `promo-preview ${data.theme || "blue"}`;
        } else {
          promoPreview.textContent = "La promoción no está activa o fuera de fecha.";
          promoPreview.className = "promo-preview inactive";
        }

      } else {
        promoPreview.textContent = "❌ Error al cargar promoción.";
      }
    } catch (error) {
      console.error("❌ Error al obtener la promoción:", error);
      promoPreview.textContent = "❌ Error de red.";
    }
  }

  // 💾 Guardar promoción
  if (form) {
    form.addEventListener("submit", async (e) => {
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

        if (res.ok) {
          mensajeExito.classList.remove("oculto");
          mensajeExito.textContent = "✅ Promoción actualizada correctamente";
          mensajeExito.style.backgroundColor = "#e8f5e9";
          mensajeExito.style.color = "#2e7d32";
          loadPromotion();
        } else {
          mensajeExito.classList.remove("oculto");
          mensajeExito.textContent = "❌ Error al guardar promoción: " + (data.message || "Error inesperado");
          mensajeExito.style.backgroundColor = "#ffebee";
          mensajeExito.style.color = "#b71c1c";
        }

        setTimeout(() => mensajeExito.classList.add("oculto"), 3000);
      } catch (error) {
        console.error("❌ Error al guardar:", error);
        mensajeExito.classList.remove("oculto");
        mensajeExito.textContent = "❌ Error del servidor.";
        mensajeExito.style.backgroundColor = "#ffebee";
        mensajeExito.style.color = "#b71c1c";
        setTimeout(() => mensajeExito.classList.add("oculto"), 3000);
      }
    });
  }

  // 👁️ Vista previa en vivo
  function updatePreview() {
    const mensaje = promoInput.value || "Tu mensaje aparecerá aquí...";
    const tema = themeSelect.value;
    promoPreview.textContent = mensaje;
    promoPreview.className = "promo-preview " + tema;
  }

  // ⏱️ Detectar cambios
  promoInput?.addEventListener("input", updatePreview);
  themeSelect?.addEventListener("change", updatePreview);

  // 🔒 Cerrar sesión
  window.logout = () => {
    localStorage.removeItem("token");
    window.location.href = "login.html";
  };

  // 🔙 Volver al panel
  window.goBack = () => {
    window.location.href = "panel.html";
  };

  // ▶️ Inicial
  loadPromotion();
});
