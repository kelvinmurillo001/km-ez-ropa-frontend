"use strict";

import { verificarSesion, goBack, mostrarMensaje } from "./admin-utils.js";
import { API_BASE } from "./config.js";

const token = verificarSesion();
const API_PRODUCTS = `${API_BASE}/api/products`;

const productosLista = document.getElementById("productosLista");
const btnNuevoProducto = document.getElementById("btnNuevoProducto");

document.addEventListener("DOMContentLoaded", () => {
  btnNuevoProducto?.addEventListener("click", () => {
    window.location.href = "/crear-producto.html";
  });

  cargarProductos();

  if (localStorage.getItem("modoOscuro") === "true") {
    document.body.classList.add("modo-oscuro");
  }
});

/**
 * 🚀 Cargar todos los productos del backend
 */
async function cargarProductos() {
  productosLista.innerHTML = `<p class='text-center'>⏳ Cargando productos...</p>`;

  try {
    const res = await fetch(API_PRODUCTS, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const productos = await res.json();

    if (!res.ok) throw new Error(productos.message || "Error al obtener productos");

    if (!Array.isArray(productos) || productos.length === 0) {
      productosLista.innerHTML = "<p class='text-center'>📭 No hay productos aún.</p>";
      return;
    }

    renderizarProductos(productos);

  } catch (err) {
    console.error("❌ Error al cargar productos:", err);
    productosLista.innerHTML = `<p class="text-center" style="color:red;">❌ Error al cargar productos.</p>`;
  }
}

/**
 * 🖼️ Renderiza una tabla con todos los productos
 */
function renderizarProductos(productos) {
  const filas = productos.map(p => {
    const imagen = p.image || p.images?.[0]?.url || "/assets/logo.jpg";
    const nombre = sanitize(p.name || "Producto sin nombre");
    const precio = isNaN(p.price) ? "0.00" : parseFloat(p.price).toFixed(2);
    const categoria = sanitize(p.category || "-");
    const stock = isNaN(p.stock) ? 0 : p.stock;

    return `
      <tr>
        <td><img src="${imagen}" alt="${nombre}" class="producto-img" onerror="this.src='/assets/logo.jpg'" /></td>
        <td>${nombre}</td>
        <td>$${precio}</td>
        <td>${stock}</td>
        <td>${categoria}</td>
        <td>
          <button class="btn-tabla editar" onclick="editarProducto('${p._id}')">✏️</button>
          <button class="btn-tabla eliminar" onclick="eliminarProducto('${p._id}', '${nombre}')">🗑️</button>
        </td>
      </tr>`;
  }).join("");

  productosLista.innerHTML = `
    <div class="tabla-scroll">
      <table class="tabla-admin fade-in">
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
 * 🔧 Redirigir a la edición de producto
 */
function editarProducto(id) {
  window.location.href = `/editar-producto.html?id=${id}`;
}

/**
 * 🗑️ Eliminar producto de forma segura
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

// 🧼 Sanitización básica para prevenir XSS o errores visuales
function sanitize(text) {
  const temp = document.createElement("div");
  temp.textContent = text;
  return temp.innerHTML;
}

// 🌐 Funciones globales
window.goBack = goBack;
window.editarProducto = editarProducto;
window.eliminarProducto = eliminarProducto;
