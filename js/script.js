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

/* 📦 Cargar productos */
async function cargarProductos() {
  try {
    const res = await fetch(`${API_BASE}/products`);
    if (!res.ok) throw new Error(`Error ${res.status} al obtener productos`);

    productos = await res.json();
    console.log("✅ Productos recibidos:", productos);

    if (!Array.isArray(productos)) throw new Error("Formato inválido en productos");

    const catalogo = document.getElementById("catalogo");
    if (!catalogo) throw new Error("Elemento #catalogo no encontrado");

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
    const catalogo = document.getElementById("catalogo");
    if (catalogo) {
      catalogo.innerHTML = "<p class='mensaje-error'>❌ No se pudieron cargar los productos.</p>";
    }
  }
}

/* 🔍 Filtros */
function aplicarFiltros() {
  const termino = (document.getElementById("busqueda")?.value || "")
    .trim().toLowerCase().replace(/[^\w\s]/gi, "");

  const categoria = (document.getElementById("categoria")?.value || "todas").toLowerCase();
  const subcategoria = (document.getElementById("subcategoria")?.value || "todas").toLowerCase();
  const orden = document.getElementById("orden")?.value || "reciente";

  let filtrados = productos.filter(p => {
    const valido = typeof p.name === "string" &&
                   typeof p.price === "number" &&
                   Array.isArray(p.images) &&
                   p.images.length > 0 &&
                   typeof p.images[0]?.url === "string";

    if (!valido) {
      console.warn("⚠️ Producto omitido por estructura inválida:", p);
      return false;
    }

    return (
      (categoria === "todas" || p.category?.toLowerCase() === categoria) &&
      (subcategoria === "todas" || p.subcategory?.toLowerCase() === subcategoria) &&
      (!termino || p.name.toLowerCase().includes(termino))
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

/* 🖼️ Renderizado */
function mostrarProductos(lista) {
  const contenedor = document.getElementById("catalogo");
  contenedor.innerHTML = "";

  if (!lista.length) {
    contenedor.innerHTML = `
      <div class="fade-in mensaje-error">
        <h3>😕 Sin resultados</h3>
        <p>Intenta cambiar los filtros o escribir otro término.</p>
      </div>`;
    return;
  }

  lista.forEach(p => {
    const {
      _id, name, price, stock,
      images = [], category = "N/A",
      subcategory = "N/A", featured, talla, colores
    } = p;

    const agotado = !stock || stock <= 0;
    const imagen = images[0]?.url || "/assets/logo.jpg";
    const encoded = encodeURIComponent(_id);

    const card = document.createElement("div");
    card.className = "card fade-in";

    card.innerHTML = `
      <a href="detalle.html?id=${encoded}" class="enlace-producto" aria-label="Ver detalles de ${name}">
        <div class="imagen-catalogo">
          <img 
            src="${imagen}" 
            alt="${name}" 
            class="zoomable" 
            loading="lazy"
            onerror="this.src='/assets/logo.jpg'" />
        </div>
        <h3>${name}</h3>
      </a>

      ${featured ? `<span class="destacado-badge">⭐ Destacado</span>` : ""}
      <p><strong>Precio:</strong> $${price.toFixed(2)}</p>
      <p><strong>Categoría:</strong> ${category}</p>
      <p><strong>Subcategoría:</strong> ${subcategory}</p>
      <p><strong>Stock:</strong> ${agotado ? "❌ Agotado" : stock}</p>

      <button ${agotado ? "disabled" : ""} onclick='addToCart(${JSON.stringify({
        id: _id, nombre: name, precio: price, imagen, talla: talla || "", color: colores || ""
      })})' aria-label="Agregar ${name} al carrito">🛒 Agregar al carrito</button>
    `;

    contenedor.appendChild(card);
  });
}

/* 📂 Subcategorías dinámicas */
function cargarSubcategoriasUnicas() {
  const categoria = (document.getElementById("categoria")?.value || "todas").toLowerCase();
  const subSelect = document.getElementById("subcategoria");
  const subcategorias = new Set();

  productos.forEach(p => {
    if ((categoria === "todas" || p.category?.toLowerCase() === categoria) && p.subcategory) {
      subcategorias.add(p.subcategory);
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

/* 📣 Promoción activa */
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

/* 📅 Fecha válida */
function isFechaEnRango(start, end) {
  const hoy = new Date().toISOString().split("T")[0];
  return (!start || start <= hoy) && (!end || end >= hoy);
}

/* 🌗 Modo oscuro */
function restaurarModoOscuro() {
  const oscuro = localStorage.getItem("modoOscuro") === "true";
  if (oscuro) {
    document.body.classList.add("modo-oscuro");
    const btn = document.getElementById("modoToggle");
    if (btn) btn.textContent = "☀️ Modo Claro";
  }
}

/* ☀️ Botones */
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
