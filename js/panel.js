"use strict";
import { verificarSesion, logout } from "./admin-utils.js";

const API_BASE = "https://km-ez-ropa-backend.onrender.com/api";
const API_CATEGORIAS = `${API_BASE}/categories`;
const API_PRODUCTOS = `${API_BASE}/products`;

document.addEventListener("DOMContentLoaded", () => {
  const token = verificarSesion();
  const btn = document.getElementById("modoToggle");
  const isDark = localStorage.getItem("modoOscuro") === "true";

  if (isDark) {
    document.body.classList.add("modo-oscuro");
    btn.textContent = "☀️ Modo Claro";
  }

  btn?.addEventListener("click", () => {
    document.body.classList.toggle("modo-oscuro");
    const oscuro = document.body.classList.contains("modo-oscuro");
    localStorage.setItem("modoOscuro", oscuro);
    btn.textContent = oscuro ? "☀️ Modo Claro" : "🌙 Modo Oscuro";
  });

  // 🟢 Cargar categorías
  cargarCategorias(token);

  // 🟢 Enviar formulario de producto
  const form = document.getElementById("formProducto");
  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const nombre = document.getElementById("nombre").value.trim();
    const precio = parseFloat(document.getElementById("precio").value);
    const categoria = document.getElementById("categoriaProducto").value;
    const subcategoria = document.getElementById("subcategoriaProducto").value;
    const stock = parseInt(document.getElementById("stock").value);
    const tallaTipo = document.getElementById("tallaTipo").value;

    if (!nombre || !precio || !categoria || !subcategoria || !stock || !tallaTipo) {
      return mostrarMensaje("❌ Todos los campos son obligatorios", "error");
    }

    try {
      const res = await fetch(API_PRODUCTOS, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: nombre,
          price: precio,
          category: categoria,
          subcategory: subcategoria,
          stock,
          tallaTipo,
          mainImages: [{ url: "https://via.placeholder.com/150", cloudinaryId: "fake_id" }],
          variants: []
        })
      });

      const data = await res.json();

      if (res.ok) {
        mostrarMensaje("✅ Producto creado correctamente", "success");
        form.reset();
      } else {
        mostrarMensaje(`❌ ${data.message || "Error al crear producto"}`, "error");
      }
    } catch (err) {
      console.error("❌ Error al crear producto:", err);
      mostrarMensaje("❌ Error al enviar producto", "error");
    }
  });
});

window.logout = logout;

// 🔄 Cargar categorías y preparar subcategorías dinámicas
async function cargarCategorias(token) {
  try {
    const res = await fetch(API_CATEGORIAS);
    const categorias = await res.json();

    const selectCat = document.getElementById("categoriaProducto");
    const selectSub = document.getElementById("subcategoriaProducto");

    selectCat.innerHTML = `<option value="">Categoría</option>`;
    selectSub.innerHTML = `<option value="">Subcategoría</option>`;

    categorias.forEach(cat => {
      const opt = document.createElement("option");
      opt.value = cat.name;
      opt.textContent = cat.name;
      selectCat.appendChild(opt);
    });

    // 🟠 Cambiar subcategorías al cambiar la categoría
    selectCat.addEventListener("change", () => {
      const seleccionada = categorias.find(c => c.name === selectCat.value);
      selectSub.innerHTML = `<option value="">Subcategoría</option>`;
      (seleccionada?.subcategories || []).forEach(sub => {
        const opt = document.createElement("option");
        opt.value = sub;
        opt.textContent = sub;
        selectSub.appendChild(opt);
      });
    });

  } catch (err) {
    console.error("❌ Error cargando categorías:", err);
    mostrarMensaje("❌ No se pudieron cargar las categorías", "error");
  }
}

// 💬 Mostrar mensaje
function mostrarMensaje(texto, tipo = "info") {
  const el = document.getElementById("mensajeProducto");
  el.textContent = texto;

  const estilos = {
    success: "#e8f5e9",
    error: "#ffebee",
    info: "#e3f2fd"
  };

  el.style.backgroundColor = estilos[tipo] || "#f1f1f1";
  el.style.color = tipo === "error" ? "#b71c1c" : tipo === "success" ? "#2e7d32" : "#0277bd";

  el.classList.remove("oculto");
  setTimeout(() => el.classList.add("oculto"), 4000);
}
