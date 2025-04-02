// 🔐 Verificar sesión 
const token = localStorage.getItem("token");

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
    const featured = products.filter(p => p.featured).length;
    const totalStock = products.reduce((sum, p) => sum + Number(p.stock || 0), 0);
    const latest = products[0]?.name || "-";

    // ⏬ Mostrar en HTML
    const totalEl = document.getElementById("totalProductos");
    const featuredEl = document.getElementById("promosActivas"); // Se puede renombrar según necesidad
    const stockEl = document.getElementById("visitas"); // Usado como placeholder
    const latestEl = document.getElementById("ventasTotales"); // Usado como placeholder

    if (totalEl) totalEl.textContent = total;
    if (featuredEl) featuredEl.textContent = featured;
    if (stockEl) stockEl.textContent = totalStock;
    if (latestEl) latestEl.textContent = latest;

    // 📦 Conteo por categoría
    const categoryCount = {};
    products.forEach((p) => {
      const cat = p.category || "Sin categoría";
      categoryCount[cat] = (categoryCount[cat] || 0) + 1;
    });

    const summary = document.getElementById("topCategorias");
    if (summary) {
      summary.innerHTML = "";
      for (const cat in categoryCount) {
        const li = document.createElement("li");
        li.textContent = `${cat}: ${categoryCount[cat]}`;
        summary.appendChild(li);
      }
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
