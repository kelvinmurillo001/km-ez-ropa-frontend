// 🔐 Verificar sesión
const token = localStorage.getItem("token");
if (!token) {
  alert("⚠️ No autorizado. Inicia sesión.");
  window.location.href = "login.html";
}

// 📦 DOM Elements
const form = document.getElementById("productoForm");
const message = document.getElementById("message");
let preview = document.getElementById("previewImagen"); // corregido: sin redeclarar

// 🌐 API base
const API_BASE = "https://km-ez-ropa-backend.onrender.com/api/products";

// 🔁 Categorías y subcategorías
const categorias = {
  Hombre: ["Camisas", "Pantalones", "Chaquetas", "Ropa interior"],
  Mujer: ["Vestidos", "Blusas", "Leggins", "Ropa interior"],
  Niño: ["Camisetas", "Shorts", "Abrigos"],
  Niña: ["Faldas", "Vestidos", "Chaquetas"],
  Bebé: ["Mamelucos", "Bodies", "Pijamas"]
};

// ⏬ Cargar categorías
function cargarCategorias() {
  const catSelect = document.getElementById("categoriaSelect");
  catSelect.innerHTML = `<option value="">Selecciona una categoría</option>`;
  Object.keys(categorias).forEach((cat) => {
    const opt = document.createElement("option");
    opt.value = cat;
    opt.textContent = cat;
    catSelect.appendChild(opt);
  });
}

// 🧠 Cargar subcategorías
document.getElementById("categoriaSelect").addEventListener("change", () => {
  const subSelect = document.getElementById("subcategoriaSelect");
  const cat = document.getElementById("categoriaSelect").value;
  subSelect.innerHTML = `<option value="">Selecciona una subcategoría</option>`;
  if (categorias[cat]) {
    categorias[cat].forEach((sub) => {
      const opt = document.createElement("option");
      opt.value = sub;
      opt.textContent = sub;
      subSelect.appendChild(opt);
    });
  }
});

// 📷 Vista previa imagen
document.getElementById("imagen").addEventListener("change", function () {
  const file = this.files[0];
  if (file && file.type.startsWith("image/")) {
    const reader = new FileReader();
    reader.onload = (e) => {
      preview.innerHTML = `<img src="${e.target.result}" alt="Vista previa" />`;
    };
    reader.readAsDataURL(file);
  } else {
    preview.innerHTML = "";
  }
});

// ✏️ Modo edición
let editing = false;
let editingId = null;

// 💾 Guardar producto
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const nombre = document.getElementById("nombre").value.trim();
  const precio = parseFloat(document.getElementById("precio").value);
  const descripcion = document.getElementById("descripcion").value.trim();
  const categoria = document.getElementById("categoriaSelect").value;
  const subcategoria = document.getElementById("subcategoriaSelect").value;
  const talla = document.getElementById("talla").value.trim();
  const colores = document.getElementById("colores").value.trim();
  const imagen = document.getElementById("imagen").files[0];

  if (!nombre || isNaN(precio) || !categoria || !subcategoria) {
    return showMessage("⚠️ Todos los campos obligatorios deben completarse", "red");
  }

  const formData = new FormData();
  formData.append("nombre", nombre);
  formData.append("precio", precio);
  formData.append("descripcion", descripcion);
  formData.append("categoria", categoria);
  formData.append("subcategoria", subcategoria);
  formData.append("talla", talla);
  formData.append("colores", colores);
  if (imagen) formData.append("imagen", imagen);

  let url = API_BASE;
  let method = "POST";
  if (editing && editingId) {
    url += `/${editingId}`;
    method = "PUT";
  }

  try {
    const res = await fetch(url, {
      method,
      headers: { Authorization: `Bearer ${token}` },
      body: formData
    });

    const data = await res.json();

    if (res.ok) {
      showMessage(editing ? "✅ Producto actualizado" : "✅ Producto agregado", "green");
      form.reset();
      preview.innerHTML = "";
      editing = false;
      editingId = null;
      cargarProductos();
    } else {
      showMessage(data.message || "❌ Error al guardar", "red");
    }
  } catch (err) {
    console.error("❌ Error:", err);
    showMessage("❌ Error del servidor", "red");
  }
});

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

// 🖋 Editar producto
function editarProducto(p) {
  document.getElementById("nombre").value = p.nombre;
  document.getElementById("precio").value = p.precio;
  document.getElementById("descripcion").value = p.descripcion || "";
  document.getElementById("categoriaSelect").value = p.categoria;
  document.getElementById("categoriaSelect").dispatchEvent(new Event("change"));
  document.getElementById("subcategoriaSelect").value = p.subcategoria;
  document.getElementById("talla").value = p.talla || "";
  document.getElementById("colores").value = p.colores || "";
  preview.innerHTML = p.imagen ? `<img src="${p.imagen}" />` : "";

  editing = true;
  editingId = p._id;
  showMessage("✏️ Modo edición activo", "orange");
}

// 🔄 Cargar productos
async function cargarProductos() {
  try {
    const res = await fetch(API_BASE);
    const productos = await res.json();
    const lista = document.getElementById("listaProductos");
    lista.innerHTML = "";

    productos.forEach((p) => {
      const card = document.createElement("div");
      card.classList.add("card");

      card.innerHTML = `
        <img src="${p.imagen || '../assets/logo.jpg'}" alt="${p.nombre}" />
        <h3>${p.nombre}</h3>
        <p><strong>Precio:</strong> $${p.precio}</p>
        <p><strong>Categoría:</strong> ${p.categoria}</p>
        <p><strong>Subcategoría:</strong> ${p.subcategoria}</p>
        <p><strong>Talla:</strong> ${p.talla || 'N/A'}</p>
        <p><strong>Colores:</strong> ${p.colores || 'N/A'}</p>
        <div style="margin-top: 10px">
          <button onclick='editarProducto(${JSON.stringify(p)})'>✏️ Editar</button>
          <button onclick="eliminarProducto('${p._id}')">🗑️ Eliminar</button>
        </div>
      `;

      lista.appendChild(card);
    });
  } catch (err) {
    console.error("❌ Error al cargar productos:", err);
  }
}

// ✅ Mostrar mensaje
function showMessage(text, color = "black") {
  message.textContent = text;
  message.style.color = color;
  setTimeout(() => (message.textContent = ""), 3000);
}

// ▶️ Inicial
cargarCategorias();
cargarProductos();
