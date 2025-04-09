"use strict";

import {
  verificarSesion,
  mostrarMensaje,
  logout,
  goBack
} from "./admin-utils.js";

// ✅ Verificar token
const token = verificarSesion();

// 🌐 API
const API = "https://km-ez-ropa-backend.onrender.com/api/categories";

// 📌 Elementos del DOM
const categoryForm = document.getElementById("formCategoria");
const categoryNameInput = document.getElementById("nombreCategoria");
const subcategoryNameInput = document.getElementById("nuevaSubcategoria");
const categorySelect = document.getElementById("categorySelect");
const categoryList = document.getElementById("listaCategorias");
const message = document.getElementById("message");

/**
 * ▶️ Cargar categorías desde backend
 */
async function loadCategories() {
  try {
    const res = await fetch(API);
    if (!res.ok) throw new Error("Error al obtener categorías");

    const data = await res.json();
    renderCategorySelect(data);
    renderCategoryCards(data);
  } catch (err) {
    console.error("❌", err);
    mostrarMensaje(message, "❌ Error al cargar categorías", "error");
  }
}

/**
 * 🧩 Rellenar <select> con categorías
 */
function renderCategorySelect(categorias) {
  if (!categorySelect) return;

  categorySelect.innerHTML = `<option value="">Selecciona una categoría</option>`;
  categorias.forEach(cat => {
    const opt = document.createElement("option");
    opt.value = cat._id;
    opt.textContent = cat.name;
    categorySelect.appendChild(opt);
  });
}

/**
 * 🧾 Mostrar tarjetas de categoría
 */
function renderCategoryCards(categorias) {
  categoryList.innerHTML = "";

  categorias.forEach(cat => {
    const card = document.createElement("div");
    card.className = "categoria-card fade-in";

    const subcats = (cat.subcategories || []).map(sub => `
      <li>
        ${sub}
        <button onclick="deleteSubcategory('${cat._id}', '${sub}')" class="btn btn-xs">❌</button>
      </li>
    `).join("");

    card.innerHTML = `
      <div class="cat-header">
        <strong>${cat.name}</strong>
        <button class="btn btn-sm danger" onclick="deleteCategory('${cat._id}')">🗑</button>
      </div>
      <ul class="subcategoria-list">${subcats}</ul>
    `;

    categoryList.appendChild(card);
  });
}

/**
 * ➕ Crear nueva categoría
 */
categoryForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = categoryNameInput.value.trim();
  if (!name) return mostrarMensaje(message, "⚠️ Nombre requerido", "warning");

  try {
    const res = await fetch(API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ name })
    });

    const data = await res.json();

    if (res.ok) {
      mostrarMensaje(message, "✅ Categoría creada", "success");
      categoryNameInput.value = "";
      await loadCategories();
    } else {
      mostrarMensaje(message, `❌ ${data.message || "Error al crear categoría"}`, "error");
    }
  } catch {
    mostrarMensaje(message, "❌ Error de red al crear categoría", "error");
  }
});

/**
 * ➕ Agregar subcategoría
 */
document.getElementById("subcategoryForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const categoryId = categorySelect?.value;
  const sub = subcategoryNameInput?.value.trim();

  if (!categoryId || !sub) {
    return mostrarMensaje(message, "⚠️ Completa todos los campos", "warning");
  }

  try {
    const res = await fetch(`${API}/${categoryId}/subcategories`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ subcategory: sub })
    });

    const data = await res.json();

    if (res.ok) {
      mostrarMensaje(message, "✅ Subcategoría agregada", "success");
      subcategoryNameInput.value = "";
      await loadCategories();
    } else {
      mostrarMensaje(message, `❌ ${data.message || "Error al agregar subcategoría"}`, "error");
    }
  } catch {
    mostrarMensaje(message, "❌ Error de red al agregar subcategoría", "error");
  }
});

/**
 * ❌ Eliminar categoría
 */
window.deleteCategory = async (id) => {
  if (!confirm("¿Eliminar esta categoría?")) return;

  try {
    const res = await fetch(`${API}/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });

    if (res.ok) {
      mostrarMensaje(message, "✅ Categoría eliminada", "success");
      await loadCategories();
    } else {
      mostrarMensaje(message, "❌ No se pudo eliminar la categoría", "error");
    }
  } catch {
    mostrarMensaje(message, "❌ Error eliminando categoría", "error");
  }
};

/**
 * ❌ Eliminar subcategoría
 */
window.deleteSubcategory = async (id, sub) => {
  if (!confirm("¿Eliminar esta subcategoría?")) return;

  try {
    const res = await fetch(`${API}/${id}/subcategories`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ subcategory: sub })
    });

    if (res.ok) {
      mostrarMensaje(message, "✅ Subcategoría eliminada", "success");
      await loadCategories();
    } else {
      mostrarMensaje(message, "❌ No se pudo eliminar subcategoría", "error");
    }
  } catch {
    mostrarMensaje(message, "❌ Error eliminando subcategoría", "error");
  }
};

// ▶️ Cargar al iniciar
loadCategories();
