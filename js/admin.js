"use strict";

import { verificarSesion, mostrarMensaje, goBack } from "./admin-utils.js";

const API_URL = "https://km-ez-ropa-backend.onrender.com/api/products";
const token = verificarSesion();

document.addEventListener("DOMContentLoaded", () => {
  listarProductos();
  document.getElementById("formProducto")?.addEventListener("submit", crearProducto);
});

/* 📦 Crear producto */
async function crearProducto(e) {
  e.preventDefault();

  const nombre = document.getElementById("nombre")?.value.trim();
  const precio = parseFloat(document.getElementById("precio")?.value || 0);
  const categoria = document.getElementById("categoria")?.value.trim();
  const subcategoria = document.getElementById("subcategoria")?.value.trim();
  const colores = document.getElementById("colores")?.value.trim();
  const talla = document.getElementById("talla")?.value.trim();
  const stock = parseInt(document.getElementById("stock")?.value || 0);
  const imagen = document.getElementById("imagen")?.value.trim();
  const destacado = document.getElementById("destacado")?.checked;

  if (!nombre || !precio || !categoria || !stock || !imagen) {
    return mostrarMensaje("⚠️ Por favor completa todos los campos obligatorios.", "error");
  }

  const payload = {
    name: nombre,
    price: precio,
    category: categoria,
    subcategory,
    colores,
    talla,
    stock,
    featured: destacado,
    images: [{ url: imagen }]
  };

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Error al crear producto");

    mostrarMensaje("✅ Producto creado correctamente.", "success");
    document.getElementById("formProducto").reset();
    listarProductos();
  } catch (err) {
    mostrarMensaje(`❌ ${err.message}`, "error");
  }
}

/* 📋 Listar productos */
async function listarProductos() {
  try {
    const res = await fetch(API_URL);
    const productos = await res.json();
    if (!res.ok) throw new Error("Error al obtener productos");

    const contenedor = document.getElementById("listaProductos");
    contenedor.innerHTML = "";

    productos.forEach(p => {
      const card = document.createElement("div");
      card.className = "card fade-in";
      card.innerHTML = `
        <img src="${p.images?.[0]?.url || "/assets/logo.jpg"}" alt="${p.name}" onerror="this.src='/assets/logo.jpg'" />
        <h3>${p.name}</h3>
        <p><strong>Precio:</strong> $${p.price}</p>
        <p><strong>Stock:</strong> ${p.stock}</p>
        <button onclick="eliminarProducto('${p._id}')">🗑 Eliminar</button>
      `;
      contenedor.appendChild(card);
    });
  } catch (err) {
    mostrarMensaje("❌ No se pudieron cargar los productos", "error");
  }
}

/* ❌ Eliminar producto */
window.eliminarProducto = async function (id) {
  if (!confirm("¿Seguro que deseas eliminar este producto?")) return;

  try {
    const res = await fetch(`${API_URL}/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.message || "Error al eliminar");
    }

    mostrarMensaje("✅ Producto eliminado.", "success");
    listarProductos();
  } catch (err) {
    mostrarMensaje(`❌ ${err.message}`, "error");
  }
};

// 🔁 Exportar funciones para usarlas en admin.html
window.goBack = goBack;
