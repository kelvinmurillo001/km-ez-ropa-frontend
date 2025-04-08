"use strict";

// 🌐 Configuración inicial
const API = "https://km-ez-ropa-backend.onrender.com/api/categories";
const token = localStorage.getItem("token");

// 🔐 Validar sesión activa
if (!token) {
  alert("⚠️ No autorizado. Inicia sesión.");
  window.location.href = "login.html";
}

// 📌 Elementos del DOM
const categoryForm = document.getElementById("formCategoria");
const categoryNameInput = document.getElementById("nombreCategoria");
const subcategoryNameInput = document.getElementById("nuevaSubcategoria");
const categorySelect = document.getElementById("categorySelect");
const categoryList = document.getElementById("listaCategorias");
const message = document.getElementById("message");

/**
 * ▶️ Cargar todas las categorías desde el backend
 */
async function loadCategories() {
  try {
    const res = await fetch(API);
    if (!res.ok) throw new Error("Error al obtener categorías");

    const data = await res.json();
    renderCategorySelect(data);
    renderCategoryCards(data);
  } catch (error) {
    console.error("❌", error);
    showMessage("❌ Error al cargar categorías", "error");
  }
}

/**
 * 🧩 Rellena el select de categorías
 */
function renderCategorySelect(categories) {
  if (!categorySelect) return;

  categorySelect.innerHTML = `<option value="">Selecciona una categoría</option>`;
  categories.forEach(cat => {
    const opt = document.createElement("option");
    opt.value = cat._id;
    opt.textContent = cat.name;
    categorySelect.appendChild(opt);
  });
}

/**
 * 🧾 Muestra las categorías y sus subcategorías
 */
function renderCategoryCards(categories) {
  categoryList.innerHTML = "";

  categories.forEach(cat => {
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
 * ➕ Crear una nueva categoría
 */
categoryForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = categoryNameInput.value.trim();
  if (!name) return showMessage("⚠️ Nombre requerido", "warning");

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
      showMessage("✅ Categoría creada", "success");
      categoryNameInput.value = "";
      await loadCategories();
    } else {
      showMessage(`❌ ${data.message || "Error al crear categoría"}`, "error");
    }
  } catch {
    showMessage("❌ Error de red al crear categoría", "error");
  }
});

/**
 * ➕ Agregar subcategoría a categoría existente
 */
document.getElementById("subcategoryForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const categoryId = categorySelect?.value;
  const sub = subcategoryNameInput?.value.trim();

  if (!categoryId || !sub) return showMessage("⚠️ Completa todos los campos", "warning");

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
      showMessage("✅ Subcategoría agregada", "success");
      subcategoryNameInput.value = "";
      await loadCategories();
    } else {
      showMessage(`❌ ${data.message || "Error al agregar subcategoría"}`, "error");
    }
  } catch {
    showMessage("❌ Error de red al agregar subcategoría", "error");
  }
});

/**
 * ❌ Eliminar categoría
 */
async function deleteCategory(id) {
  if (!confirm("¿Eliminar esta categoría?")) return;

  try {
    const res = await fetch(`${API}/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });

    if (res.ok) {
      showMessage("✅ Categoría eliminada", "success");
      await loadCategories();
    } else {
      showMessage("❌ No se pudo eliminar la categoría", "error");
    }
  } catch {
    showMessage("❌ Error eliminando categoría", "error");
  }
}

/**
 * ❌ Eliminar subcategoría
 */
async function deleteSubcategory(id, sub) {
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
      showMessage("✅ Subcategoría eliminada", "success");
      await loadCategories();
    } else {
      showMessage("❌ No se pudo eliminar subcategoría", "error");
    }
  } catch {
    showMessage("❌ Error eliminando subcategoría", "error");
  }
}

/**
 * 🔐 Cerrar sesión
 */
function logout() {
  localStorage.removeItem("token");
  window.location.href = "login.html";
}

/**
 * 🔙 Volver al panel
 */
function goBack() {
  window.location.href = "panel.html";
}

/**
 * 💬 Mostrar mensaje visual
 */
function showMessage(text, type = "error") {
  if (!message) return;
  message.textContent = text;

  const colors = {
    success: "green",
    warning: "orange",
    error: "red"
  };

  message.style.color = colors[type] || "black";
  setTimeout(() => (message.textContent = ""), 3000);
}

// ▶️ Iniciar
loadCategories();
