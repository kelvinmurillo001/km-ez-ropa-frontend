let productos = [];

const API_BASE = "https://km-ez-ropa-backend.onrender.com/api";
const API_PROMO = `${API_BASE}/promos`;

async function cargarProductos() {
  try {
    const res = await fetch(`${API_BASE}/products`);
    productos = await res.json();

    aplicarFiltros();
    cargarSubcategoriasUnicas();
    cargarPromocionActiva();

    document.getElementById("busqueda").addEventListener("input", aplicarFiltros);
    document.getElementById("categoria").addEventListener("change", () => {
      cargarSubcategoriasUnicas();
      aplicarFiltros();
    });
    document.getElementById("subcategoria").addEventListener("change", aplicarFiltros);
    document.getElementById("orden").addEventListener("change", aplicarFiltros);
  } catch (error) {
    console.error("❌ Error al cargar productos:", error);
    document.getElementById("catalogo").innerHTML =
      "<p class='mensaje-error'>❌ Error al cargar productos</p>";
  }
}

function aplicarFiltros() {
  const termino = document.getElementById("busqueda").value.toLowerCase();
  const categoria = document.getElementById("categoria").value;
  const subcategoria = document.getElementById("subcategoria").value;
  const orden = document.getElementById("orden").value;

  let filtrados = [...productos];

  if (categoria !== "todas") {
    filtrados = filtrados.filter(
      (p) => p.category?.toLowerCase() === categoria.toLowerCase()
    );
  }

  if (subcategoria !== "todas") {
    filtrados = filtrados.filter(
      (p) => p.subcategory?.toLowerCase() === subcategoria.toLowerCase()
    );
  }

  if (termino) {
    filtrados = filtrados.filter((p) =>
      p.name?.toLowerCase().includes(termino)
    );
  }

  switch (orden) {
    case "precioAsc":
      filtrados.sort((a, b) => a.price - b.price);
      break;
    case "precioDesc":
      filtrados.sort((a, b) => b.price - a.price);
      break;
    case "destacados":
      filtrados = filtrados.filter((p) => p.featured);
      break;
    default:
      filtrados.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  mostrarProductos(filtrados);
}

function mostrarProductos(lista) {
  const contenedor = document.getElementById("catalogo");
  contenedor.innerHTML = "";

  if (lista.length === 0) {
    contenedor.innerHTML =
      "<p class='mensaje-error'>😕 No hay productos que coincidan con tu búsqueda.</p>";
    return;
  }

  lista.forEach((producto) => {
    const imagen = producto.image || "../assets/logo.jpg";

    const card = document.createElement("div");
    card.classList.add("card", "fade-in");

    card.innerHTML = `
      <div class="imagen-catalogo" onclick="ampliarImagen('${imagen}')">
        <img src="${imagen}" alt="${producto.name}" class="zoomable" />
      </div>
      <h3>${producto.name}</h3>
      ${producto.featured ? '<span class="destacado-badge">⭐ Destacado</span>' : ""}
      <p><strong>Precio:</strong> $${producto.price}</p>
      <p><strong>Categoría:</strong> ${producto.category}</p>
      <p><strong>Subcategoría:</strong> ${producto.subcategory || "N/A"}</p>
      <p><strong>Stock:</strong> ${producto.stock > 0 ? producto.stock : "❌ Agotado"}</p>
      <button ${producto.stock <= 0 ? "disabled" : ""} onclick='addToCart(${JSON.stringify({
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

function cargarSubcategoriasUnicas() {
  const categoria = document.getElementById("categoria").value;
  const subSelect = document.getElementById("subcategoria");
  let subcategorias = new Set();

  productos.forEach((p) => {
    if (categoria === "todas" || p.category === categoria) {
      if (p.subcategory) subcategorias.add(p.subcategory);
    }
  });

  subSelect.innerHTML = `<option value="todas">Todas</option>`;
  [...subcategorias].forEach((sub) => {
    const option = document.createElement("option");
    option.value = sub;
    option.textContent = sub;
    subSelect.appendChild(option);
  });
}

// 📣 Cargar y mostrar promoción activa con validación de fechas
async function cargarPromocionActiva() {
  try {
    const res = await fetch(API_PROMO);
    const data = await res.json();

    if (res.ok && data?.message && data.active && isFechaEnRango(data.startDate, data.endDate)) {
      const promoTexto = document.getElementById("promoTexto");
      const promoBanner = document.getElementById("promoBanner");
      if (promoTexto && promoBanner) {
        promoTexto.textContent = data.message;
        promoBanner.style.display = "block";
        promoBanner.className = `promo-banner ${data.theme || "blue"}`;
      }
    }
  } catch (err) {
    console.error("❌ Error al cargar promoción:", err);
  }
}

// 📅 Validación de fechas para promociones
function isFechaEnRango(start, end) {
  const today = new Date().toISOString().split("T")[0];
  return (!start || start <= today) && (!end || end >= today);
}

// 🖼️ Modal para ampliar imagen
function ampliarImagen(url) {
  const modal = document.createElement("div");
  modal.classList.add("modal-img");
  modal.innerHTML = `
    <div class="overlay" onclick="this.parentElement.remove()"></div>
    <img src="${url}" alt="Ampliada" />
    <span class="cerrar" onclick="this.parentElement.remove()">✖</span>
  `;
  document.body.appendChild(modal);
}

// 🌙 Modo oscuro
const toggleBtn = document.getElementById("modoToggle");
toggleBtn?.addEventListener("click", () => {
  document.body.classList.toggle("modo-oscuro");
  const oscuro = document.body.classList.contains("modo-oscuro");
  localStorage.setItem("modoOscuro", oscuro ? "true" : "false");
  toggleBtn.textContent = oscuro ? "☀️ Modo Claro" : "🌙 Modo Oscuro";
});

if (localStorage.getItem("modoOscuro") === "true") {
  document.body.classList.add("modo-oscuro");
  if (toggleBtn) toggleBtn.textContent = "☀️ Modo Claro";
}

// ⛔ Redirección al login si no hay sesión
const loginRedirectBtn = document.getElementById("loginRedirectBtn");
loginRedirectBtn?.addEventListener("click", () => {
  window.location.href = "login.html";
});

// 👁️ Registrar visita
async function registrarVisita() {
  try {
    await fetch(`${API_BASE}/visitas/registrar`, {
      method: "POST"
    });
  } catch (err) {
    console.warn("❌ Error registrando visita:", err);
  }
}

// ▶️ Inicial
registrarVisita();
cargarProductos();
