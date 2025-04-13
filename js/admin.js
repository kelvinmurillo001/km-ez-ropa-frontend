"use strict";

// ✅ SESIÓN ADMIN REUTILIZABLE
function verificarAdmin() {
  const token = localStorage.getItem("token");
  if (!token || typeof token !== "string" || token.length < 10) {
    alert("⚠️ No autorizado. Inicia sesión.");
    window.location.href = "login.html";
    return null;
  }

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    if (!payload || payload.role !== "admin") {
      alert("⛔ Acceso denegado. Solo administradores.");
      localStorage.removeItem("token");
      window.location.href = "login.html";
      return null;
    }
    return token;
  } catch (err) {
    console.error("❌ Token malformado:", err);
    alert("⚠️ Sesión inválida. Vuelve a iniciar sesión.");
    localStorage.removeItem("token");
    window.location.href = "login.html";
    return null;
  }
}

const token = verificarAdmin();
if (!token) throw new Error("Sesión no autorizada.");

const API_BASE = "https://km-ez-ropa-backend.onrender.com/api/products";
const API_UPLOAD = "https://km-ez-ropa-backend.onrender.com/api/uploads";
const API_CATEGORIAS = "https://km-ez-ropa-backend.onrender.com/api/categories";

const form = document.getElementById("productoForm");
const message = document.getElementById("message");
const preview = document.getElementById("previewImagen");
const contadorVariantes = document.getElementById("contadorVariantes");

let variantes = [];
let editandoId = null;
let imagenesPrincipales = [];

function mostrarMensaje(el, mensaje, tipo = "info") {
  const colores = {
    success: { bg: "#e8f5e9", color: "#2e7d32" },
    error: { bg: "#ffebee", color: "#b71c1c" },
    warning: { bg: "#fff8e1", color: "#f57c00" },
    info: { bg: "#e3f2fd", color: "#0277bd" }
  };
  const { bg, color } = colores[tipo] || colores.info;
  el.textContent = mensaje;
  el.classList.remove("oculto");
  el.style.backgroundColor = bg;
  el.style.color = color;
  setTimeout(() => el.classList.add("oculto"), 3500);
}

async function cargarCategorias() {
  const catSelect = document.getElementById("categoriaSelect");
  const subcatSelect = document.getElementById("subcategoriaSelect");

  catSelect.innerHTML = `<option value="">Selecciona una categoría</option>`;
  subcatSelect.innerHTML = `<option value="">Selecciona una subcategoría</option>`;
  subcatSelect.disabled = true;

  try {
    const res = await fetch(API_CATEGORIAS);
    const data = await res.json();

    data.forEach(cat => {
      const opt = new Option(cat.name, cat.name);
      opt.dataset.subcats = JSON.stringify(cat.subcategories || []);
      catSelect.appendChild(opt);
    });

    catSelect.addEventListener("change", e => {
      const selected = e.target.selectedOptions[0];
      const subcats = JSON.parse(selected.dataset.subcats || "[]");
      subcatSelect.innerHTML = `<option value="">Selecciona una subcategoría</option>`;
      subcatSelect.disabled = subcats.length === 0;
      subcats.forEach(sub => subcatSelect.appendChild(new Option(sub, sub)));
    });
  } catch (err) {
    console.error("❌ Error cargando categorías:", err);
    mostrarMensaje(message, "❌ No se pudieron cargar las categorías", "error");
  }
}

function esImagenValida(file) {
  const tiposPermitidos = ["image/jpeg", "image/png", "image/webp"];
  return tiposPermitidos.includes(file.type);
}

async function uploadToBackend(file) {
  if (!esImagenValida(file)) throw new Error("⚠️ Solo JPG, PNG o WEBP");

  const formData = new FormData();
  formData.append("image", file);

  const res = await fetch(API_UPLOAD, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData
  });

  if (!res.ok) throw new Error("❌ Error subiendo imagen");
  return await res.json();
}

