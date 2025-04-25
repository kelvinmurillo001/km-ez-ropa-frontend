"use strict";

import { API_BASE } from "./config.js";
import { verificarSesion, mostrarMensaje, goBack } from "./admin-utils.js";

// 🔐 Verificar sesión
const token = verificarSesion();
const API = `${API_BASE}/api/categories`;

// 📌 Elementos del DOM
const formCrear = document.getElementById("formCrearCategoria");
const formSub = document.getElementById("formSubcategoria");
const categoriaInput = document.getElementById("categoriaInput");
const subcategoriaInput = document.getElementById("subcategoriaInput");
const selectCategoria = document.getElementById("selectCategoria");
const listaCategorias = document.getElementById("listaCategorias");

// 🚀 Inicio
document.addEventListener("DOMContentLoaded", () => {
  if (token) cargarCategorias();
});

/* ───────────────────────────────────────────── */
/* ➕ CREAR NUEVA CATEGORÍA                       */
/* ───────────────────────────────────────────── */
formCrear?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const nombre = sanitize(categoriaInput.value.trim());
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

    const data = await res.json();
    if (!res.ok || !data.ok) throw new Error(data.message || "❌ No se pudo crear la categoría");

    mostrarMensaje("✅ Categoría creada exitosamente", "success");
    categoriaInput.value = "";
    categoriaInput.focus();
    await cargarCategorias();
  } catch (err) {
    mostrarMensaje(err.message, "error");
  }
});

/* ───────────────────────────────────────────── */
/* ➕ CREAR SUBCATEGORÍA                          */
/* ───────────────────────────────────────────── */
formSub?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const categoriaId = selectCategoria.value;
  const sub = sanitize(subcategoriaInput.value.trim());

  if (!categoriaId || !sub) return mostrarMensaje("⚠️ Completa todos los campos", "error");

  try {
    const res = await fetch(`${API}/${categoriaId}/subcategories`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ subcategory: sub })
    });

    const data = await res.json();
    if (!res.ok || !data.ok) throw new Error(data.message || "❌ Error al agregar subcategoría");

    mostrarMensaje("✅ Subcategoría agregada", "success");
    subcategoriaInput.value = "";
    subcategoriaInput.focus();
    await cargarCategorias();
  } catch (err) {
    mostrarMensaje(err.message, "error");
  }
});

/* ───────────────────────────────────────────── */
/* 🔄 CARGAR TODAS LAS CATEGORÍAS                */
/* ───────────────────────────────────────────── */
async function cargarCategorias() {
  try {
    const res = await fetch(API, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = await res.json();
    if (!res.ok || !data.ok || !Array.isArray(data.data)) {
      throw new Error(data.message || "❌ Error al obtener categorías");
    }

    renderCategorias(data.data);
    actualizarSelect(data.data);
  } catch (err) {
    mostrarMensaje(err.message, "error");
    listaCategorias.innerHTML = `<p style="color:red;">${sanitize(err.message)}</p>`;
  }
}

/* ───────────────────────────────────────────── */
/* 📂 ACTUALIZAR SELECT CATEGORÍAS               */
/* ───────────────────────────────────────────── */
function actualizarSelect(categorias = []) {
  selectCategoria.innerHTML = '<option value="">Seleccionar categoría</option>';
  categorias.forEach(cat => {
    selectCategoria.innerHTML += `<option value="${cat._id}">${sanitize(cat.name)}</option>`;
  });
}

/* ───────────────────────────────────────────── */
/* 🖼️ RENDERIZAR CATEGORÍAS Y SUBCATEGORÍAS      */
/* ───────────────────────────────────────────── */
function renderCategorias(categorias = []) {
  if (!categorias.length) {
    listaCategorias.innerHTML = "<p>⚠️ No hay categorías registradas.</p>";
    return;
  }

  listaCategorias.innerHTML = categorias.map(cat => `
    <li>
      <strong>${sanitize(cat.name)}</strong>
      <button class="btn-danger" onclick="eliminarCategoria('${cat._id}')">🗑️</button>
      <ul>
        ${
          Array.isArray(cat.subcategories) && cat.subcategories.length
            ? cat.subcategories.map(sub => `
              <li>
                ${sanitize(sub)}
                <button class="btn-danger" onclick="eliminarSubcategoria('${cat._id}', '${encodeURIComponent(sub)}')">🗑️</button>
              </li>
            `).join("")
            : "<li><em>Sin subcategorías</em></li>"
        }
      </ul>
    </li>
  `).join("");
}

/* ───────────────────────────────────────────── */
/* ❌ ELIMINAR CATEGORÍA                         */
/* ───────────────────────────────────────────── */
window.eliminarCategoria = async (id) => {
  if (!confirm("⚠️ ¿Eliminar esta categoría y todas sus subcategorías?")) return;

  try {
    const res = await fetch(`${API}/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = await res.json();
    if (!res.ok || !data.ok) throw new Error(data.message || "❌ No se pudo eliminar la categoría");

    mostrarMensaje("✅ Categoría eliminada", "success");
    await cargarCategorias();
  } catch (err) {
    mostrarMensaje(err.message, "error");
  }
};

/* ───────────────────────────────────────────── */
/* ❌ ELIMINAR SUBCATEGORÍA                      */
/* ───────────────────────────────────────────── */
window.eliminarSubcategoria = async (categoryId, subcategory) => {
  if (!confirm("⚠️ ¿Eliminar esta subcategoría?")) return;

  try {
    const res = await fetch(`${API}/${categoryId}/subcategories/${subcategory}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = await res.json();
    if (!res.ok || !data.ok) throw new Error(data.message || "❌ No se pudo eliminar la subcategoría");

    mostrarMensaje("✅ Subcategoría eliminada", "success");
    await cargarCategorias();
  } catch (err) {
    mostrarMensaje(err.message, "error");
  }
};

/* ───────────────────────────────────────────── */
/* 🧼 SANITIZAR TEXTO                            */
/* ───────────────────────────────────────────── */
function sanitize(text = "") {
  const temp = document.createElement("div");
  temp.textContent = text;
  return temp.innerHTML.trim();
}

// 🔙 Función global para volver atrás
window.goBack = goBack;
