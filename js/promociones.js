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
  const promoInput = document.getElementById("promoInput");
  const isActive = document.getElementById("isActive");
  const themeSelect = document.getElementById("theme");
  const startDate = document.getElementById("startDate");
  const endDate = document.getElementById("endDate");
  const mensajeExito = document.getElementById("mensajeExito");
  const promoActual = document.getElementById("promoActual");
  const promoPreview = document.getElementById("promoPreview");

  // ▶️ Cargar promoción existente
  async function loadPromotion() {
    try {
      const res = await fetch(API_PROMO, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();

      if (res.ok && data) {
        promoInput.value = data.mensaje || "";
        isActive.checked = data.activo || false;
        themeSelect.value = data.tema || "blue";
        startDate.value = data.fechaInicio || "";
        endDate.value = data.fechaFin || "";
        updatePreview();
        promoActual.textContent = data.mensaje || "Sin promoción activa actualmente.";
      } else {
        promoActual.textContent = "❌ Error al cargar promoción.";
      }
    } catch (error) {
      console.error("❌ Error al obtener la promoción:", error);
      promoActual.textContent = "❌ Error de red.";
    }
  }

  // 💾 Guardar promoción
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const payload = {
      mensaje: promoInput.value.trim(),
      activo: isActive.checked,
      tema: themeSelect.value,
      fechaInicio: startDate.value,
      fechaFin: endDate.value
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
        mensajeExito.textContent = "❌ Error al guardar promoción: " + data.mensaje;
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

  // 👁️ Vista previa en vivo
  function updatePreview() {
    promoPreview.textContent = promoInput.value || "Tu mensaje aparecerá aquí...";
    promoPreview.className = "promo-preview " + themeSelect.value;
  }

  promoInput.addEventListener("input", updatePreview);
  themeSelect.addEventListener("change", updatePreview);

  // 🔒 Cerrar sesión
  window.logout = function () {
    localStorage.removeItem("token");
    window.location.href = "login.html";
  };

  // 🔙 Volver al panel
  window.goBack = function () {
    window.location.href = "panel.html";
  };

  // ▶️ Inicial
  loadPromotion();
});
