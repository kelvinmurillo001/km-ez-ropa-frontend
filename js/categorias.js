"use strict";

// 📦 Configuraciones
const API_URL = "https://km-ez-ropa-backend.onrender.com/api/products";

// 🔄 Elementos del DOM
const contenedor = document.getElementById("contenedorProductos");
const filtroCategoria = document.getElementById("filtroCategoria");
const filtroSubcategoria = document.getElementById("filtroSubcategoria");
const filtroOrden = document.getElementById("filtroOrden");
const campoBusqueda = document.getElementById("busqueda");

// 🛒 Inicializar
document.addEventListener("DOMContentLoaded", async () => {
  try {
    const productos = await obtenerProductos();
    renderizarFiltros(productos);
    renderizarProductos(productos);
    updateCartWidget();

    // Eventos de filtros y búsqueda
    [filtroCategoria, filtroSubcategoria, filtroOrden, campoBusqueda].forEach(input =>
      input.addEventListener("input", () => renderizarProductos(productos))
    );
  } catch (err) {
    console.error("❌ Error al cargar productos:", err);
    contenedor.innerHTML = "<p>❌ Error al cargar productos. Intenta más tarde.</p>";
  }

  // Aplicar modo oscuro si está activado
  if (localStorage.getItem("modoOscuro") === "true") {
    document.body.classList.add("modo-oscuro");
  }

  // Toggle modo oscuro
  document.getElementById("modoToggle")?.addEventListener("click", () => {
    document.body.classList.toggle("modo-oscuro");
    localStorage.setItem("modoOscuro", document.body.classList.contains("modo-oscuro"));
  });
});

// 🔍 Obtener productos desde el backend
async function obtenerProductos() {
  const res = await fetch(API_URL);
  if (!res.ok) throw new Error("No se pudo obtener el catálogo.");
  return await res.json();
}

// 🎨 Renderizar filtros
function renderizarFiltros(productos) {
  const categorias = [...new Set(productos.map(p => p.category || "Sin categoría"))];
  const subcategorias = [...new Set(productos.map(p => p.subcategory || "Sin subcategoría"))];

  categorias.forEach(c => {
    const option = document.createElement("option");
    option.value = c;
    option.textContent = c;
    filtroCategoria.appendChild(option);
  });

  subcategorias.forEach(s => {
    const option = document.createElement("option");
    option.value = s;
    option.textContent = s;
    filtroSubcategoria.appendChild(option);
  });
}

// 🖼️ Renderizar productos en el DOM
function renderizarProductos(productos) {
  contenedor.innerHTML = "";
  const categoria = filtroCategoria.value;
  const subcategoria = filtroSubcategoria.value;
  const orden = filtroOrden.value;
  const busqueda = campoBusqueda.value.toLowerCase();

  let filtrados = productos.filter(p => {
    const nombre = p.nombre.toLowerCase();
    const coincideCategoria = !categoria || p.category === categoria;
    const coincideSubcategoria = !subcategoria || p.subcategory === subcategoria;
    const coincideBusqueda = nombre.includes(busqueda);

    return coincideCategoria && coincideSubcategoria && coincideBusqueda;
  });

  if (orden === "precio-asc") {
    filtrados.sort((a, b) => a.precio - b.precio);
  } else if (orden === "precio-desc") {
    filtrados.sort((a, b) => b.precio - a.precio);
  } else {
    filtrados.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  if (!filtrados.length) {
    contenedor.innerHTML = "<p style='text-align:center;'>🙁 No se encontraron productos.</p>";
    return;
  }

  filtrados.forEach(producto => contenedor.appendChild(crearTarjetaProducto(producto)));
}

// 🧱 Crear tarjeta HTML de producto
function crearTarjetaProducto(producto) {
  const div = document.createElement("div");
  div.className = "card fade-in";

  const esDestacado = producto.destacado;
  const stock = producto.stock || 0;

  div.innerHTML = `
    <img src="${producto.imagen || '/assets/logo.jpg'}" alt="${producto.nombre}" onerror="this.src='/assets/logo.jpg'">
    <h4>${producto.nombre}</h4>
    ${esDestacado ? `<p class="badge-destacado">⭐ Destacado</p>` : ""}
    <p><strong>Precio:</strong> $${producto.precio}</p>
    <p><strong>Categoría:</strong> ${producto.category}</p>
    <p><strong>Subcategoría:</strong> ${producto.subcategory}</p>
    <p><strong>Stock:</strong> ${stock}</p>
    <button class="btn-comprar" onclick='addToCart(${JSON.stringify(producto)})'>
      🛒 Agregar al carrito
    </button>
  `;

  return div;
}
