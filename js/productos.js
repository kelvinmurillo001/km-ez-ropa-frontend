"use strict";

import { verificarSesion, goBack, mostrarMensaje } from "./admin-utils.js";

const token = verificarSesion();

const API_BASE = "https://km-ez-ropa-backend.onrender.com/api/products";
const productosLista = document.getElementById("productosLista");

document.addEventListener("DOMContentLoaded", async () => {
  document.getElementById("btnNuevoProducto")?.addEventListener("click", () => {
    window.location.href = "/crear-producto.html";
  });

  await cargarProductos();

  // Modo oscuro si está guardado
  if (localStorage.getItem("modoOscuro") === "true") {
    document.body.classList.add("modo-oscuro");
  }
});

/**
 * 📦 Cargar todos los productos del backend
 */
async function cargarProductos() {
  try {
    const res = await fetch(API_BASE, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.message || "Error al obtener productos");

    if (!Array.isArray(data) || data.length === 0) {
      productosLista.innerHTML = "<p class='text-center'>😢 No hay productos aún.</p>";
      return;
    }

    renderizarProductos(data);
  } catch (err) {
    console.error("❌ Error al cargar productos:", err);
    productosLista.innerHTML = `<p class='text-center' style='color:red;'>❌ Error al cargar productos.</p>`;
  }
}

/**
 * 🧾 Mostrar productos en tabla
 */
function renderizarProductos(productos) {
  let html = `
    <table class="tabla-productos">
      <thead>
        <tr>
          <th>Imagen</th>
          <th>Nombre</th>
          <th>Precio</th>
          <th>Categoría</th>
          <th>Stock</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
  `;

  productos.forEach(p => {
    html += `
      <tr>
        <td><img src="${p.image}" alt="${p.name}" class="img-mini" /></td>
        <td>${p.name}</td>
        <td>$${p.price.toFixed(2)}</td>
        <td>${p.category || '-'}</td>
        <td>${p.stock || 0}</td>
        <td>
          <button class="btn-secundario" onclick="editarProducto('${p._id}')">✏️</button>
          <button class="btn-danger" onclick="eliminarProducto('${p._id}')">🗑️</button>
        </td>
      </tr>
    `;
  });

  html += `</tbody></table>`;
  productosLista.innerHTML = html;
}

/**
 * ✏️ Editar producto
 */
function editarProducto(id) {
  window.location.href = `/crear-producto.html?id=${id}`;
}

/**
 * ❌ Eliminar producto
 */
async function eliminarProducto(id) {
  const confirmar = confirm("⚠️ ¿Estás seguro de eliminar este producto?");
  if (!confirmar) return;

  try {
    const res = await fetch(`${API_BASE}/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.message || "No se pudo eliminar");

    mostrarMensaje("✅ Producto eliminado con éxito", "success");
    await cargarProductos();
  } catch (err) {
    console.error("❌ Error eliminando producto:", err);
    mostrarMensaje("❌ No se pudo eliminar", "error");
  }
}

// 🌐 Exponer para botones globales
window.editarProducto = editarProducto;
window.eliminarProducto = eliminarProducto;
window.goBack = goBack;
