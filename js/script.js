"use strict";

// 🌐 Endpoints base
const API_BASE = "https://km-ez-ropa-backend.onrender.com/api";
const API_PROMO = `${API_BASE}/promos`;
let productos = [];

// ▶️ Iniciar flujo
registrarVisita();
cargarProductos();

/**
 * 📦 Obtener todos los productos del backend y preparar catálogo
 */
async function cargarProductos() {
  try {
    const res = await fetch(`${API_BASE}/products`);
    productos = await res.json();

    if (!Array.isArray(productos)) throw new Error("Formato de productos inválido");

    aplicarFiltros();
    cargarSubcategoriasUnicas();
    cargarPromocionActiva();

    // 🧠 Filtros y búsquedas
    document.getElementById("busqueda")?.addEventListener("input", aplicarFiltros);
    document.getElementById("categoria")?.addEventListener("change", () => {
      cargarSubcategoriasUnicas();
      aplicarFiltros();
    });
    document.getElementById("subcategoria")?.addEventListener("change", aplicarFiltros);
    document.getElementById("orden")?.addEventListener("change", aplicarFiltros);

  } catch (error) {
    console.error("❌ Error al cargar productos:", error);
    document.getElementById("catalogo").innerHTML =
      "<p class='mensaje-error'>❌ Error al cargar productos</p>";
  }
}

/**
 * 🔍 Filtrar productos según inputs del usuario
 */
function aplicarFiltros() {
  const termino = document.getElementById("busqueda")?.value.toLowerCase() || "";
  const categoria = document.getElementById("categoria")?.value || "todas";
  const subcategoria = document.getElementById("subcategoria")?.value || "todas";
  const orden = document.getElementById("orden")?.value || "reciente";

  let filtrados = [...productos];

  if (categoria !== "todas") {
    filtrados = filtrados.filter(p => p.category?.toLowerCase() === categoria.toLowerCase());
  }

  if (subcategoria !== "todas") {
    filtrados = filtrados.filter(p => p.subcategory?.toLowerCase() === subcategoria.toLowerCase());
  }

  if (termino) {
    filtrados = filtrados.filter(p => p.name?.toLowerCase().includes(termino));
  }

  switch (orden) {
    case "precioAsc":
      filtrados.sort((a, b) => a.price - b.price);
      break;
    case "precioDesc":
      filtrados.sort((a, b) => b.price - a.price);
      break;
    case "destacados":
      filtrados = filtrados.filter(p => p.featured);
      break;
    default:
      filtrados.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  mostrarProductos(filtrados);
}

/**
 * 🖼️ Renderiza lista de productos al DOM
 */
function mostrarProductos(lista) {
  const contenedor = document.getElementById("catalogo");
  contenedor.innerHTML = "";

  if (!lista.length) {
    contenedor.innerHTML = "<p class='mensaje-error'>😕 No hay productos que coincidan.</p>";
    return;
  }

  lista.forEach(producto => {
    const imagen = producto.image || "../assets/logo.jpg";
    const agotado = producto.stock <= 0;

    const card = document.createElement("div");
    card.className = "card fade-in";

    card.innerHTML = `
      <div class="imagen-catalogo" onclick="ampliarImagen('${imagen}')">
        <img src="${imagen}" alt="${producto.name}" class="zoomable" />
      </div>
      <h3>${producto.name}</h3>
      ${producto.featured ? '<span class="destacado-badge">⭐ Destacado</span>' : ""}
      <p><strong>Precio:</strong> $${producto.price}</p>
      <p><strong>Categoría:</strong> ${producto.category}</p>
      <p><strong>Subcategoría:</strong> ${producto.subcategory || "N/A"}</p>
      <p><strong>Stock:</strong> ${agotado ? "❌ Agotado" : producto.stock}</p>
      <button ${agotado ? "disabled" : ""} onclick='addToCart(${JSON.stringify({
        id: producto._id,
        nombre: producto.name,
        precio: producto.price,
        imagen: producto.image,
        talla: producto.talla || "",
        colores: producto.colores || ""
      })})'>🛒 Agregar al carrito</button>
    `;

    contenedor.appendChild(card);
  });
}

/**
 * 📂 Genera subcategorías únicas según la categoría seleccionada
 */
function cargarSubcategoriasUnicas() {
  const categoria = document.getElementById("categoria")?.value || "todas";
  const subSelect = document.getElementById("subcategoria");
  const subcategorias = new Set();

  productos.forEach(p => {
    if (categoria === "todas" || p.category === categoria) {
      if (p.subcategory) subcategorias.add(p.subcategory);
    }
  });

  subSelect.innerHTML = `<option value="todas">Todas</option>`;
  [...subcategorias].forEach(sub => {
    const opt = document.createElement("option");
    opt.value = sub;
    opt.textContent = sub;
    subSelect.appendChild(opt);
  });
}

/**
 * 📣 Cargar promoción activa desde backend
 */
async function cargarPromocionActiva() {
  try {
    const res = await fetch(API_PROMO);
    const data = await res.json();

    if (
      res.ok &&
      data?.message &&
      data.active &&
      isFechaEnRango(data.startDate, data.endDate)
    ) {
      const promoTexto = document.getElementById("promoTexto");
      const promoBanner = document.getElementById("promoBanner");

      promoTexto.textContent = data.message;
      promoBanner.style.display = "block";
      promoBanner.className = `promo-banner ${data.theme || "blue"}`;
    }
  } catch (err) {
    console.error("❌ Error al cargar promoción:", err);
  }
}

/**
 * 📅 Validar si fecha actual está dentro del rango de promoción
 */
function isFechaEnRango(start, end) {
  const hoy = new Date().toISOString().split("T")[0];
  return (!start || start <= hoy) && (!end || end >= hoy);
}

/**
 * 🔍 Mostrar imagen ampliada en modal
 */
function ampliarImagen(url) {
  const modal = document.createElement("div");
  modal.className = "modal-img";
  modal.innerHTML = `
    <div class="overlay" onclick="this.parentElement.remove()"></div>
    <img src="${url}" alt="Vista ampliada" />
    <span class="cerrar" onclick="this.parentElement.remove()">✖</span>
  `;
  document.body.appendChild(modal);
}

/**
 * 🌙 Alternar modo oscuro
 */
const toggleBtn = document.getElementById("modoToggle");
toggleBtn?.addEventListener("click", () => {
  document.body.classList.toggle("modo-oscuro");
  const oscuro = document.body.classList.contains("modo-oscuro");
  localStorage.setItem("modoOscuro", oscuro);
  toggleBtn.textContent = oscuro ? "☀️ Modo Claro" : "🌙 Modo Oscuro";
});

// 🌓 Restaurar preferencia modo oscuro al cargar
if (localStorage.getItem("modoOscuro") === "true") {
  document.body.classList.add("modo-oscuro");
  if (toggleBtn) toggleBtn.textContent = "☀️ Modo Claro";
}

// 🔁 Redirección manual a login
document.getElementById("loginRedirectBtn")?.addEventListener("click", () => {
  window.location.href = "login.html";
});

/**
 * 👁️ Registrar visita al cargar página
 */
async function registrarVisita() {
  try {
    await fetch(`${API_BASE}/visitas/registrar`, { method: "POST" });
  } catch (err) {
    console.warn("❌ Error registrando visita:", err);
  }
}
