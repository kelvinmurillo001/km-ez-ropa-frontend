"use strict";

import { verificarSesion, goBack, mostrarMensaje } from "./admin-utils.js";
import { API_BASE } from "./config.js";

// 🔐 Token de sesión
const token = verificarSesion();

// 📦 API endpoints
const API_PRODUCTS = `${API_BASE}/api/products`;
const API_CATEGORIAS = `${API_BASE}/api/categories`;

// 🎯 Elementos DOM
const productosLista = document.getElementById("productosLista");
const inputBuscar = document.getElementById("buscarProducto");
const filtroCategoria = document.getElementById("filtroCategoria");
const filtroStock = document.getElementById("filtroStock");
const filtroDestacados = document.getElementById("filtroDestacados");
const contadorProductos = document.getElementById("contadorProductos");
const btnExportar = document.getElementById("btnExportar");
const paginacion = document.getElementById("paginacion");

// 🧮 Estado
let productosTodos = [];
let paginaActual = 1;
let totalPaginas = 1;
const productosPorPagina = 10;

// 🚀 Al cargar
document.addEventListener("DOMContentLoaded", async () => {
  inputBuscar?.addEventListener("input", () => {
    paginaActual = 1;
    cargarProductos();
  });

  filtroCategoria?.addEventListener("change", () => {
    paginaActual = 1;
    cargarProductos();
  });

  filtroStock?.addEventListener("change", renderizarProductos);
  filtroDestacados?.addEventListener("change", renderizarProductos);
  btnExportar?.addEventListener("click", exportarExcel);

  await cargarCategorias();
  await cargarProductos();

  if (localStorage.getItem("modoOscuro") === "true") {
    document.body.classList.add("modo-oscuro");
  }
});

/* ───────────────────────────────────────────── */
/* 📂 Cargar categorías                          */
/* ───────────────────────────────────────────── */
async function cargarCategorias() {
  try {
    const res = await fetch(API_CATEGORIAS, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = await res.json();
    if (!res.ok || !Array.isArray(data.data)) throw new Error(data.message);

    filtroCategoria.innerHTML = `<option value="">📂 Todas las categorías</option>`;
    data.data.forEach(cat => {
      const option = document.createElement("option");
      option.value = cat.name;
      option.textContent = `📁 ${sanitize(cat.name)}`;
      filtroCategoria.appendChild(option);
    });
  } catch (err) {
    console.warn("❌ Categorías:", err.message);
    mostrarMensaje("❌ Error al cargar categorías", "error");
  }
}

/* ───────────────────────────────────────────── */
/* 📦 Cargar productos de la API                 */
/* ───────────────────────────────────────────── */
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

    const res = await fetch(`${API_PRODUCTS}?${params}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message);

    productosTodos = Array.isArray(data.productos) ? data.productos : [];
    totalPaginas = data.totalPaginas || 1;

    if (!productosTodos.length) {
      productosLista.innerHTML = `<p class="text-center">📭 No se encontraron productos.</p>`;
      return;
    }

    renderizarProductos();
  } catch (err) {
    productosLista.innerHTML = `<p class="text-center text-danger">❌ ${sanitize(err.message)}</p>`;
  }
}

/* ───────────────────────────────────────────── */
/* 🖼️ Mostrar productos con filtros              */
/* ───────────────────────────────────────────── */
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
    productosLista.innerHTML = `<p class="text-center">📭 Sin resultados para los filtros aplicados.</p>`;
    paginacion.innerHTML = "";
    return;
  }

  productosLista.innerHTML = `
    <div class="tabla-scroll">
      <table class="tabla-admin fade-in productos-table" aria-label="Listado de productos">
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
/* 📄 Renderizar controles de paginación         */
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
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
    paginacion.appendChild(btn);
  }
}

/* ───────────────────────────────────────────── */
/* 🧾 Fila de producto en HTML                   */
/* ───────────────────────────────────────────── */
function productoFilaHTML(p) {
  const imagen = sanitize(p.image || p.images?.[0]?.url || "/assets/logo.jpg");
  const nombre = sanitize(p.name || "Sin nombre");
  const precio = isNaN(p.price) ? "0.00" : parseFloat(p.price).toFixed(2);
  const categoria = sanitize(p.category || "-");
  const stock = typeof p.stockTotal === "number" ? p.stockTotal : (p.stock ?? 0);
  const stockVisual = stock === 0 ? `<span class="stock-alert">Sin stock</span>` : stock;
  const claseStock = stock === 0 ? "sin-stock" : "";

  return `
    <tr class="${claseStock}">
      <td><img src="${imagen}" alt="${nombre}" class="producto-img" loading="lazy" /></td>
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

/* ───────────────────────────────────────────── */
/* ❌ Eliminar producto con confirmación         */
/* ───────────────────────────────────────────── */
async function eliminarProducto(id, nombre) {
  if (!confirm(`¿Eliminar "${nombre}"? Esta acción es irreversible.`)) return;

  try {
    const res = await fetch(`${API_PRODUCTS}/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message);

    mostrarMensaje(`✅ Producto "${nombre}" eliminado`, "success");
    await cargarProductos();
  } catch (err) {
    mostrarMensaje("❌ No se pudo eliminar el producto", "error");
  }
}

/* ───────────────────────────────────────────── */
/* 📤 Exportar productos a Excel                 */
/* ───────────────────────────────────────────── */
async function exportarExcel() {
  btnExportar.disabled = true;

  try {
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
  } catch (err) {
    mostrarMensaje("❌ Error al exportar", "error");
  } finally {
    btnExportar.disabled = false;
  }
}

/* ───────────────────────────────────────────── */
/* 🧼 Sanitización segura                        */
/* ───────────────────────────────────────────── */
function sanitize(text = "") {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// 🌍 Funciones globales expuestas
window.editarProducto = id => location.href = `/editar-producto.html?id=${id}`;
window.eliminarProducto = eliminarProducto;
