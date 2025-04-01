let productos = [];

// 🔗 API en producción (Render)
const API_BASE = "https://km-ez-ropa-backend.onrender.com/api";
const API_PROMO = `${API_BASE}/promos`;

// ▶️ Cargar productos al inicio
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

// 🎯 Aplicar filtros
function aplicarFiltros() {
  const termino = document.getElementById("busqueda").value.toLowerCase();
  const categoria = document.getElementById("categoria").value;
  const subcategoria = document.getElementById("subcategoria").value;
  const orden = document.getElementById("orden").value;

  let filtrados = [...productos];

  if (categoria !== "todas") {
    filtrados = filtrados.filter(
      (p) => p.categoria?.toLowerCase() === categoria.toLowerCase()
    );
  }

  if (subcategoria !== "todas") {
    filtrados = filtrados.filter(
      (p) => p.subcategoria?.toLowerCase() === subcategoria.toLowerCase()
    );
  }

  if (termino) {
    filtrados = filtrados.filter((p) =>
      p.nombre?.toLowerCase().includes(termino)
    );
  }

  switch (orden) {
    case "precioAsc":
      filtrados.sort((a, b) => a.precio - b.precio);
      break;
    case "precioDesc":
      filtrados.sort((a, b) => b.precio - a.precio);
      break;
    case "destacados":
      filtrados = filtrados.filter((p) => p.destacado);
      break;
    default:
      filtrados.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  mostrarProductos(filtrados);
}

// 🖼️ Mostrar productos
function mostrarProductos(lista) {
  const contenedor = document.getElementById("catalogo");
  contenedor.innerHTML = "";

  if (lista.length === 0) {
    contenedor.innerHTML =
      "<p class='mensaje-error'>😕 No hay productos que coincidan con tu búsqueda.</p>";
    return;
  }

  lista.forEach((producto) => {
    const imagen = producto.imagen || "../assets/logo.jpg";

    const card = document.createElement("div");
    card.classList.add("card", "fade-in");

    card.innerHTML = `
      <img src="${imagen}" alt="${producto.nombre}" class="zoomable" />
      <h3>${producto.nombre}</h3>
      ${producto.destacado ? '<span class="destacado-badge">⭐ Destacado</span>' : ""}
      <p><strong>Precio:</strong> $${producto.precio}</p>
      <p><strong>Categoría:</strong> ${producto.categoria}</p>
      <p><strong>Subcategoría:</strong> ${producto.subcategoria || "N/A"}</p>
      <p><strong>Stock:</strong> ${producto.stock}</p>
      <button onclick="agregarAlCarrito('${producto._id}')">🛒 Agregar al carrito</button>
    `;

    contenedor.appendChild(card);
  });
}

// 🔁 Subcategorías dinámicas
function cargarSubcategoriasUnicas() {
  const categoria = document.getElementById("categoria").value;
  const subSelect = document.getElementById("subcategoria");
  let subcategorias = new Set();

  productos.forEach((p) => {
    if (categoria === "todas" || p.categoria === categoria) {
      if (p.subcategoria) subcategorias.add(p.subcategoria);
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

// 🎁 Mostrar promoción activa
async function cargarPromocionActiva() {
  try {
    const res = await fetch(API_PROMO);
    const data = await res.json();

    if (res.ok && data?.activo && data.mensaje) {
      document.getElementById("promoTexto").textContent = data.mensaje;
      document.getElementById("promoBanner").style.display = "block";
    }
  } catch (err) {
    console.error("❌ Error al cargar promoción:", err);
  }
}

// 🌙 Modo oscuro con persistencia
const toggleBtn = document.getElementById("modoToggle");
toggleBtn?.addEventListener("click", () => {
  document.body.classList.toggle("modo-oscuro");
  const oscuro = document.body.classList.contains("modo-oscuro");
  localStorage.setItem("modoOscuro", oscuro ? "true" : "false");
  toggleBtn.textContent = oscuro ? "☀️ Modo Claro" : "🌙 Modo Oscuro";
});

// Aplicar al cargar
if (localStorage.getItem("modoOscuro") === "true") {
  document.body.classList.add("modo-oscuro");
  if (toggleBtn) toggleBtn.textContent = "☀️ Modo Claro";
}

// 🔐 Redirección login
const loginRedirectBtn = document.getElementById("loginRedirectBtn");
if (loginRedirectBtn) {
  loginRedirectBtn.addEventListener("click", () => {
    window.location.href = "login.html";
  });
}

// ▶️ Inicial
cargarProductos();
