"use strict";
import { verificarSesion, mostrarMensaje, isDateInRange, logout, goBack } from "./admin-utils.js";

// 🔐 Verificación de sesión
const token = verificarSesion();

// 🌐 Endpoints
const API_BASE = "https://km-ez-ropa-backend.onrender.com/api/products";
const API_UPLOAD = "https://km-ez-ropa-backend.onrender.com/api/uploads";

// 📌 DOM
const form = document.getElementById("productoForm");
const message = document.getElementById("message");
const preview = document.getElementById("previewImagen");

let variantes = [];
let editandoId = null;

// 📚 Categorías predefinidas
const categorias = {
  Hombre: ["Camisas", "Pantalones", "Chaquetas", "Ropa interior"],
  Mujer: ["Vestidos", "Blusas", "Leggins", "Ropa interior"],
  Niño: ["Camisetas", "Shorts", "Abrigos"],
  Niña: ["Faldas", "Vestidos", "Chaquetas"],
  Bebé: ["Mamelucos", "Bodies", "Pijamas"]
};

// 📂 Cargar categorías y subcategorías
function cargarCategorias() {
  const catSelect = document.getElementById("categoriaSelect");
  catSelect.innerHTML = `<option value="">Selecciona una categoría</option>`;
  Object.keys(categorias).forEach(cat => {
    catSelect.appendChild(new Option(cat, cat));
  });
}

document.getElementById("categoriaSelect").addEventListener("change", () => {
  const cat = document.getElementById("categoriaSelect").value;
  const subSelect = document.getElementById("subcategoriaSelect");
  subSelect.innerHTML = `<option value="">Selecciona una subcategoría</option>`;
  categorias[cat]?.forEach(sub => subSelect.appendChild(new Option(sub, sub)));
});

// 📤 Subir imagen
async function uploadToBackend(file) {
  const formData = new FormData();
  formData.append("image", file);

  const res = await fetch(API_UPLOAD, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData
  });

  if (!res.ok) throw new Error("❌ Error al subir imagen");
  return await res.json();
}

// ➕ Agregar variante
document.getElementById("addVariante").addEventListener("click", async () => {
  const talla = document.getElementById("talla").value.trim();
  const color = document.getElementById("color").value.trim();
  const imagen = document.getElementById("imagen").files[0];

  if (!talla || !color || !imagen) {
    return mostrarMensaje(message, "⚠️ Completa talla, color e imagen", "warning");
  }

  try {
    const { url, public_id } = await uploadToBackend(imagen);
    variantes.push({ talla, color, imageUrl: url, cloudinaryId: public_id });
    renderizarVariantes();
    limpiarCamposVariante();
    mostrarMensaje(message, "✅ Variante agregada", "success");
  } catch (err) {
    console.error(err);
    mostrarMensaje(message, "❌ Error subiendo imagen", "error");
  }
});

function limpiarCamposVariante() {
  document.getElementById("talla").value = "";
  document.getElementById("color").value = "";
  document.getElementById("imagen").value = "";
  preview.innerHTML = "";
}

function renderizarVariantes() {
  const contenedor = document.getElementById("listaVariantes");
  contenedor.innerHTML = "";
  variantes.forEach((v, i) => {
    contenedor.innerHTML += `
      <div class="variante-card">
        <p><strong>Talla:</strong> ${v.talla}</p>
        <p><strong>Color:</strong> ${v.color}</p>
        <img src="${v.imageUrl}" width="100" />
        <button onclick="eliminarVariante(${i})">❌ Eliminar</button>
      </div>
    `;
  });
}

window.eliminarVariante = (i) => {
  variantes.splice(i, 1);
  renderizarVariantes();
};

// 💾 Guardar o actualizar producto
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const btn = form.querySelector("button[type=submit]");
  btn.disabled = true;
  btn.textContent = "⏳ Guardando...";

  const payload = obtenerDatosFormulario();
  if (!payload) return resetBoton(btn);

  const method = editandoId ? "PUT" : "POST";
  const url = editandoId ? `${API_BASE}/${editandoId}` : API_BASE;

  try {
    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (res.ok) {
      mostrarMensaje(message, editandoId ? "✅ Producto actualizado" : "✅ Producto guardado", "success");
      form.reset();
      variantes = [];
      editandoId = null;
      renderizarVariantes();
      cargarProductos();
    } else {
      mostrarMensaje(message, `❌ ${data.message || "Error al guardar"}`, "error");
    }

  } catch (err) {
    console.error("❌", err);
    mostrarMensaje(message, "❌ Error del servidor", "error");
  } finally {
    resetBoton(btn);
  }
});

