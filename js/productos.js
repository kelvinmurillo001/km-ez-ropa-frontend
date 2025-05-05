"use strict";

import { verificarSesion, goBack, mostrarMensaje } from "./admin-utils.js";
import { API_BASE } from "./config.js";

// 🔐 Validar sesión admin
const token = verificarSesion();

// 🔗 API endpoints
const API_PRODUCTS = `${API_BASE}/api/products`;
const API_CATEGORIAS = `${API_BASE}/api/categories`;

// 🌐 DOM elements
const productosLista = document.getElementById("productosLista");
const btnNuevoProducto = document.getElementById("btnNuevoProducto");
const inputBuscar = document.getElementById("buscarProducto");
const filtroCategoria = document.getElementById("filtroCategoria");
const filtroStock = document.getElementById("filtroStock");
const filtroDestacados = document.getElementById("filtroDestacados");
const contadorProductos = document.getElementById("contadorProductos");
const btnExportar = document.getElementById("btnExportar");
const paginacion = document.getElementById("paginacion");

// 📊 Estado global
let productosTodos = [];
let paginaActual = 1;
let totalPaginas = 1;
const productosPorPagina = 10;

// ▶️ Inicialización
document.addEventListener("DOMContentLoaded", async () => {
  btnNuevoProducto?.addEventListener("click", () => location.href = "/crear-producto.html");
  inputBuscar?.addEventListener("input", () => { paginaActual = 1; cargarProductos(); });
  filtroCategoria?.addEventListener("change", () => { paginaActual = 1; cargarProductos(); });
  filtroStock?.addEventListener("change", renderizarProductos);
  filtroDestacados?.addEventListener("change", renderizarProductos);
  btnExportar?.addEventListener("click", exportarExcel);

  await cargarCategorias();
  await cargarProductos();

  if (localStorage.getItem("modoOscuro") === "true") {
    document.body.classList.add("modo-oscuro");
  }
});

