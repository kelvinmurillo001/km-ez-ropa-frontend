"use strict";

// 🔐 Verificar sesión
const token = localStorage.getItem("token");
if (!token) {
  alert("⚠️ No autorizado. Inicia sesión.");
  location.href = "login.html";
}

// 🌐 Endpoints
const API_BASE = "https://km-ez-ropa-backend.onrender.com/api/products";
const API_UPLOAD = "https://km-ez-ropa-backend.onrender.com/api/uploads";

// 📌 DOM
const form = document.getElementById("productoForm");
const message = document.getElementById("message");
const preview = document.getElementById("previewImagen");

// 📚 Categorías predefinidas
const categorias = {
  Hombre: ["Camisas", "Pantalones", "Chaquetas", "Ropa interior"],
  Mujer: ["Vestidos", "Blusas", "Leggins", "Ropa interior"],
  Niño: ["Camisetas", "Shorts", "Abrigos"],
  Niña: ["Faldas", "Vestidos", "Chaquetas"],
  Bebé: ["Mamelucos", "Bodies", "Pijamas"]
};

let variantes = [];
let editandoId = null;

// 📂 Cargar categorías
function cargarCategorias() {
  const catSelect = document.getElementById("categoriaSelect");
  catSelect.innerHTML = `<option value="">Selecciona una categoría</option>`;
  Object.keys(categorias).forEach(cat => {
    const opt = new Option(cat, cat);
    catSelect.appendChild(opt);
  });
}

// 📂 Subcategorías según categoría
document.getElementById("categoriaSelect").addEventListener("change", () => {
  const cat = document.getElementById("categoriaSelect").value;
  const subSelect = document.getElementById("subcategoriaSelect");
  subSelect.innerHTML = `<option value="">Selecciona una subcategoría</option>`;
  if (categorias[cat]) {
    categorias[cat].forEach(sub => {
      subSelect.appendChild(new Option(sub, sub));
    });
  }
});

// 📤 Subir imagen al backend
async function uploadToBackend(file) {
  const formData = new FormData();
  formData.append("image", file);

  const res = await fetch(API_UPLOAD, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData
  });

  if (!res.ok) throw new Error("❌ Error al subir imagen");

  const data = await res.json();
  return {
    imageUrl: data.url,
    cloudinaryId: data.public_id
  };
}

// ➕ Agregar variante
document.getElementById("addVariante").addEventListener("click", async () => {
  const talla = document.getElementById("talla").value.trim();
  const color = document.getElementById("color").value.trim();
  const imagen = document.getElementById("imagen").files[0];

  if (!talla || !color || !imagen) {
    return showMessage("⚠️ Completa talla, color e imagen", "red");
  }

  try {
    const { imageUrl, cloudinaryId } = await uploadToBackend(imagen);
    variantes.push({ talla, color, imageUrl, cloudinaryId });
    renderizarVariantes();
    limpiarCamposVariante();
    showMessage("✅ Variante agregada", "green");
  } catch (err) {
    console.error(err);
    showMessage("❌ Error subiendo imagen", "red");
  }
});

// 🧽 Limpiar campos variante
function limpiarCamposVariante() {
  document.getElementById("talla").value = "";
  document.getElementById("color").value = "";
  document.getElementById("imagen").value = "";
  preview.innerHTML = "";
}

// 🧩 Renderizar variantes
function renderizarVariantes() {
  const contenedor = document.getElementById("listaVariantes");
  contenedor.innerHTML = "";
  variantes.forEach((v, i) => {
    const div = document.createElement("div");
    div.className = "variante-card";
    div.innerHTML = `
      <p><strong>Talla:</strong> ${v.talla}</p>
      <p><strong>Color:</strong> ${v.color}</p>
      <img src="${v.imageUrl}" width="100" />
      <button onclick="eliminarVariante(${i})">❌ Eliminar</button>
    `;
    contenedor.appendChild(div);
  });
}

// ❌ Eliminar variante
function eliminarVariante(index) {
  variantes.splice(index, 1);
  renderizarVariantes();
}

