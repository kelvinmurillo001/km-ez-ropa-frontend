"use strict";

// ✅ Verifica si el usuario es admin
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
      alert("⛔ Acceso denegado. Solo administradores.");
      localStorage.removeItem("token");
      location.href = "login.html";
      return null;
    }
    return token;
  } catch (err) {
    console.error("❌ Token malformado:", err);
    alert("⚠️ Sesión inválida. Vuelve a iniciar sesión.");
    localStorage.removeItem("token");
    location.href = "login.html";
    return null;
  }
}

function mostrarMensaje(elemento, mensaje, tipo = "info") {
  const colores = {
    success: { bg: "#e8f5e9", color: "#2e7d32" },
    error: { bg: "#ffebee", color: "#b71c1c" },
    warning: { bg: "#fff8e1", color: "#f57c00" },
    info: { bg: "#e3f2fd", color: "#0277bd" }
  };

  const { bg, color } = colores[tipo] || colores.info;

  elemento.textContent = mensaje;
  elemento.classList.remove("oculto");
  elemento.style.backgroundColor = bg;
  elemento.style.color = color;

  setTimeout(() => elemento.classList.add("oculto"), 3500);
}

function logout() {
  localStorage.removeItem("token");
  location.href = "login.html";
}

function goBack() {
  location.href = "panel.html";
}

// ✅ Inicia sesión
const token = verificarSesion();
const headers = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`
};

// 📍 API y elementos del DOM
const API = "https://km-ez-ropa-backend.onrender.com/api/categories";
const message = document.getElementById("message");
const categoryForm = document.getElementById("formCategoria");
const subcategoryForm = document.getElementById("subcategoryForm");
const categoryNameInput = document.getElementById("nombreCategoria");
const subcategoryNameInput = document.getElementById("nuevaSubcategoria");
const categorySelect = document.getElementById("categorySelect");
const categoryList = document.getElementById("listaCategorias");

// 🔃 Cargar categorías
async function loadCategories() {
  try {
    const res = await fetch(API);
    const data = await res.json();
    renderCategorySelect(data);
    renderCategoryCards(data);
  } catch (err) {
    console.error("❌ Error cargando categorías:", err);
    mostrarMensaje(message, "❌ No se pudieron cargar las categorías", "error");
  }
}

// 🔽 Rellenar select de categorías
function renderCategorySelect(data) {
  categorySelect.innerHTML = `<option value="">Selecciona una categoría</option>`;
  data.forEach(cat => {
    const option = document.createElement("option");
    option.value = cat._id;
    option.textContent = cat.name;
    categorySelect.appendChild(option);
  });
}

// 📋 Renderizar tarjetas
function renderCategoryCards(data) {
  categoryList.innerHTML = "";
  data.forEach(cat => {
    const card = document.createElement("div");
    card.className = "categoria-card fade-in";

    const subcats = (cat.subcategories || []).map(sub => `
      <li>
        ${sub}
        <button onclick="deleteSubcategory('${cat._id}', '${sub}')" class="btn btn-xs">❌</button>
      </li>`).join("");

    card.innerHTML = `
      <div class="cat-header">
        <strong>${cat.name}</strong>
        <button onclick="deleteCategory('${cat._id}')" class="btn btn-sm danger">🗑</button>
      </div>
      <ul class="subcategoria-list">${subcats}</ul>
    `;

    categoryList.appendChild(card);
  });
}

// ➕ Crear categoría
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
  } catch (err) {
    mostrarMensaje(message, "❌ Error de red al crear categoría", "error");
  }
});

// ➕ Agregar subcategoría
subcategoryForm?.addEventListener("submit", async e => {
  e.preventDefault();
  const categoryId = categorySelect.value;
  const subcategory = subcategoryNameInput.value.trim();

  if (!categoryId || !subcategory) {
    return mostrarMensaje(message, "⚠️ Completa todos los campos", "warning");
  }

  try {
    const res = await fetch(`${API}/${categoryId}/subcategories`, {
      method: "POST",
      headers,
      body: JSON.stringify({ subcategory })
    });

    const data = await res.json();

    if (res.ok) {
      mostrarMensaje(message, "✅ Subcategoría agregada", "success");
      subcategoryNameInput.value = "";
      loadCategories();
    } else {
      mostrarMensaje(message, `❌ ${data.message || "No se pudo agregar"}`, "error");
    }
  } catch (err) {
    mostrarMensaje(message, "❌ Error al agregar subcategoría", "error");
  }
});

// 🗑 Eliminar categoría
window.deleteCategory = async id => {
  if (!confirm("¿Eliminar esta categoría completa?")) return;

  try {
    const res = await fetch(`${API}/${id}`, {
      method: "DELETE",
      headers
    });

    if (res.ok) {
      mostrarMensaje(message, "✅ Categoría eliminada", "success");
      loadCategories();
    } else {
      mostrarMensaje(message, "❌ No se pudo eliminar categoría", "error");
    }
  } catch {
    mostrarMensaje(message, "❌ Error eliminando categoría", "error");
  }
};

// 🗑 Eliminar subcategoría
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
    mostrarMensaje(message, "❌ Error eliminando subcategoría", "error");
  }
};

// ▶️ Init
loadCategories();

// 🔓 Exponer globalmente para fallback
window.verificarToken = verificarSesion;
