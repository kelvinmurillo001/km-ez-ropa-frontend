"use strict";

/* =============================
   ✅ Validación de Sesión Admin
============================= */
function verificarSesion() {
  const token = localStorage.getItem("token");
  if (!token || typeof token !== "string" || token.length < 10) {
    alert("⚠️ No autorizado. Inicia sesión.");
    location.href = "login.html";
    return null;
  }

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    if (!payload || payload.role !== "admin") {
      alert("⛔ Acceso denegado.");
      localStorage.removeItem("token");
      location.href = "login.html";
      return null;
    }
    return token;
  } catch (err) {
    console.error("❌ Token inválido:", err);
    alert("⚠️ Sesión inválida. Inicia sesión nuevamente.");
    localStorage.removeItem("token");
    location.href = "login.html";
    return null;
  }
}

/* =============================
   🎨 Utilidades de UI
============================= */
function mostrarMensaje(el, mensaje, tipo = "info") {
  const colores = {
    success: { bg: "#e8f5e9", color: "#2e7d32" },
    error: { bg: "#ffebee", color: "#b71c1c" },
    warning: { bg: "#fff3cd", color: "#856404" },
    info: { bg: "#e3f2fd", color: "#0277bd" }
  };

  const { bg, color } = colores[tipo] || colores.info;
  el.textContent = mensaje;
  el.classList.remove("oculto");
  el.style.backgroundColor = bg;
  el.style.color = color;

  setTimeout(() => el.classList.add("oculto"), 4000);
}

function logout() {
  localStorage.removeItem("token");
  location.href = "login.html";
}

function goBack() {
  location.href = "panel.html";
}

/* =============================
   📦 Config inicial
============================= */
const token = verificarSesion();
const headers = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`
};
const API = "https://km-ez-ropa-backend.onrender.com/api/categories";

/* =============================
   📍 Elementos DOM
============================= */
const message = document.getElementById("message");
const categoryForm = document.getElementById("formCategoria");
const subcategoryForm = document.getElementById("subcategoryForm");
const categoryNameInput = document.getElementById("nombreCategoria");
const subcategoryNameInput = document.getElementById("nuevaSubcategoria");
const categorySelect = document.getElementById("categorySelect");
const categoryList = document.getElementById("listaCategorias");

const coloresCategorias = ["blue", "orange", "red", "green", "purple", "teal"];

/* =============================
   📥 Cargar Categorías
============================= */
async function loadCategories() {
  try {
    const res = await fetch(API);
    const data = await res.json();
    renderCategorySelect(data);
    renderCategoryCards(data);
  } catch (err) {
    console.error("❌ Error al cargar categorías:", err);
    mostrarMensaje(message, "❌ No se pudieron cargar las categorías", "error");
  }
}

function renderCategorySelect(data) {
  categorySelect.innerHTML = `<option value="">Selecciona una categoría</option>`;
  data.forEach(cat => {
    const opt = new Option(cat.name, cat._id);
    categorySelect.appendChild(opt);
  });
}

function renderCategoryCards(data) {
  categoryList.innerHTML = "";

  data.forEach((cat, index) => {
    const color = coloresCategorias[index % coloresCategorias.length];

    const card = document.createElement("div");
    card.className = `categoria-card fade-in`;
    card.dataset.color = color;

    const subcats = (cat.subcategories || []).map(sub => `
      <li>
        ${sub}
        <button onclick="deleteSubcategory('${cat._id}', '${sub}')" aria-label="Eliminar subcategoría ${sub}">❌</button>
      </li>
    `).join("");

    card.innerHTML = `
      <div class="cat-header">
        <strong>${cat.name}</strong>
        <button onclick="deleteCategory('${cat._id}')" class="btn btn-sm danger" aria-label="Eliminar categoría ${cat.name}">🗑</button>
      </div>
      <ul class="subcategoria-list">${subcats}</ul>
    `;
    categoryList.appendChild(card);
  });
}

/* =============================
   ➕ Crear Categoría
============================= */
categoryForm?.addEventListener("submit", async e => {
  e.preventDefault();
  const name = categoryNameInput.value.trim();
  if (!name) return mostrarMensaje(message, "⚠️ Escribe un nombre", "warning");

  try {
    const res = await fetch(API, {
      method: "POST",
      headers,
      body: JSON.stringify({ name })
    });

    const data = await res.json();
    if (res.ok) {
      mostrarMensaje(message, "✅ Categoría creada", "success");
      categoryNameInput.value = "";
      loadCategories();
    } else {
      mostrarMensaje(message, `❌ ${data.message || "Error al crear categoría"}`, "error");
    }
  } catch {
    mostrarMensaje(message, "❌ Error de red", "error");
  }
});

/* =============================
   ➕ Crear Subcategoría
============================= */
subcategoryForm?.addEventListener("submit", async e => {
  e.preventDefault();
  const categoryId = categorySelect.value;
  const subcategory = subcategoryNameInput.value.trim();

  if (!categoryId || !subcategory) {
    return mostrarMensaje(message, "⚠️ Selecciona una categoría y escribe una subcategoría", "warning");
  }

  try {
    const res = await fetch(`${API}/${categoryId}/subcategories`, {
      method: "POST",
      headers,
      body: JSON.stringify({ subcategory })
    });

    const data = await res.json();
    if (res.ok) {
      mostrarMensaje(message, "✅ Subcategoría añadida", "success");
      subcategoryNameInput.value = "";
      loadCategories();
    } else {
      mostrarMensaje(message, `❌ ${data.message || "Error al agregar subcategoría"}`, "error");
    }
  } catch {
    mostrarMensaje(message, "❌ Error al conectar con servidor", "error");
  }
});

/* =============================
   🗑 Eliminar Categoría
============================= */
window.deleteCategory = async id => {
  if (!confirm("¿Eliminar esta categoría completa?")) return;

  try {
    const res = await fetch(`${API}/${id}`, {
      method: "DELETE",
      headers
    });

    if (res.ok) {
      mostrarMensaje(message, "🗑 Categoría eliminada", "success");
      loadCategories();
    } else {
      mostrarMensaje(message, "❌ No se pudo eliminar categoría", "error");
    }
  } catch {
    mostrarMensaje(message, "❌ Error de red al eliminar", "error");
  }
};

/* =============================
   🗑 Eliminar Subcategoría
============================= */
window.deleteSubcategory = async (id, subcategory) => {
  if (!confirm("¿Eliminar esta subcategoría?")) return;

  try {
    const res = await fetch(`${API}/${id}/subcategories`, {
      method: "DELETE",
      headers,
      body: JSON.stringify({ subcategory })
    });

    if (res.ok) {
      mostrarMensaje(message, "✅ Subcategoría eliminada", "success");
      loadCategories();
    } else {
      mostrarMensaje(message, "❌ No se pudo eliminar subcategoría", "error");
    }
  } catch {
    mostrarMensaje(message, "❌ Error al eliminar subcategoría", "error");
  }
};

/* =============================
   ▶️ Inicialización
============================= */
loadCategories();
window.verificarToken = verificarSesion;
