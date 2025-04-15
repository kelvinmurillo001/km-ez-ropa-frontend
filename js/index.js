// 📥 Importar utilidades comunes
import { registrarVisitaPublica } from "./utils.js";

// === CARGAR PRODUCTOS DESTACADOS ===
document.addEventListener("DOMContentLoaded", async () => {
  // 📊 Registrar la visita al cargar la página
  registrarVisitaPublica();

  const catalogo = document.getElementById("catalogo");

  try {
    const res = await fetch("/api/products?featured=true");
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
    console.error("Error cargando productos:", err);
    catalogo.innerHTML = "<p style='text-align:center; color:red;'>⚠️ No se pudieron cargar los productos.</p>";
  }

  // 🎯 Actualizar número de productos en el carrito
  actualizarCarritoWidget();

  // 🌙 Activar modo oscuro si está guardado
  if (localStorage.getItem("modoOscuro") === "true") {
    document.body.classList.add("modo-oscuro");
  }

  // 🌗 Botón para cambiar modo
  const toggleBtn = document.getElementById("modoOscuroBtn");
  toggleBtn?.addEventListener("click", () => {
    document.body.classList.toggle("modo-oscuro");
    const activo = document.body.classList.contains("modo-oscuro");
    localStorage.setItem("modoOscuro", activo);
  });
});

// === REDIRECCIÓN A DETALLE ===
function verDetalle(id) {
  window.location.href = `/detalle.html?id=${id}`;
}

// === ACTUALIZAR WIDGET DEL CARRITO ===
function actualizarCarritoWidget() {
  const carrito = JSON.parse(localStorage.getItem("km_ez_cart")) || [];
  const total = carrito.reduce((sum, item) => sum + item.quantity, 0);
  const contador = document.getElementById("cartCount");
  if (contador) contador.textContent = total;
}