// 🗂️ Cargar categorías para filtro
async function cargarCategorias() {
  try {
    const res = await fetch(API_CATEGORIAS, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();

    if (!res.ok || !data.ok || !Array.isArray(data.data)) throw new Error(data.message);

    filtroCategoria.innerHTML = `<option value="">📂 Todas las categorías</option>`;
    data.data.forEach(cat => {
      const option = document.createElement("option");
      option.value = cat.name;
      option.textContent = `📁 ${sanitize(cat.name)}`;
      filtroCategoria.appendChild(option);
    });
  } catch (err) {
    console.warn("❌ Error cargando categorías:", err.message);
  }
}

// 📦 Obtener productos desde la API
async function cargarProductos() {
  productosLista.innerHTML = `<p class="text-center">⏳ Cargando productos...</p>`;
  contadorProductos.textContent = "";
  paginacion.innerHTML = "";

  try {
    const params = new URLSearchParams();
    if (inputBuscar?.value) params.append("nombre", inputBuscar.value.trim());
    if (filtroCategoria?.value) params.append("categoria", filtroCategoria.value);
    params.append("pagina", paginaActual);
    params.append("limite", productosPorPagina);

    const res = await fetch(`${API_PRODUCTS}?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message);

    productosTodos = Array.isArray(data.productos) ? data.productos : [];
    totalPaginas = data.totalPaginas || 1;

    if (!productosTodos.length) {
      productosLista.innerHTML = "<p class='text-center'>📭 No se encontraron productos.</p>";
      return;
    }

    renderizarProductos();
  } catch (err) {
    productosLista.innerHTML = `<p class="text-center" style="color:red;">❌ ${err.message}</p>`;
  }
}

// 🧾 Mostrar tabla de productos
function renderizarProductos() {
  let filtrados = [...productosTodos];

  if (filtroStock?.value === "sinStock") {
    filtrados = filtrados.filter(p => (typeof p.stockTotal === "number" ? p.stockTotal : (p.stock ?? 0)) === 0);
  }

  if (filtroDestacados?.checked) {
    filtrados = filtrados.filter(p => p.featured);
  }

  contadorProductos.textContent = `Mostrando ${filtrados.length} producto(s) en página ${paginaActual} de ${totalPaginas}`;

  if (!filtrados.length) {
    productosLista.innerHTML = "<p class='text-center'>📭 Sin resultados para los filtros aplicados.</p>";
    paginacion.innerHTML = "";
    return;
  }

  productosLista.innerHTML = `
    <div class="tabla-scroll">
      <table class="tabla-admin fade-in productos-table">
        <thead>
          <tr>
            <th>Imagen</th>
            <th>Nombre</th>
            <th>Precio</th>
            <th>Stock</th>
            <th>Categoría</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>${filtrados.map(productoFilaHTML).join("")}</tbody>
      </table>
    </div>`;

  renderPaginacion();
}

// 🔁 Paginación
function renderPaginacion() {
  paginacion.innerHTML = "";
  if (totalPaginas <= 1) return;

  for (let i = 1; i <= totalPaginas; i++) {
    const btn = document.createElement("button");
    btn.textContent = i;
    btn.className = i === paginaActual ? "btn paginacion-activa" : "btn-secundario";
    btn.addEventListener("click", () => {
      paginaActual = i;
      cargarProductos();
    });
    paginacion.appendChild(btn);
  }
}

// 🧱 Generar fila HTML
function productoFilaHTML(p) {
  const imagen = p.image || p.images?.[0]?.url || "/assets/logo.jpg";
  const nombre = sanitize(p.name || "Sin nombre");
  const precio = isNaN(p.price) ? "0.00" : parseFloat(p.price).toFixed(2);
  const categoria = sanitize(p.category || "-");
  const stock = typeof p.stockTotal === "number" ? p.stockTotal : (p.stock ?? 0);
  const claseStock = stock === 0 ? "sin-stock" : "";
  const stockVisual = stock === 0 ? `<span class="stock-alert">Sin stock</span>` : stock;

  return `
    <tr class="${claseStock}">
      <td><img src="${imagen}" alt="${nombre}" class="producto-img" /></td>
      <td>${nombre} ${stock === 0 ? '⚠️' : ''}</td>
      <td>$${precio}</td>
      <td>${stockVisual}</td>
      <td>${categoria}</td>
      <td>
        <button class="btn-tabla editar" onclick="editarProducto('${p._id}')">✏️</button>
        <button class="btn-tabla eliminar" onclick="eliminarProducto('${p._id}', '${nombre}')">🗑️</button>
      </td>
    </tr>`;
}

// ❌ Eliminar producto
async function eliminarProducto(id, nombre) {
  if (!confirm(`¿Eliminar "${nombre}"?`)) return;

  try {
    const res = await fetch(`${API_PRODUCTS}/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message);

    mostrarMensaje(`✅ "${nombre}" eliminado`, "success");
    await cargarProductos();
  } catch (err) {
    mostrarMensaje("❌ No se pudo eliminar", "error");
  }
}

// 📤 Exportar a Excel
async function exportarExcel() {
  const { utils, writeFile } = await import("https://cdn.sheetjs.com/xlsx-0.20.0/package/xlsx.mjs");

  const hoja = productosTodos.map(p => ({
    ID: p._id,
    Nombre: p.name,
    Precio: p.price,
    Stock: typeof p.stockTotal === "number" ? p.stockTotal : (p.stock ?? 0),
    Categoría: p.category,
    Destacado: p.featured ? "Sí" : "No"
  }));

  const ws = utils.json_to_sheet(hoja);
  const wb = utils.book_new();
  utils.book_append_sheet(wb, ws, "Inventario");
  writeFile(wb, `inventario_kmezropa_${Date.now()}.xlsx`);
}

// 🧼 Sanitizar
function sanitize(text = "") {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// 🌐 Funciones globales
window.goBack = goBack;
window.editarProducto = id => window.location.href = `/editar-producto.html?id=${id}`;
window.eliminarProducto = eliminarProducto;
