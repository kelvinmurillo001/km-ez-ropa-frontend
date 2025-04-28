"use strict";

// 📥 Importar utilidades
import { verificarSesion, goBack, mostrarMensaje } from "./admin-utils.js";
import { API_BASE } from "./config.js";

// 🔐 Verificación de sesión
const token = verificarSesion();
const API_PRODUCTS = `${API_BASE}/api/products`;

// 🌐 Elementos del DOM
const productosLista = document.getElementById("productosLista");
const btnNuevoProducto = document.getElementById("btnNuevoProducto");
const inputBuscar = document.getElementById("buscarProducto");
const filtroCategoria = document.getElementById("filtroCategoria");
const contadorProductos = document.getElementById("contadorProductos");
const btnExportar = document.getElementById("btnExportar");
const filtroStock = document.getElementById("filtroStock");
const filtroDestacados = document.getElementById("filtroDestacados");
const paginacion = document.getElementById("paginacion");

// 🔢 Variables de paginación
let productosTodos = [];
let paginaActual = 1;
let totalPaginas = 1;
const productosPorPagina = 10;

// ▶️ Al cargar el DOM
document.addEventListener("DOMContentLoaded", () => {
  btnNuevoProducto?.addEventListener("click", () => window.location.href = "/crear-producto.html");
  inputBuscar?.addEventListener("input", () => { paginaActual = 1; cargarProductos(); });
  filtroCategoria?.addEventListener("change", () => { paginaActual = 1; cargarProductos(); });
  filtroStock?.addEventListener("change", renderizarProductos);
  filtroDestacados?.addEventListener("change", renderizarProductos);
  btnExportar?.addEventListener("click", exportarExcel);

  cargarProductos();

  if (localStorage.getItem("modoOscuro") === "true") {
    document.body.classList.add("modo-oscuro");
  }
});

/* ───────────────────────────────────────────── */
/* 📡 Cargar productos desde la API               */
/* ───────────────────────────────────────────── */
async function cargarProductos() {
  productosLista.innerHTML = `<p class="text-center">⏳ Cargando productos...</p>`;
  contadorProductos.textContent = "";

  try {
    const nombre = inputBuscar?.value?.trim() || "";
    const categoria = filtroCategoria?.value || "";

    const params = new URLSearchParams();
    if (nombre) params.append("nombre", nombre);
    if (categoria) params.append("categoria", categoria);
    params.append("pagina", paginaActual);
    params.append("limite", productosPorPagina);

    const res = await fetch(`${API_PRODUCTS}?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Error al obtener productos");

    productosTodos = Array.isArray(data.productos) ? data.productos : [];
    totalPaginas = data.totalPaginas || 1;

    if (!productosTodos.length) {
      productosLista.innerHTML = "<p class='text-center'>📭 No se encontraron productos.</p>";
      contadorProductos.textContent = "";
      paginacion.innerHTML = "";
      return;
    }

    renderizarProductos();
  } catch (err) {
    console.error("❌", err);
    productosLista.innerHTML = `<p class='text-center' style='color:red;'>❌ ${err.message}</p>`;
  }
}

/* ───────────────────────────────────────────── */
/* 🧮 Renderizar productos filtrados              */
/* ───────────────────────────────────────────── */
function renderizarProductos() {
  let filtrados = [...productosTodos];

  if (filtroStock?.value === "sinStock") {
    filtrados = filtrados.filter(p => {
      const total = p.variants?.reduce((a, v) => a + (v.stock || 0), 0) || p.stock || 0;
      return total === 0;
    });
  }

  if (filtroDestacados?.checked) {
    filtrados = filtrados.filter(p => p.featured);
  }

  contadorProductos.textContent = `Mostrando ${filtrados.length} producto(s) en página ${paginaActual} de ${totalPaginas}`;

  if (!filtrados.length) {
    productosLista.innerHTML = "<p class='text-center'>📭 Sin resultados.</p>";
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

/* ───────────────────────────────────────────── */
/* 🔢 Renderizar botones de paginación            */
/* ───────────────────────────────────────────── */
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

/* ───────────────────────────────────────────── */
/* 🧾 HTML por cada fila de producto              */
/* ───────────────────────────────────────────── */
function productoFilaHTML(p) {
  const imagen = p.image || p.images?.[0]?.url || "/assets/logo.jpg";
  const nombre = sanitize(p.name || "Sin nombre");
  const precio = isNaN(p.price) ? "0.00" : parseFloat(p.price).toFixed(2);
  const categoria = sanitize(p.category || "-");

  let stock = 0;
  if (Array.isArray(p.variants) && p.variants.length > 0) {
    stock = p.variants.reduce((a, v) => a + (v.stock || 0), 0);
  } else if (typeof p.stock === "number") {
    stock = p.stock;
  }

  const claseStock = stock === 0 ? "sin-stock" : "";

  return `
    <tr class="${claseStock}">
      <td><img src="${imagen}" alt="${nombre}" class="producto-img" /></td>
      <td>${nombre}</td>
      <td>$${precio}</td>
      <td>${stock}</td>
      <td>${categoria}</td>
      <td>
        <button class="btn-tabla editar" onclick="editarProducto('${p._id}')">✏️</button>
        <button class="btn-tabla eliminar" onclick="eliminarProducto('${p._id}', '${nombre}')">🗑️</button>
      </td>
    </tr>`;
}

/* ───────────────────────────────────────────── */
/* 🗑️ Eliminar producto                          */
/* ───────────────────────────────────────────── */
async function eliminarProducto(id, nombre) {
  if (!confirm(`¿Eliminar "${nombre}"?`)) return;

  try {
    const res = await fetch(`${API_PRODUCTS}/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Error al eliminar");

    mostrarMensaje(`✅ "${nombre}" eliminado`, "success");
    await cargarProductos();
  } catch (err) {
    console.error("❌", err);
    mostrarMensaje("❌ No se pudo eliminar", "error");
  }
}

/* ───────────────────────────────────────────── */
/* 📤 Exportar productos a Excel                  */
/* ───────────────────────────────────────────── */
async function exportarExcel() {
  const { utils, writeFile } = await import("https://cdn.sheetjs.com/xlsx-0.20.0/package/xlsx.mjs");

  const hoja = productosTodos.map(p => ({
    ID: p._id,
    Nombre: p.name,
    Precio: p.price,
    Stock: (p.stock ?? p.variants?.reduce((a, v) => a + (v.stock || 0), 0)) || 0,
    Categoría: p.category,
    Destacado: p.featured ? "Sí" : "No"
  }));

  const ws = utils.json_to_sheet(hoja);
  const wb = utils.book_new();
  utils.book_append_sheet(wb, ws, "Inventario");
  writeFile(wb, `inventario_kmezropa_${Date.now()}.xlsx`);
}

/* ───────────────────────────────────────────── */
/* 🔐 Sanitizar texto para evitar XSS             */
/* ───────────────────────────────────────────── */
function sanitize(text = "") {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

/* ───────────────────────────────────────────── */
/* 🌐 Funciones Globales                         */
/* ───────────────────────────────────────────── */
window.goBack = goBack;
window.editarProducto = id => window.location.href = `/editar-producto.html?id=${id}`;
window.eliminarProducto = eliminarProducto;
