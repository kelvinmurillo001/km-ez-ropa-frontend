"use strict";

const API_BASE = "https://km-ez-ropa-backend.onrender.com/api";
const API_PROMO = `${API_BASE}/promos`;
let productos = [];

document.addEventListener("DOMContentLoaded", () => {
  registrarVisita();
  cargarProductos();
  restaurarModoOscuro();
  inicializarBotones();
});

/* 📦 Carga inicial de productos y promociones */
async function cargarProductos() {
  try {
    const res = await fetch(`${API_BASE}/products`);
    productos = await res.json();

    if (!Array.isArray(productos)) throw new Error("Formato de productos inválido");

    aplicarFiltros();
    cargarSubcategoriasUnicas();
    cargarPromocionActiva();

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

/* 🔍 Filtros personalizados */
function aplicarFiltros() {
  const termino = document.getElementById("busqueda")?.value.toLowerCase() || "";
  const categoria = document.getElementById("categoria")?.value || "todas";
  const subcategoria = document.getElementById("subcategoria")?.value || "todas";
  const orden = document.getElementById("orden")?.value || "reciente";

  let filtrados = productos.filter(p => {
    return (
      (categoria === "todas" || p.category?.toLowerCase() === categoria.toLowerCase()) &&
      (subcategoria === "todas" || p.subcategory?.toLowerCase() === subcategoria.toLowerCase()) &&
      (!termino || p.name?.toLowerCase().includes(termino))
    );
  });

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

/* 🖼️ Mostrar productos en DOM */
function mostrarProductos(lista) {
  const contenedor = document.getElementById("catalogo");
  contenedor.innerHTML = "";

  if (!lista.length) {
    contenedor.innerHTML = "<p class='mensaje-error fade-in'>😕 No hay productos que coincidan.</p>";
    return;
  }

  lista.forEach(p => {
    const {
      _id,
      name,
      images = [],
      price,
      category,
      subcategory,
      stock,
      featured,
      talla,
      colores
    } = p;

    const agotado = stock <= 0;
    const primeraImagen = images?.[0]?.url || "/assets/logo.jpg";

    const card = document.createElement("div");
    card.className = "card fade-in";
    card.innerHTML = `
      <a href="detalle.html?id=${_id}">
        <div class="imagen-catalogo">
          <img src="${primeraImagen}" alt="${name}" class="zoomable" />
        </div>
        <h3>${name}</h3>
      </a>
      ${featured ? `<span class="destacado-badge">⭐ Destacado</span>` : ""}
      <p><strong>Precio:</strong> $${price}</p>
      <p><strong>Categoría:</strong> ${category}</p>
      <p><strong>Subcategoría:</strong> ${subcategory || "N/A"}</p>
      <p><strong>Stock:</strong> ${agotado ? "❌ Agotado" : stock}</p>
      <button ${agotado ? "disabled" : ""} onclick='addToCart(${JSON.stringify({
        id: _id,
        nombre: name,
        precio: price,
        imagen: primeraImagen,
        talla: talla || "",
        colores: colores || ""
      })})'>🛒 Agregar al carrito</button>
    `;
    contenedor.appendChild(card);
  });
}

/* 📂 Subcategorías dinámicas */
function cargarSubcategoriasUnicas() {
  const categoria = document.getElementById("categoria")?.value || "todas";
  const subSelect = document.getElementById("subcategoria");
  const subcategorias = new Set();

  productos.forEach(p => {
    if (categoria === "todas" || p.category === categoria) {
      if (p.subcategory) subcategorias.add(p.subcategory);
    }
  });

  subSelect.innerHTML = `<option value="todas">Subcategoría: Todas</option>`;
  [...subcategorias].forEach(sub => {
    const opt = document.createElement("option");
    opt.value = sub;
    opt.textContent = sub;
    subSelect.appendChild(opt);
  });
}

/* 📣 Mostrar promoción activa */
async function cargarPromocionActiva() {
  try {
    const res = await fetch(API_PROMO);
    const data = await res.json();

    if (res.ok && data?.message && data.active && isFechaEnRango(data.startDate, data.endDate)) {
      const banner = document.getElementById("promoBanner");
      const texto = document.getElementById("promoTexto");

      if (banner && texto) {
        texto.textContent = data.message;
        banner.style.display = "block";
        banner.className = `promo-banner fade-in ${data.theme || "blue"}`;
      }
    }
  } catch (err) {
    console.error("❌ Error al cargar promoción:", err);
  }
}

/* 📅 Validar si hoy está en rango */
function isFechaEnRango(start, end) {
  const hoy = new Date().toISOString().split("T")[0];
  return (!start || start <= hoy) && (!end || end >= hoy);
}

/* 🔍 Imagen en modal */
function ampliarImagen(url) {
  const modal = document.createElement("div");
  modal.className = "modal-img fade-in";
  modal.innerHTML = `
    <div class="overlay" onclick="this.parentElement.remove()"></div>
    <img src="${url}" alt="Vista ampliada" />
    <span class="cerrar" onclick="this.parentElement.remove()">✖</span>
  `;
  document.body.appendChild(modal);
}

/* 🌙 Restaurar modo oscuro */
function restaurarModoOscuro() {
  const oscuro = localStorage.getItem("modoOscuro") === "true";
  if (oscuro) {
    document.body.classList.add("modo-oscuro");
    const btn = document.getElementById("modoToggle");
    if (btn) btn.textContent = "☀️ Modo Claro";
  }
}

/* 🌘 Alternar tema */
function inicializarBotones() {
  const toggleBtn = document.getElementById("modoToggle");
  toggleBtn?.addEventListener("click", () => {
    document.body.classList.toggle("modo-oscuro");
    const oscuro = document.body.classList.contains("modo-oscuro");
    localStorage.setItem("modoOscuro", oscuro);
    toggleBtn.textContent = oscuro ? "☀️ Modo Claro" : "🌙 Modo Oscuro";
  });

  document.getElementById("loginRedirectBtn")?.addEventListener("click", () => {
    window.location.href = "login.html";
  });
}

/* 👁️ Registrar visita */
async function registrarVisita() {
  try {
    await fetch(`${API_BASE}/visitas/registrar`, { method: "POST" });
  } catch (err) {
    console.warn("❌ Error registrando visita:", err);
  }
}
