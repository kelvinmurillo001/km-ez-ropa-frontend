"use strict";

import { verificarSesion } from "./admin-utils.js";

const token = verificarSesion();
const API_URL = "https://km-ez-ropa-backend.onrender.com/api/products";
const form = document.getElementById("productoForm");
const lista = document.getElementById("listaProductos");

// 📦 Cargar productos al iniciar
document.addEventListener("DOMContentLoaded", cargarProductos);

form?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const producto = {
    name: form.name.value.trim(),
    price: parseFloat(form.price.value),
    stock: parseInt(form.stock.value),
    category: form.category.value.trim(),
    subcategory: form.subcategory.value.trim(),
    talla: form.talla.value.trim(),
    colores: form.colores.value.trim(),
    featured: form.featured.checked,
    images: [{ url: form.imageUrl.value.trim() }]
  };

  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(producto)
  });

  if (!res.ok) {
    alert("❌ No se pudo guardar el producto.");
    return;
  }

  form.reset();
  cargarProductos();
});

// 🔄 Cargar productos
async function cargarProductos() {
  try {
    const res = await fetch(API_URL);
    const productos = await res.json();
    mostrarProductos(productos);
  } catch {
    lista.innerHTML = "<p>Error al cargar productos.</p>";
  }
}

// 🧾 Render
function mostrarProductos(data) {
  lista.innerHTML = "";
  data.forEach(p => {
    const card = document.createElement("div");
    card.className = "producto-card fade-in";
    card.innerHTML = `
      <img src="${p.images?.[0]?.url || '/assets/logo.jpg'}" alt="${p.name}" onerror="this.src='/assets/logo.jpg'" />
      <h3>${p.name}</h3>
      <p><strong>Precio:</strong> $${p.price}</p>
      <p><strong>Stock:</strong> ${p.stock}</p>
      <p><strong>Categoría:</strong> ${p.category}</p>
      <p><strong>Subcategoría:</strong> ${p.subcategory || "-"}</p>
      <button onclick="eliminarProducto('${p._id}')">🗑 Eliminar</button>
    `;
    lista.appendChild(card);
  });
}

// 🗑 Eliminar producto
async function eliminarProducto(id) {
  if (!confirm("¿Seguro que deseas eliminar este producto?")) return;
  const res = await fetch(`${API_URL}/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` }
  });
  if (res.ok) cargarProductos();
  else alert("❌ No se pudo eliminar.");
}

// Exportar para uso global
window.eliminarProducto = eliminarProducto;
