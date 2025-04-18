"use strict";

import { API_BASE } from "./config.js";
import { verificarSesion, mostrarMensaje, goBack } from "./admin-utils.js";

const token = verificarSesion();

const formCrear = document.getElementById("formCrearCategoria");
const formSub = document.getElementById("formSubcategoria");
const categoriaInput = document.getElementById("categoriaInput");
const subcategoriaInput = document.getElementById("subcategoriaInput");
const selectCategoria = document.getElementById("selectCategoria");
const listaCategorias = document.getElementById("listaCategorias");

// ✅ CORREGIDO: endpoint base correcto
const API = `${API_BASE}/api/categories`;

document.addEventListener("DOMContentLoaded", cargarCategorias);

// ➕ Crear nueva categoría
formCrear.addEventListener("submit", async (e) => {
  e.preventDefault();
  const nombre = categoriaInput.value.trim();

  if (!nombre) return mostrarMensaje("❌ Nombre requerido", "error");

  try {
    const res = await fetch(API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ name: nombre })
    });

    if (!res.ok) throw new Error("Error al crear categoría");
    const data = await res.json();

    mostrarMensaje("✅ Categoría creada");
    categoriaInput.value = "";
    categoriaInput.focus(); // UX: enfocar de nuevo
    cargarCategorias();
  } catch (err) {
    mostrarMensaje(err.message, "error");
  }
});

// ➕ Agregar subcategoría
formSub.addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = selectCategoria.value;
  const sub = subcategoriaInput.value.trim();

  if (!id || !sub) return mostrarMensaje("❌ Completa todos los campos", "error");

  try {
    const res = await fetch(`${API}/${id}/subcategories`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ subcategory: sub })
    });

    if (!res.ok) throw new Error("Error al agregar subcategoría");
    const data = await res.json();

    mostrarMensaje("✅ Subcategoría agregada");
    subcategoriaInput.value = "";
    subcategoriaInput.focus(); // UX
    cargarCategorias();
  } catch (err) {
    mostrarMensaje(err.message, "error");
  }
});

// 🔄 Cargar categorías
async function cargarCategorias() {
  try {
    const res = await fetch(API);
    if (!res.ok) throw new Error("❌ No se pudo cargar categorías");

    const categorias = await res.json();
    renderCategorias(categorias);

    selectCategoria.innerHTML = `<option value="">Seleccionar categoría</option>` +
      categorias.map(c => `<option value="${c._id}">${c.name}</option>`).join("");
  } catch (err) {
    mostrarMensaje(err.message, "error");
  }
}

// 🖼️ Renderizar lista
function renderCategorias(categorias = []) {
  if (!categorias.length) {
    listaCategorias.innerHTML = "<p>⚠️ No hay categorías registradas.</p>";
    return;
  }

  listaCategorias.innerHTML = categorias.map(c => `
    <li>
      <strong>${c.name}</strong>
      <button class="btn-danger" onclick="eliminarCategoria('${c._id}')">🗑️</button>
      <ul>
        ${c.subcategories?.map(s => `
          <li>
            ${s}
            <button class="btn-danger" onclick="eliminarSubcategoria('${c._id}', '${s}')">🗑️</button>
          </li>
        `).join("") || ""}
      </ul>
    </li>
  `).join("");
}

// ❌ Eliminar categoría
window.eliminarCategoria = async (id) => {
  if (!confirm("⚠️ ¿Eliminar esta categoría?")) return;

  try {
    const res = await fetch(`${API}/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) throw new Error("Error al eliminar categoría");
    const data = await res.json();

    mostrarMensaje("✅ Categoría eliminada");
    cargarCategorias();
  } catch (err) {
    mostrarMensaje(err.message, "error");
  }
};

// ❌ Eliminar subcategoría
window.eliminarSubcategoria = async (categoryId, subcategory) => {
  if (!confirm("⚠️ ¿Eliminar esta subcategoría?")) return;

  try {
    const res = await fetch(`${API}/${categoryId}/subcategories/${subcategory}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) throw new Error("Error al eliminar subcategoría");
    const data = await res.json();

    mostrarMensaje("✅ Subcategoría eliminada");
    cargarCategorias();
  } catch (err) {
    mostrarMensaje(err.message, "error");
  }
};

window.goBack = goBack;
