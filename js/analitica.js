// 🔐 Verificar sesión 
const token = localStorage.getItem("token");
if (!token) {
  alert("⚠️ No autorizado. Inicia sesión.");
  window.location.href = "login.html";
}

// 🔗 Endpoints
const API_BASE = "https://km-ez-ropa-backend.onrender.com/api";
const API_PRODUCTS = `${API_BASE}/products`;
const API_PEDIDOS = `${API_BASE}/orders`;
const API_VISITAS = `${API_BASE}/visitas/contador`;

// 📊 Cargar estadísticas
async function loadStatistics() {
  try {
    // 👉 Productos
    const resProd = await fetch(API_PRODUCTS);
    const products = await resProd.json();

    if (!Array.isArray(products)) {
      console.error("❌ Formato inválido de productos");
      return;
    }

    const totalProductos = products.length;
    const promosActivas = products.filter(p => p.featured).length;

    document.getElementById("totalProductos").textContent = totalProductos;
    document.getElementById("promosActivas").textContent = promosActivas;

    // 🧠 Top Categorías
    const categoryCount = {};
    products.forEach(p => {
      const cat = p.category || "Sin categoría";
      categoryCount[cat] = (categoryCount[cat] || 0) + 1;
    });

    const categoriaEl = document.getElementById("topCategorias");
    categoriaEl.innerHTML = "";
    for (const cat in categoryCount) {
      const li = document.createElement("li");
      li.textContent = `${cat}: ${categoryCount[cat]}`;
      categoriaEl.appendChild(li);
    }

    // 👥 Visitas
    const resVisitas = await fetch(API_VISITAS);
    const visitasData = await resVisitas.json();
    document.getElementById("visitas").textContent = visitasData.total || 0;

    // 🛒 Ventas (solo pedidos enviados)
    const resPedidos = await fetch(API_PEDIDOS, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const pedidos = await resPedidos.json();
    const enviados = pedidos.filter(p => p.estado === "enviado");
    const totalVentas = enviados.reduce((sum, p) => sum + parseFloat(p.total || 0), 0);

    document.getElementById("ventasTotales").textContent = totalVentas.toFixed(2);

  } catch (err) {
    console.error("❌ Error cargando estadísticas:", err);
  }
}

// 🔙 Volver al panel
function goBack() {
  window.location.href = "panel.html";
}

// ▶️ Ejecutar
loadStatistics();