// 🔄 Obtener datos del formulario
function obtenerDatosFormulario() {
  const nombre = document.getElementById("nombre").value.trim();
  const precio = parseFloat(document.getElementById("precio").value);
  const categoria = document.getElementById("categoriaSelect").value;
  const subcategoria = document.getElementById("subcategoriaSelect").value;
  const stock = parseInt(document.getElementById("stock").value) || 0;
  const destacado = document.getElementById("featured")?.checked || false;

  if (!nombre || isNaN(precio) || !categoria || !subcategoria) {
    mostrarMensaje(message, "⚠️ Completa todos los campos obligatorios", "warning");
    return null;
  }

  if (variantes.length === 0) {
    mostrarMensaje(message, "⚠️ Agrega al menos una variante", "warning");
    return null;
  }

  return {
    name: nombre,
    price: precio,
    category: categoria,
    subcategory: subcategoria,
    stock,
    featured: destacado,
    variants: variantes
  };
}

function resetBoton(btn) {
  btn.disabled = false;
  btn.textContent = "📦 Guardar Producto";
}

// 📋 Cargar productos existentes
async function cargarProductos() {
  try {
    const res = await fetch(API_BASE);
    const productos = await res.json();
    const lista = document.getElementById("listaProductos");
    lista.innerHTML = "";

    productos.forEach(p => {
      const variantesHtml = p.variants?.map(v => `
        <div>
          <p>${v.talla} - ${v.color}</p>
          <img src="${v.imageUrl}" width="80" />
        </div>`).join("") || "Sin variantes";

      lista.innerHTML += `
        <div class="card">
          <h3>${p.name}</h3>
          <p><strong>Precio:</strong> $${p.price}</p>
          <p><strong>Categoría:</strong> ${p.category}</p>
          <p><strong>Subcategoría:</strong> ${p.subcategory}</p>
          <p><strong>Stock:</strong> ${p.stock}</p>
          <p><strong>Destacado:</strong> ${p.featured ? "✅" : "❌"}</p>
          <div>${variantesHtml}</div>
          <button onclick="editarProducto('${p._id}')">✏️ Editar</button>
          <button onclick="eliminarProducto('${p._id}')">🗑️ Eliminar</button>
        </div>
      `;
    });
  } catch (err) {
    console.error("❌ Error al cargar productos:", err);
  }
}

// ✏️ Editar producto
window.editarProducto = async (id) => {
  try {
    const res = await fetch(API_BASE);
    const productos = await res.json();
    const producto = productos.find(p => p._id === id);
    if (!producto) return mostrarMensaje(message, "❌ Producto no encontrado", "error");

    document.getElementById("nombre").value = producto.name;
    document.getElementById("precio").value = producto.price;
    document.getElementById("categoriaSelect").value = producto.category;
    document.getElementById("subcategoriaSelect").value = producto.subcategory;
    document.getElementById("stock").value = producto.stock;
    document.getElementById("featured").checked = producto.featured;

    variantes = [...producto.variants];
    renderizarVariantes();
    editandoId = id;

    mostrarMensaje(message, "✏️ Editando producto", "info");
  } catch (err) {
    console.error("❌", err);
    mostrarMensaje(message, "❌ Error cargando producto", "error");
  }
};

// 🗑️ Eliminar producto
window.eliminarProducto = async (id) => {
  if (!confirm("¿Eliminar producto?")) return;

  try {
    const res = await fetch(`${API_BASE}/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });

    if (res.ok) {
      mostrarMensaje(message, "🗑 Producto eliminado", "success");
      cargarProductos();
    } else {
      mostrarMensaje(message, "❌ No se pudo eliminar", "error");
    }
  } catch (err) {
    console.error("❌", err);
    mostrarMensaje(message, "❌ Error al eliminar", "error");
  }
};

// ▶️ Inicializar
cargarCategorias();
cargarProductos();