// 💾 Guardar producto
form.addEventListener("submit", async e => {
  e.preventDefault();
  const btn = form.querySelector("button[type=submit]");
  btn.disabled = true;
  btn.textContent = "⏳ Guardando...";

  const nombre = document.getElementById("nombre").value.trim();
  const precio = parseFloat(document.getElementById("precio").value);
  const categoria = document.getElementById("categoriaSelect").value;
  const subcategoria = document.getElementById("subcategoriaSelect").value;
  const stock = parseInt(document.getElementById("stock").value) || 0;
  const destacado = document.getElementById("featured")?.checked || false;

  if (!nombre || isNaN(precio) || !categoria || !subcategoria) {
    showMessage("⚠️ Completa todos los campos obligatorios", "red");
    return resetBoton(btn);
  }

  if (variantes.length === 0) {
    showMessage("⚠️ Debes agregar al menos una variante", "red");
    return resetBoton(btn);
  }

  const payload = {
    name: nombre,
    price: precio,
    category: categoria,
    subcategory: subcategoria,
    stock,
    featured: destacado,
    variants: variantes
  };

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
      showMessage(editandoId ? "✅ Producto actualizado" : "✅ Producto guardado", "green");
      form.reset();
      variantes = [];
      editandoId = null;
      renderizarVariantes();
      cargarProductos();
    } else {
      showMessage(data.message || "❌ Error al guardar", "red");
    }
  } catch (err) {
    console.error("❌", err);
    showMessage("❌ Error del servidor", "red");
  } finally {
    resetBoton(btn);
  }
});

// 📋 Cargar lista de productos
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
        </div>
      `).join("") || "Sin variantes";

      const card = document.createElement("div");
      card.className = "card";
      card.innerHTML = `
        <h3>${p.name}</h3>
        <p><strong>Precio:</strong> $${p.price}</p>
        <p><strong>Categoría:</strong> ${p.category}</p>
        <p><strong>Subcategoría:</strong> ${p.subcategory}</p>
        <p><strong>Stock:</strong> ${p.stock}</p>
        <p><strong>Destacado:</strong> ${p.featured ? "✅" : "❌"}</p>
        <div>${variantesHtml}</div>
        <button onclick="editarProducto('${p._id}')">✏️ Editar</button>
        <button onclick="eliminarProducto('${p._id}')">🗑️ Eliminar</button>
      `;
      lista.appendChild(card);
    });
  } catch (err) {
    console.error("❌ Error al cargar productos:", err);
  }
}

// ✏️ Editar producto
async function editarProducto(id) {
  try {
    const res = await fetch(API_BASE);
    const productos = await res.json();
    const producto = productos.find(p => p._id === id);
    if (!producto) return showMessage("❌ Producto no encontrado", "red");

    document.getElementById("nombre").value = producto.name;
    document.getElementById("precio").value = producto.price;
    document.getElementById("categoriaSelect").value = producto.category;
    document.getElementById("subcategoriaSelect").value = producto.subcategory;
    document.getElementById("stock").value = producto.stock;
    document.getElementById("featured").checked = producto.featured;

    variantes = [...producto.variants];
    renderizarVariantes();
    editandoId = id;

    showMessage("✏️ Editando producto", "orange");
  } catch (err) {
    console.error("❌", err);
    showMessage("❌ Error al cargar producto", "red");
  }
}

// 🗑️ Eliminar producto
async function eliminarProducto(id) {
  if (!confirm("¿Eliminar producto?")) return;

  try {
    const res = await fetch(`${API_BASE}/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });

    if (res.ok) {
      showMessage("🗑 Producto eliminado", "green");
      cargarProductos();
    } else {
      showMessage("❌ No se pudo eliminar", "red");
    }
  } catch (err) {
    console.error("❌", err);
  }
}

// 💬 Mostrar mensaje
function showMessage(text, color = "black") {
  message.textContent = text;
  message.style.color = color;
  setTimeout(() => (message.textContent = ""), 3000);
}

// 🔁 Resetear botón submit
function resetBoton(btn) {
  btn.disabled = false;
  btn.textContent = "📦 Guardar Producto";
}

// ▶️ Inicializar
cargarCategorias();
cargarProductos();
