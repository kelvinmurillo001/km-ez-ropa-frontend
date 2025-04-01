const API = "https://km-ez-ropa-backend.onrender.com/api/categories";
const token = localStorage.getItem("token");

// 🔐 Verifica login
if (!token) {
  alert("⚠️ No autorizado. Inicia sesión.");
  window.location.href = "login.html";
}

// 📌 DOM
const categoryForm = document.getElementById("categoryForm");
const subcategoryForm = document.getElementById("subcategoryForm");
const categoryNameInput = document.getElementById("categoryName");
const subcategoryNameInput = document.getElementById("subcategoryName");
const categorySelect = document.getElementById("categorySelect");
const categoryList = document.getElementById("categoryList");
const message = document.getElementById("message");

// ▶️ Cargar categorías existentes
async function loadCategories() {
  try {
    const res = await fetch(API);
    const data = await res.json();

    categorySelect.innerHTML = `<option value="">Selecciona una categoría</option>`;
    categoryList.innerHTML = "";

    data.forEach(cat => {
      // 👉 Agrega al select
      const opt = document.createElement("option");
      opt.value = cat._id;
      opt.textContent = cat.name;
      categorySelect.appendChild(opt);

      // 👉 Renderiza en lista
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
    console.error("❌ Error al cargar categorías:", error);
    showMessage("❌ Error al cargar categorías", "error");
  }
}

// ➕ Crear categoría
categoryForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = categoryNameInput.value.trim();

  if (!name) return showMessage("⚠️ Nombre requerido", "error");

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
      loadCategories();
    } else {
      showMessage(`❌ ${data.message || "Error al crear"}`, "error");
    }

  } catch (err) {
    showMessage("❌ Error al crear categoría", "error");
  }
});

// ➕ Agregar subcategoría
subcategoryForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const categoryId = categorySelect.value;
  const sub = subcategoryNameInput.value.trim();

  if (!categoryId || !sub) return showMessage("⚠️ Completa todos los campos", "error");

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
      subcategoryNameInput.value = "";
      showMessage("✅ Subcategoría agregada", "success");
      loadCategories();
    } else {
      showMessage(`❌ ${data.message || "Error al agregar"}`, "error");
    }

  } catch (err) {
    showMessage("❌ Error al agregar subcategoría", "error");
  }
});

// ❌ Eliminar categoría
async function deleteCategory(id) {
  if (!confirm("¿Eliminar esta categoría?")) return;

  try {
    const res = await fetch(`${API}/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });

    if (res.ok) {
      showMessage("✅ Categoría eliminada", "success");
      loadCategories();
    } else {
      showMessage("❌ No se pudo eliminar", "error");
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
      loadCategories();
    } else {
      showMessage("❌ No se pudo eliminar", "error");
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

// 💬 Mensaje
function showMessage(text, type = "error") {
  if (!message) return;
  message.textContent = text;
  message.style.color = type === "success" ? "green" : type === "warning" ? "orange" : "red";
  setTimeout(() => message.textContent = "", 3000);
}

// ▶️ Init
loadCategories();
