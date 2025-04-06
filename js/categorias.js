const API = "https://km-ez-ropa-backend.onrender.com/api/categories";
const token = localStorage.getItem("token");

// 🔐 Verifica login
if (!token) {
  alert("⚠️ No autorizado. Inicia sesión.");
  window.location.href = "login.html";
}

// 📌 DOM
const categoryForm = document.getElementById("formCategoria");
const categoryNameInput = document.getElementById("nombreCategoria");
const subcategoryNameInput = document.getElementById("nuevaSubcategoria");
const categorySelect = document.getElementById("categorySelect");
const categoryList = document.getElementById("listaCategorias");
const message = document.getElementById("message");

// ▶️ Cargar categorías
async function loadCategories() {
  try {
    const res = await fetch(API);
    if (!res.ok) throw new Error("Error al obtener categorías");

    const data = await res.json();

    if (categorySelect) {
      categorySelect.innerHTML = `<option value="">Selecciona una categoría</option>`;
    }
    categoryList.innerHTML = "";

    data.forEach(cat => {
      // 👉 Agregar al select si existe
      if (categorySelect) {
        const opt = document.createElement("option");
        opt.value = cat._id;
        opt.textContent = cat.name;
        categorySelect.appendChild(opt);
      }

      // 👉 Renderizar en la lista
      const catCard = document.createElement("div");
      catCard.className = "categoria-card fade-in";

      catCard.innerHTML = `
        <div class="cat-header">
          <strong>${cat.name}</strong>
          <button class="btn btn-sm danger" onclick="deleteCategory('${cat._id}')">🗑</button>
        </div>
        <ul class="subcategoria-list">
          ${(cat.subcategories || []).map(sub => `
            <li>
              ${sub}
              <button onclick="deleteSubcategory('${cat._id}', '${sub}')" class="btn btn-xs">❌</button>
            </li>
          `).join("")}
        </ul>
      `;

      categoryList.appendChild(catCard);
    });

  } catch (error) {
    console.error("❌", error);
    showMessage("❌ Error al cargar categorías", "error");
  }
}

// ➕ Crear categoría
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

  } catch (err) {
    showMessage("❌ Error de red al crear categoría", "error");
  }
});

// ➕ Agregar subcategoría (si existe el formulario)
document.getElementById("subcategoryForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const categoryId = categorySelect?.value;
  const sub = subcategoryNameInput?.value.trim();

  if (!categoryId || !sub) {
    return showMessage("⚠️ Completa todos los campos", "warning");
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
      showMessage("✅ Subcategoría agregada", "success");
      subcategoryNameInput.value = "";
      await loadCategories();
    } else {
      showMessage(`❌ ${data.message || "Error al agregar subcategoría"}`, "error");
    }

  } catch (err) {
    showMessage("❌ Error de red al agregar subcategoría", "error");
  }
});

// ❌ Eliminar categoría
async function deleteCategory(id) {
  if (!confirm("¿Eliminar esta categoría?")) return;

  try {
    const res = await fetch(`${API}/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (res.ok) {
      showMessage("✅ Categoría eliminada", "success");
      await loadCategories();
    } else {
      showMessage("❌ No se pudo eliminar la categoría", "error");
    }
  } catch (err) {
    showMessage("❌ Error eliminando categoría", "error");
  }
}

// ❌ Eliminar subcategoría
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

  } catch (err) {
    showMessage("❌ Error eliminando subcategoría", "error");
  }
}

// 🔐 Logout
function logout() {
  localStorage.removeItem("token");
  window.location.href = "login.html";
}

// 🔙 Volver
function goBack() {
  window.location.href = "panel.html";
}

// 💬 Mostrar mensaje
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

// ▶️ Init
loadCategories();
