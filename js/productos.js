"use strict";

// 🔐 Utilidades comunes y constante de entorno
import { verificarSesion, goBack, mostrarMensaje } from "./admin-utils.js";
import { API_BASE } from "./config.js";

// 📌 Token de sesión
const token = verificarSesion();

// 📦 Endpoints
const API_PRODUCTS = `${API_BASE}/api/products`;

// 📍 DOM
const productosLista = document.getElementById("productosLista");
const btnNuevoProducto = document.getElementById("btnNuevoProducto");

document.addEventListener("DOMContentLoaded", () => {
  btnNuevoProducto?.addEventListener("click", () => {
    window.location.href = "/crear-producto.html";
  });

  cargarProductos();

  // 🌙 Modo oscuro activado
  if (localStorage.getItem("modoOscuro") === "true") {
    document.body.classList.add("modo-oscuro");
  }
});

/**
 * 📦 Cargar productos del backend
 */
async function cargarProductos() {
  try {
    const res = await fetch(API_PRODUCTS, {
      headers: {
        Authorization: `Bearer ${token}`
      }
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
 * 🧾 Renderizar productos en tabla
 */
function renderizarProductos(productos) {
  const filas = productos.map(p => `
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
    </tr>`).join("");

  productosLista.innerHTML = `
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
      <tbody>${filas}</tbody>
    </table>`;
}

/**
 * ✏️ Ir a editar producto
 */
function editarProducto(id) {
  window.location.href = `/crear-producto.html?id=${id}`;
}

/**
 * ❌ Eliminar producto con confirmación
 */
async function eliminarProducto(id) {
  const confirmar = confirm("⚠️ ¿Estás seguro de eliminar este producto?");
  if (!confirmar) return;

  try {
    const res = await fetch(`${API_PRODUCTS}/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.message || "No se pudo eliminar");

    mostrarMensaje("✅ Producto eliminado correctamente", "success");
    await cargarProductos();

  } catch (err) {
    console.error("❌ Error eliminando producto:", err);
    mostrarMensaje("❌ No se pudo eliminar", "error");
  }
}

// ✅ Exponer funciones al DOM (solo si tu HTML usa type="module")
window.goBack = goBack;
window.editarProducto = editarProducto;
window.eliminarProducto = eliminarProducto;
