"use strict";

import { API_BASE } from "./config.js";
import { verificarSesion, mostrarMensaje, goBack } from "./admin-utils.js";

const token = verificarSesion();

// 🧾 DOM Elements
const formCrear = document.getElementById("formCrearCategoria");
const formSub = document.getElementById("formSubcategoria");

const categoriaInput = document.getElementById("categoriaInput");
const subcategoriaInput = document.getElementById("subcategoriaInput");
const selectCategoria = document.getElementById("selectCategoria");
const listaCategorias = document.getElementById("listaCategorias");

const API = `${API_BASE}/api/categories`;

document.addEventListener("DOMContentLoaded", cargarCategorias);

// ➕ Crear Categoría
formCrear?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const nombre = sanitize(categoriaInput.value);
  if (!nombre) return mostrarMensaje("⚠️ Ingresa un nombre válido", "error");

  try {
    const res = await fetch(API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ name: nombre })
    });

    if (!res.ok) throw new Error("❌ No se pudo crear la categoría");

    mostrarMensaje("✅ Categoría creada");
    categoriaInput.value = "";
    categoriaInput.focus();
    await cargarCategorias();
  } catch (err) {
    mostrarMensaje(err.message, "error");
  }
});

// ➕ Crear Subcategoría
formSub?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = selectCategoria.value;
  const sub = sanitize(subcategoriaInput.value);
  if (!id || !sub) return mostrarMensaje("⚠️ Completa todos los campos", "error");

  try {
    const res = await fetch(`${API}/${id}/subcategories`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ subcategory: sub })
    });

    if (!res.ok) throw new Error("❌ Error al agregar subcategoría");

    mostrarMensaje("✅ Subcategoría agregada");
    subcategoriaInput.value = "";
    subcategoriaInput.focus();
    await cargarCategorias();
  } catch (err) {
    mostrarMensaje(err.message, "error");
  }
});

// 🔄 Cargar Categorías
async function cargarCategorias() {
  try {
    const res = await fetch(API, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const json = await res.json();
    if (!res.ok || !json.ok || !Array.isArray(json.data)) {
      throw new Error(json.message || "❌ Error al obtener categorías");
    }

    renderCategorias(json.data);

    selectCategoria.innerHTML =
      '<option value="">Seleccionar categoría</option>' +
      json.data.map(c => `<option value="${c._id}">${sanitize(c.name)}</option>`).join("");

  } catch (err) {
    mostrarMensaje(err.message, "error");
    listaCategorias.innerHTML = `<p style="color:red;">${err.message}</p>`;
  }
}

// 🖼️ Renderizar Categorías
function renderCategorias(categorias = []) {
  if (!categorias.length) {
    listaCategorias.innerHTML = "<p>⚠️ No hay categorías registradas.</p>";
    return;
  }

  listaCategorias.innerHTML = categorias.map(c => `
    <li>
      <strong>${sanitize(c.name)}</strong>
      <button class="btn-danger" onclick="eliminarCategoria('${c._id}')">🗑️</button>
      <ul>
        ${
          Array.isArray(c.subcategories) && c.subcategories.length
            ? c.subcategories.map(s => `
              <li>
                ${sanitize(s)}
                <button class="btn-danger" onclick="eliminarSubcategoria('${c._id}', '${encodeURIComponent(s)}')">🗑️</button>
              </li>
            `).join("")
            : "<li><em>Sin subcategorías</em></li>"
        }
      </ul>
    </li>
  `).join("");
}

// ❌ Eliminar Categoría
window.eliminarCategoria = async (id) => {
  if (!confirm("⚠️ ¿Eliminar esta categoría y todas sus subcategorías?")) return;

  try {
    const res = await fetch(`${API}/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) throw new Error("❌ No se pudo eliminar la categoría");

    mostrarMensaje("✅ Categoría eliminada");
    await cargarCategorias();
  } catch (err) {
    mostrarMensaje(err.message, "error");
  }
};

// ❌ Eliminar Subcategoría
window.eliminarSubcategoria = async (categoryId, subcategory) => {
  if (!confirm("⚠️ ¿Eliminar esta subcategoría?")) return;

  try {
    const res = await fetch(`${API}/${categoryId}/subcategories/${subcategory}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) throw new Error("❌ No se pudo eliminar la subcategoría");

    mostrarMensaje("✅ Subcategoría eliminada");
    await cargarCategorias();
  } catch (err) {
    mostrarMensaje(err.message, "error");
  }
};

// 🧼 Sanitizar texto
function sanitize(text = "") {
  const temp = document.createElement("div");
  temp.textContent = text;
  return temp.innerHTML.trim();
}

window.goBack = goBack;
