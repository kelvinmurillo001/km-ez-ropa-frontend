const token = localStorage.getItem("token");
if (!token) {
  alert("⚠️ No autorizado. Inicia sesión.");
  window.location.href = "login.html";
}

const form = document.getElementById("productoForm");
const message = document.getElementById("message");
const preview = document.getElementById("previewImagen");

const API_BASE = "https://km-ez-ropa-backend.onrender.com/api/products";
const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/dmbnkrhek/image/upload";
const CLOUDINARY_UPLOAD_PRESET = "ml_default";

const categorias = {
  Hombre: ["Camisas", "Pantalones", "Chaquetas", "Ropa interior"],
  Mujer: ["Vestidos", "Blusas", "Leggins", "Ropa interior"],
  Niño: ["Camisetas", "Shorts", "Abrigos"],
  Niña: ["Faldas", "Vestidos", "Chaquetas"],
  Bebé: ["Mamelucos", "Bodies", "Pijamas"]
};

function cargarCategorias() {
  const catSelect = document.getElementById("categoriaSelect");
  catSelect.innerHTML = `<option value="">Selecciona una categoría</option>`;
  Object.keys(categorias).forEach(cat => {
    const opt = document.createElement("option");
    opt.value = cat;
    opt.textContent = cat;
    catSelect.appendChild(opt);
  });
}

document.getElementById("categoriaSelect").addEventListener("change", () => {
  const subSelect = document.getElementById("subcategoriaSelect");
  const cat = document.getElementById("categoriaSelect").value;
  subSelect.innerHTML = `<option value="">Selecciona una subcategoría</option>`;
  if (categorias[cat]) {
    categorias[cat].forEach(sub => {
      const opt = document.createElement("option");
      opt.value = sub;
      opt.textContent = sub;
      subSelect.appendChild(opt);
    });
  }
});

async function uploadToCloudinary(file) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

  const res = await fetch(CLOUDINARY_URL, {
    method: "POST",
    body: formData
  });

  if (!res.ok) throw new Error("❌ Error al subir imagen");
  const data = await res.json();
  return {
    imageUrl: data.secure_url,
    cloudinaryId: data.public_id
  };
}

let variantes = [];

document.getElementById("addVariante").addEventListener("click", async () => {
  const talla = document.getElementById("talla").value.trim();
  const color = document.getElementById("color").value.trim();
  const imagen = document.getElementById("imagen").files[0];

  if (!talla || !color || !imagen) {
    showMessage("⚠️ Completa talla, color e imagen", "red");
    return;
  }

  try {
    const { imageUrl, cloudinaryId } = await uploadToCloudinary(imagen);
    variantes.push({ talla, color, imageUrl, cloudinaryId });
    renderizarVariantes();
    document.getElementById("talla").value = "";
    document.getElementById("color").value = "";
    document.getElementById("imagen").value = "";
    preview.innerHTML = "";
    showMessage("✅ Variante agregada", "green");
  } catch (err) {
    console.error(err);
    showMessage("❌ Error subiendo imagen", "red");
  }
});

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

function eliminarVariante(i) {
  // ⚠️ Esta lógica elimina de la vista. Si quieres eliminar de Cloudinary, deberás hacer un fetch al backend.
  variantes.splice(i, 1);
  renderizarVariantes();
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const btn = form.querySelector("button[type=submit]");
  btn.disabled = true;

  const nombre = document.getElementById("nombre").value.trim();
  const precio = parseFloat(document.getElementById("precio").value);
  const categoria = document.getElementById("categoriaSelect").value;
  const subcategoria = document.getElementById("subcategoriaSelect").value;
  const stock = parseInt(document.getElementById("stock").value) || 0;
  const destacado = document.getElementById("featured")?.checked || false;

  if (!nombre || isNaN(precio) || !categoria || !subcategoria) {
    showMessage("⚠️ Todos los campos obligatorios deben completarse", "red");
    btn.disabled = false;
    return;
  }

  if (variantes.length === 0) {
    showMessage("⚠️ Debes agregar al menos una variante", "red");
    btn.disabled = false;
    return;
  }

  const payload = {
    name: nombre,
    price: precio,
    category: categoria,
    subcategory: subcategoria,
    stock,
    featured: destacado,
    variants
  };

  try {
    const res = await fetch(API_BASE, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (res.ok) {
      showMessage("✅ Producto guardado", "green");
      form.reset();
      variantes = [];
      renderizarVariantes();
      cargarProductos();
    } else {
      showMessage(data.message || "❌ Error al guardar", "red");
    }
  } catch (err) {
    console.error("❌", err);
    showMessage("❌ Error del servidor", "red");
  } finally {
    btn.disabled = false;
  }
});

async function cargarProductos() {
  try {
    const res = await fetch(API_BASE);
    const productos = await res.json();
    const lista = document.getElementById("listaProductos");
    lista.innerHTML = "";

    productos.forEach((p) => {
      const card = document.createElement("div");
      card.classList.add("card");

      const variantesHtml = p.variants?.map(v => `
        <div>
          <p>${v.talla} - ${v.color}</p>
          <img src="${v.imageUrl}" width="80" />
        </div>`).join("") || "Sin variantes";

      card.innerHTML = `
        <h3>${p.name}</h3>
        <p><strong>Precio:</strong> $${p.price}</p>
        <p><strong>Categoría:</strong> ${p.category}</p>
        <p><strong>Subcategoría:</strong> ${p.subcategory}</p>
        <p><strong>Stock:</strong> ${p.stock}</p>
        <p><strong>Destacado:</strong> ${p.featured ? "✅" : "❌"}</p>
        <div>${variantesHtml}</div>
        <button onclick="eliminarProducto('${p._id}')">🗑️ Eliminar</button>
      `;
      lista.appendChild(card);
    });
  } catch (err) {
    console.error("❌ Error al cargar productos:", err);
  }
}

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

function showMessage(text, color = "black") {
  message.textContent = text;
  message.style.color = color;
  setTimeout(() => (message.textContent = ""), 3000);
}

cargarCategorias();
cargarProductos();
