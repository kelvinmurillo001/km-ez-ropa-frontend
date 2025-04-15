"use strict";

// 🔐 Importar utilidades comunes
import { verificarSesion, goBack } from "./admin-utils.js";

// 🔑 Token de sesión
const token = verificarSesion();

// 🌍 API URL
const API_BASE = "https://km-ez-ropa-backend.onrender.com/api/products";

// 📦 Al cargar
document.addEventListener("DOMContentLoaded", () => {
  cargarProductos();
  document.getElementById("btnNuevoProducto").addEventListener("click", () => {
    window.location.href = "/crear-producto.html";
  });
});

// ✅ Cargar productos del backend
async function cargarProductos() {
  try {
    const res = await fetch(API_BASE);
    const productos = await res.json();
    renderizarTabla(productos);
  } catch (err) {
    console.error("❌ Error al cargar productos:", err);
    document.getElementById("productosLista").innerHTML =
      "<p style='color:red;'>❌ Error al cargar productos.</p>";
  }
}

// ✅ Renderizar tabla
function renderizarTabla(lista) {
  if (!Array.isArray(lista)) return;

  const tabla = document.createElement("table");
  tabla.className = "productos-table";

  tabla.innerHTML = `
    <thead>
      <tr>
        <th>Imagen</th>
        <th>Nombre</th>
        <th>Precio</th>
        <th>Stock</th>
        <th>Acciones</th>
      </tr>
    </thead>
    <tbody>
      ${lista
        .map(p => `
          <tr>
            <td><img src="${p.image}" alt="${p.name}" class="producto-img" /></td>
            <td>${p.name}</td>
            <td>$${p.price.toFixed(2)}</td>
            <td>${p.stock}</td>
            <td>
              <button class="btn-accion btn-editar" onclick="editarProducto('${p._id}')">✏️ Editar</button>
              <button class="btn-accion btn-eliminar" onclick="eliminarProducto('${p._id}')">🗑️ Eliminar</button>
            </td>
          </tr>
        `)
        .join("")}
    </tbody>
  `;

  const contenedor = document.getElementById("productosLista");
  contenedor.innerHTML = "";
  contenedor.appendChild(tabla);
}

// ✏️ Editar producto
function editarProducto(id) {
  window.location.href = `/editar-producto.html?id=${id}`;
}

// ❌ Eliminar producto
async function eliminarProducto(id) {
  const confirmar = confirm("⚠️ ¿Estás seguro de eliminar este producto?");
  if (!confirmar) return;

  try {
    const res = await fetch(`${API_BASE}/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!res.ok) throw new Error("No se pudo eliminar");

    alert("✅ Producto eliminado correctamente.");
    cargarProductos();
  } catch (err) {
    console.error(err);
    alert("❌ Error al eliminar el producto.");
  }
}

// 🌐 Función global para volver
window.goBack = goBack;
