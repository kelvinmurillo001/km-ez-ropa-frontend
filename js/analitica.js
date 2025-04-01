const token = localStorage.getItem("token");

// 🔐 Verificar sesión
if (!token) {
  alert("⚠️ No autorizado. Inicia sesión.");
  window.location.href = "login.html";
}

// 🔗 URL de backend en producción
const API_URL = "https://km-ez-ropa-backend.onrender.com/api/products";

// 📊 Cargar estadísticas
async function loadStatistics() {
  try {
    const response = await fetch(API_URL, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const products = await response.json();

    if (!Array.isArray(products)) {
      console.error("❌ Formato inválido de datos");
      return;
    }

    // ✅ Cálculos generales
    const total = products.length;
    const featured = products.filter(p => p.destacado || p.featured).length;
    const totalStock = products.reduce((sum, p) => sum + Number(p.stock || 0), 0);
    const latest = products[0]?.nombre || "-";

    // ⏬ Mostrar en HTML
    document.getElementById("totalProducts").textContent = total;
    document.getElementById("featuredProducts").textContent = featured;
    document.getElementById("totalStock").textContent = totalStock;
    document.getElementById("latestProduct").textContent = latest;

    // 📦 Conteo por categoría
    const categoryCount = {};
    products.forEach((p) => {
      const cat = p.categoria || p.category || "Sin categoría";
      categoryCount[cat] = (categoryCount[cat] || 0) + 1;
    });

    const summary = document.getElementById("categorySummary");
    summary.innerHTML = "";

    for (const cat in categoryCount) {
      const badge = document.createElement("span");
      badge.textContent = `${cat}: ${categoryCount[cat]}`;
      summary.appendChild(badge);
    }

  } catch (err) {
    console.error("❌ Error cargando estadísticas:", err);
  }
}

// 🔙 Volver al panel
function goBack() {
  window.location.href = "panel.html";
}

// ▶️ Ejecutar al cargar
loadStatistics();
