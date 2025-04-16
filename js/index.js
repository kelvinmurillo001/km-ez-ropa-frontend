// 📥 Importar utilidades comunes
import { registrarVisitaPublica } from "./utils.js";
import { API_BASE } from "./config.js";

// === CARGAR PRODUCTOS DESTACADOS ===
document.addEventListener("DOMContentLoaded", async () => {
  // 📊 Registrar visita al sitio
  registrarVisitaPublica();

  const catalogo = document.getElementById("catalogo");

  try {
    const res = await fetch(`${API_BASE}/api/products?featured=true`);
    const data = await res.json();

    if (!res.ok) throw new Error(data.message || "Error al cargar productos");

    if (data.length === 0) {
      catalogo.innerHTML = "<p style='text-align:center;'>😢 No hay productos destacados en este momento.</p>";
      return;
    }

    data.forEach(producto => {
      const card = document.createElement("div");
      card.className = "product-card";
      card.innerHTML = `
        <img src="${producto.image}" alt="${producto.name}" />
        <div class="product-info">
          <h3>${producto.name}</h3>
          <p>$${producto.price.toFixed(2)}</p>
          <button onclick="verDetalle('${producto._id}')" class="btn-card">👁️ Ver</button>
        </div>
      `;
      catalogo.appendChild(card);
    });
  } catch (err) {
    console.error("❌ Error cargando productos:", err);
    catalogo.innerHTML = "<p style='text-align:center; color:red;'>⚠️ No se pudieron cargar los productos.</p>";
  }

  // 🎯 Actualizar carrito flotante
  actualizarCarritoWidget();

  // 🌙 Activar modo oscuro si está guardado
  if (localStorage.getItem("modoOscuro") === "true") {
    document.body.classList.add("modo-oscuro");
  }

  // 🌗 Toggle de modo oscuro
  const toggleBtn = document.getElementById("modoOscuroBtn");
  toggleBtn?.addEventListener("click", () => {
    document.body.classList.toggle("modo-oscuro");
    const activo = document.body.classList.contains("modo-oscuro");
    localStorage.setItem("modoOscuro", activo);
  });
});

// 🔁 Redirección al detalle del producto
function verDetalle(id) {
  window.location.href = `/detalle.html?id=${id}`;
}

// 🛒 Actualizar contador del carrito
function actualizarCarritoWidget() {
  const carrito = JSON.parse(localStorage.getItem("km_ez_cart")) || [];
  const total = carrito.reduce((sum, item) => sum + item.quantity, 0);
  const contador = document.getElementById("cartCount");
  if (contador) contador.textContent = total;
}