document.getElementById("imagenesPrincipales").addEventListener("change", async (e) => {
  const files = Array.from(e.target.files);
  const previewContenedor = document.getElementById("previewImagenesPrincipales");
  previewContenedor.innerHTML = "";
  imagenesPrincipales = [];

  if (files.length !== 1) {
    mostrarMensaje(message, "⚠️ Solo se permite 1 imagen principal", "warning");
    return;
  }

  try {
    const { url, public_id } = await uploadToBackend(files[0]);
    const mainTalla = document.getElementById("mainTalla").value.trim();
    const mainColor = document.getElementById("mainColor").value.trim();

    imagenesPrincipales.push({
      url,
      cloudinaryId: public_id,
      talla: mainTalla,
      color: mainColor
    });

    const img = document.createElement("img");
    img.src = url;
    img.width = 100;
    img.alt = "Imagen principal";
    img.classList.add("fade-in");
    previewContenedor.appendChild(img);
  } catch (err) {
    console.error("❌", err);
    mostrarMensaje(message, err.message, "error");
  }
});

document.getElementById("addVariante").addEventListener("click", async () => {
  const talla = document.getElementById("talla").value.trim();
  const color = document.getElementById("color").value.trim();
  const imagen = document.getElementById("imagen").files[0];

  if (variantes.length >= 4) return mostrarMensaje(message, "⚠️ Máximo 4 variantes", "warning");
  if (!talla || !color || !imagen) return mostrarMensaje(message, "⚠️ Completa talla, color e imagen", "warning");

  try {
    const { url, public_id } = await uploadToBackend(imagen);
    variantes.push({ talla, color, imageUrl: url, cloudinaryId: public_id });
    renderizarVariantes();
    limpiarCamposVariante();
    mostrarMensaje(message, "✅ Variante agregada", "success");
  } catch (err) {
    console.error(err);
    mostrarMensaje(message, "❌ Error al subir imagen de variante", "error");
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
      <div class="variante-card fade-in">
        <p><strong>Talla:</strong> ${v.talla}</p>
        <p><strong>Color:</strong> ${v.color}</p>
        <img src="${v.imageUrl}" width="100" />
        <button onclick="eliminarVariante(${i})">❌ Eliminar</button>
      </div>
    `;
  });
  if (contadorVariantes) contadorVariantes.textContent = `${variantes.length}/4 variantes`;
}

window.eliminarVariante = (i) => {
  variantes.splice(i, 1);
  renderizarVariantes();
};

function obtenerDatosFormulario() {
  const nombre = document.getElementById("nombre").value.trim();
  const precio = parseFloat(document.getElementById("precio").value);
  const categoria = document.getElementById("categoriaSelect").value;
  const subcategoria = document.getElementById("subcategoriaSelect").value;
  const tallaTipo = document.getElementById("tallaTipoSelect").value;
  const stock = parseInt(document.getElementById("stock").value) || 0;
  const destacado = document.getElementById("featured")?.checked || false;
  const mainTalla = document.getElementById("mainTalla").value.trim();
  const mainColor = document.getElementById("mainColor").value.trim();

  // ✅ Validación corregida (subcategoria bien escrita)
  if (!nombre || isNaN(precio) || !categoria || !subcategoria || !tallaTipo) {
    mostrarMensaje(message, "⚠️ Completa todos los campos obligatorios", "warning");
    return null;
  }

  if (imagenesPrincipales.length !== 1) {
    mostrarMensaje(message, "⚠️ Debes subir 1 imagen principal", "warning");
    return null;
  }

  imagenesPrincipales[0].talla = mainTalla;
  imagenesPrincipales[0].color = mainColor;

  return {
    name: nombre,
    price: precio,
    category,
    subcategory: subcategoria,
    tallaTipo,
    stock,
    featured: destacado,
    variants: variantes,
    images: imagenesPrincipales,
    createdBy: "admin"
  };
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const data = obtenerDatosFormulario();
  if (!data) return;

  const url = editandoId ? `${API_BASE}/${editandoId}` : API_BASE;
  const method = editandoId ? "PUT" : "POST";
  const boton = document.getElementById("btnGuardar");
  boton.disabled = true;
  boton.textContent = "⏳ Guardando...";

  try {
    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || "Error al guardar");
    }

    mostrarMensaje(message, "✅ Producto guardado", "success");
    form.reset();
    variantes = [];
    imagenesPrincipales = [];
    renderizarVariantes();
    cargarProductos();
    editandoId = null;
    document.getElementById("previewImagenesPrincipales").innerHTML = "";
  } catch (err) {
    console.error("❌", err);
    mostrarMensaje(message, err.message, "error");
  } finally {
    resetBoton(boton);
  }
});

function resetBoton(btn) {
  btn.disabled = false;
  btn.textContent = "💾 Guardar Producto";
}

async function cargarProductos() {
  try {
    const res = await fetch(API_BASE);
    const productos = await res.json();
    const lista = document.getElementById("listaProductos");
    lista.innerHTML = "";

    productos.forEach(p => {
      const variantesHtml = p.variants?.map(v => `
        <div><p>${v.talla} - ${v.color}</p><img src="${v.imageUrl}" width="80" /></div>
      `).join("") || "Sin variantes";

      const imagenesHtml = p.images?.map(img => `
        <div style="margin-bottom: 6px;">
          <img src="${img.url}" width="80" />
          ${img.talla || img.color ? `<p><strong>${img.talla || ""} - ${img.color || ""}</strong></p>` : ""}
        </div>
      `).join("") || "";

      lista.innerHTML += `
        <div class="card fade-in">
          <h3>${p.name}</h3>
          <p><strong>Precio:</strong> $${p.price}</p>
          <p><strong>Categoría:</strong> ${p.category}</p>
          <p><strong>Subcategoría:</strong> ${p.subcategory}</p>
          <p><strong>Tipo de talla:</strong> ${p.tallaTipo}</p>
          <p><strong>Stock:</strong> ${p.stock}</p>
          <p><strong>Destacado:</strong> ${p.featured ? "✅" : "❌"}</p>
          <div><strong>Imagen principal:</strong><br>${imagenesHtml}</div>
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

window.editarProducto = async (id) => {
  try {
    const res = await fetch(API_BASE);
    const productos = await res.json();
    const producto = productos.find(p => p._id === id);
    if (!producto) return mostrarMensaje(message, "❌ Producto no encontrado", "error");

    document.getElementById("nombre").value = producto.name;
    document.getElementById("precio").value = producto.price;
    document.getElementById("categoriaSelect").value = producto.category;
    document.getElementById("tallaTipoSelect").value = producto.tallaTipo || "";
    document.getElementById("stock").value = producto.stock;
    document.getElementById("featured").checked = producto.featured;

    const evt = new Event("change");
    document.getElementById("categoriaSelect").dispatchEvent(evt);
    setTimeout(() => {
      document.getElementById("subcategoriaSelect").value = producto.subcategory;
    }, 100);

    variantes = [...producto.variants];
    imagenesPrincipales = producto.images || [];
    renderizarVariantes();

    const previewContenedor = document.getElementById("previewImagenesPrincipales");
    previewContenedor.innerHTML = "";
    imagenesPrincipales.forEach(img => {
      const el = document.createElement("img");
      el.src = img.url;
      el.width = 100;
      previewContenedor.appendChild(el);
    });

    editandoId = id;
    mostrarMensaje(message, "✏️ Editando producto", "info");
  } catch (err) {
    console.error("❌", err);
    mostrarMensaje(message, "❌ Error cargando producto", "error");
  }
};

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

// ▶️ INICIO
cargarCategorias();
cargarProductos();
