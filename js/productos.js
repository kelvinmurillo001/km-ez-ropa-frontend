"use strict";

import { verificarSesion, goBack, mostrarMensaje } from "./admin-utils.js";
import { API_BASE } from "./config.js";

// 🔐 Validación de sesión
const token = verificarSesion();

// 🌐 Endpoints
const API_PRODUCTS = `${API_BASE}/api/products`;

// 📍 DOM Elements
const productosLista = document.getElementById("productosLista");
const btnNuevoProducto = document.getElementById("btnNuevoProducto");
const inputBuscar = document.getElementById("buscarProducto");
const filtroCategoria = document.getElementById("filtroCategoria");
const contadorProductos = document.getElementById("contadorProductos");

document.addEventListener("DOMContentLoaded", () => {
  btnNuevoProducto?.addEventListener("click", () => {
    window.location.href = "/crear-producto.html";
  });

  cargarProductos();

  inputBuscar?.addEventListener("input", () => {
    cargarProductos();
  });

  filtroCategoria?.addEventListener("change", () => {
    cargarProductos();
  });

  if (localStorage.getItem("modoOscuro") === "true") {
    document.body.classList.add("modo-oscuro");
  }
});

/**
 * 🚀 Obtener productos desde el backend
 */
async function cargarProductos() {
  productosLista.innerHTML = `<p class='text-center'>⏳ Cargando productos...</p>`;
  if (contadorProductos) contadorProductos.textContent = "";

  try {
    const nombre = inputBuscar?.value?.trim() || "";
    const categoria = filtroCategoria?.value || "";

    const params = new URLSearchParams();
    if (nombre) params.append("nombre", nombre);
    if (categoria) params.append("categoria", categoria);

    const res = await fetch(`${API_PRODUCTS}?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const productos = await res.json();

    if (!res.ok) throw new Error(productos.message || "Error al obtener productos");

    if (!Array.isArray(productos) || productos.length === 0) {
      productosLista.innerHTML = "<p class='text-center'>📭 No se encontraron productos.</p>";
      return;
    }

    // 🧮 Mostrar contador de productos encontrados
    if (contadorProductos) {
      contadorProductos.textContent = `Mostrando ${productos.length} producto(s)`;
    }

    renderizarProductos(productos);

  } catch (err) {
    console.error("❌ Error al cargar productos:", err);
    productosLista.innerHTML = `<p class="text-center" style="color:red;">❌ ${err.message}</p>`;
  }
}

/**
 * 🧾 Renderizar tabla de productos
 */
function renderizarProductos(productos) {
  productos.sort((a, b) => a.name.localeCompare(b.name));

  const filas = productos.map(p => {
    const imagen = p.image || p.images?.[0]?.url || "/assets/logo.jpg";
    const nombre = sanitize(p.name || "Producto sin nombre");
    const precio = isNaN(p.price) ? "0.00" : parseFloat(p.price).toFixed(2);
    const categoria = sanitize(p.category || "-");

    // 🔄 Calcular stock total: si tiene variants, sumar, si no, usar p.stock
    const stockTotal = Array.isArray(p.variants) && p.variants.length > 0
      ? p.variants.reduce((acc, v) => acc + (v.stock || 0), 0)
      : (typeof p.stock === "number" ? p.stock : 0);

    const claseSinStock = stockTotal === 0 ? "sin-stock" : "";

    return `
      <tr class="${claseSinStock}">
        <td><img src="${imagen}" alt="${nombre}" class="producto-img" onerror="this.src='/assets/logo.jpg'" /></td>
        <td>${nombre}</td>
        <td>$${precio}</td>
        <td>${stockTotal}</td>
        <td>${categoria}</td>
        <td>
          <button class="btn-tabla editar" onclick="editarProducto('${p._id}')">✏️</button>
          <button class="btn-tabla eliminar" onclick="eliminarProducto('${p._id}', '${nombre}')">🗑️</button>
        </td>
      </tr>`;
  }).join("");

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
        <tbody>${filas}</tbody>
      </table>
    </div>`;
}

/**
 * ✏️ Editar producto
 */
function editarProducto(id) {
  window.location.href = `/editar-producto.html?id=${id}`;
}

/**
 * ❌ Eliminar producto
 */
async function eliminarProducto(id, nombre = "") {
  const confirmar = confirm(`⚠️ ¿Eliminar el producto "${nombre}"?`);
  if (!confirmar) return;

  try {
    const res = await fetch(`${API_PRODUCTS}/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "No se pudo eliminar");

    mostrarMensaje(`✅ Producto "${nombre}" eliminado correctamente`, "success");
    await cargarProductos();

  } catch (err) {
    console.error("❌ Error eliminando producto:", err);
    mostrarMensaje("❌ No se pudo eliminar", "error");
  }
}

/**
 * 🔒 Limpieza básica HTML
 */
function sanitize(text) {
  const temp = document.createElement("div");
  temp.textContent = text;
  return temp.innerHTML;
}

// 🌐 Funciones globales
window.goBack = goBack;
window.editarProducto = editarProducto;
window.eliminarProducto = eliminarProducto;
