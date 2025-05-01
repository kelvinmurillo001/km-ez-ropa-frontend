"use strict";

import {
  verificarSesion,
  goBack,
  mostrarMensaje,
  getUsuarioActivo
} from "./admin-utils.js";
import { API_BASE } from "./config.js";

// 🔐 Seguridad
const token = verificarSesion();
const user = getUsuarioActivo();

// 🌐 Endpoints
const API_PRODUCTS = `${API_BASE}/api/products`;
const API_CATEGORIES = `${API_BASE}/api/categories`;
const API_UPLOADS = `${API_BASE}/api/uploads`;

// 📦 DOM Elements
const form = document.getElementById("formProducto");
const imagenInput = document.getElementById("imagenPrincipalInput");
const previewPrincipal = document.getElementById("previewPrincipal");
const variantesContainer = document.getElementById("variantesContainer");
const btnAgregarVariante = document.getElementById("btnAgregarVariante");
const categoriaInput = document.getElementById("categoriaInput");
const subcategoriaInput = document.getElementById("subcategoriaInput");
const tallaTipoInput = document.getElementById("tallaTipoInput");
const tallasInput = document.getElementById("tallasInput");
const msgEstado = document.getElementById("msgEstado");

let variantes = [];
let categoriasConSubcategorias = [];

const tallasPorTipo = {
  adulto: ["S", "M", "L", "XL", "XXL"],
  joven: ["S", "M", "L"],
  niño: ["1", "2", "3", "4", "5", "6", "8", "10", "12"],
  niña: ["1", "2", "3", "4", "5", "6", "8", "10", "12"],
  bebé: ["0-3", "3-6", "6-9", "9-12", "12-18", "18-24"]
};

// 🚀 Init
document.addEventListener("DOMContentLoaded", async () => {
  await cargarCategorias();
  agregarVariante();

  if (localStorage.getItem("modoOscuro") === "true") {
    document.body.classList.add("modo-oscuro");
  }
});

// 🧠 Lógica de tallas automáticas
tallaTipoInput.addEventListener("change", () => {
  const tipo = tallaTipoInput.value.toLowerCase();
  tallasInput.value = tallasPorTipo[tipo]?.join(", ") || "";
});

// 🖼️ Preview de imagen principal
imagenInput.addEventListener("change", () => {
  const file = imagenInput.files[0];
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    return mostrarMensaje("⚠️ Archivo no es una imagen", "error");
  }

  if (file.size > 2 * 1024 * 1024) {
    return mostrarMensaje("⚠️ Imagen demasiado pesada (máx. 2MB)", "error");
  }

  const url = URL.createObjectURL(file);
  previewPrincipal.innerHTML = `<img src="${url}" alt="Vista previa" style="max-width:200px; border-radius:8px;" />`;
});

// 🗂️ Cargar categorías y subcategorías
async function cargarCategorias() {
  try {
    const res = await fetch(API_CATEGORIES);
    const { data } = await res.json();

    if (!res.ok || !Array.isArray(data)) throw new Error();

    categoriasConSubcategorias = data;

    categoriaInput.innerHTML =
      `<option value="">Selecciona categoría</option>` +
      data.map(cat => `<option value="${cat.name}">${cat.name}</option>`).join("");

    categoriaInput.addEventListener("change", () => {
      subcategoriaInput.innerHTML = `<option value="">Selecciona una subcategoría</option>`;
      const seleccionada = categoriaInput.value;
      const cat = categoriasConSubcategorias.find(c => c.name === seleccionada);

      if (cat?.subcategories?.length) {
        subcategoriaInput.innerHTML += cat.subcategories.map(sub =>
          `<option value="${sub}">${sub}</option>`).join("");
        subcategoriaInput.disabled = false;
      } else {
        subcategoriaInput.innerHTML = `<option value="">Sin subcategorías</option>`;
        subcategoriaInput.disabled = true;
      }
    });
  } catch (err) {
    console.error("❌ Error cargando categorías:", err);
    mostrarMensaje("❌ No se pudieron cargar las categorías", "error");
  }
}

// ➕ Agregar nueva variante
btnAgregarVariante.addEventListener("click", agregarVariante);

function agregarVariante() {
  const index = variantes.length;
  const div = document.createElement("div");
  div.className = "variante-item";
  div.innerHTML = `
    <label>Color Variante:</label>
    <input type="text" name="colorVariante${index}" required />
    <label>Talla:</label>
    <input type="text" name="tallaVariante${index}" required />
    <label>Imagen:</label>
    <input type="file" name="imagenVariante${index}" accept="image/*" required />
    <label>Stock:</label>
    <input type="number" name="stockVariante${index}" min="0" value="0" required />
    <button type="button" class="btn-secundario" onclick="this.parentElement.remove()">❌ Quitar</button>
    <hr />
  `;
  variantesContainer.appendChild(div);
  variantes.push(index);
}

// ☁️ Subir imagen al servidor
async function subirImagen(file) {
  if (!file || !file.type.startsWith("image/") || file.size > 2 * 1024 * 1024) {
    throw new Error("⚠️ Imagen inválida o demasiado grande");
  }

  const token = localStorage.getItem("admin_token");
  if (!token) {
    alert("⛔ Tu sesión expiró. Vuelve a iniciar sesión.");
    window.location.href = "/login.html";
    throw new Error("⛔ Token ausente o inválido");
  }

  const formData = new FormData();
  formData.append("image", file);

  const res = await fetch(API_UPLOADS, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData
  });

  if (res.status === 401) {
    localStorage.clear();
    alert("⛔ Tu sesión expiró. Inicia sesión nuevamente.");
    window.location.href = "/login.html";
    throw new Error("⛔ Token expirado o inválido");
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Error al subir imagen");

  return {
    url: data.url || data.secure_url,
    cloudinaryId: data.public_id
  };
}

// 💾 Guardar producto
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  try {
    const nombre = form.nombreInput.value.trim();
    const descripcion = form.descripcionInput.value.trim();
    const precio = parseFloat(form.precioInput.value);
    const categoria = categoriaInput.value;
    const subcategoria = subcategoriaInput?.value || "";
    const tallaTipo = tallaTipoInput.value;
    const color = form.colorInput.value.trim();
    const tallas = form.tallasInput.value.split(",").map(t => t.trim()).filter(Boolean);
    const destacado = document.getElementById("destacadoInput")?.checked || false;
    const filePrincipal = imagenInput.files[0];

    if (!filePrincipal) return mostrarMensaje("⚠️ Imagen principal requerida", "error");
    if (!nombre || !descripcion || isNaN(precio) || !categoria || !tallaTipo) {
      return mostrarMensaje("⚠️ Completa todos los campos obligatorios", "error");
    }

    msgEstado.textContent = "⏳ Subiendo imagen principal...";
    const imagenPrincipal = await subirImagen(filePrincipal);

    const variantesFinales = [];

    for (const v of variantesContainer.querySelectorAll(".variante-item")) {
      const colorInput = v.querySelector("input[name^='color']");
      const tallaInput = v.querySelector("input[name^='talla']");
      const stockInput = v.querySelector("input[type='number']");
      const fileInput = v.querySelector("input[type='file']");

      if (!fileInput.files.length) continue;

      const file = fileInput.files[0];
      msgEstado.textContent = "⏳ Subiendo imagen de variante...";
      const subida = await subirImagen(file);

      variantesFinales.push({
        imageUrl: subida.url,
        cloudinaryId: subida.cloudinaryId,
        color: colorInput.value.trim(),
        talla: tallaInput.value.trim(),
        stock: parseInt(stockInput.value) || 0
      });
    }

    const usarStockDirecto = variantesFinales.length === 0;
    const stock = usarStockDirecto ? parseInt(form.stockInput.value || "0") : undefined;

    const nuevoProducto = {
      name: nombre,
      description: descripcion,
      price: precio,
      category: categoria,
      subcategory: subcategoria,
      tallaTipo,
      color,
      sizes: tallas,
      featured: destacado,
      variants: variantesFinales,
      images: [{
        url: imagenPrincipal.url,
        cloudinaryId: imagenPrincipal.cloudinaryId,
        talla: tallas[0] || "única",
        color
      }],
      createdBy: user?.name || "admin"
    };

    if (usarStockDirecto) nuevoProducto.stock = stock;

    msgEstado.textContent = "⏳ Guardando producto...";
    const res = await fetch(API_PRODUCTS, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(nuevoProducto)
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "No se pudo crear el producto");

    mostrarMensaje("✅ Producto creado exitosamente", "success");
    form.reset();
    previewPrincipal.innerHTML = "";
    variantesContainer.innerHTML = "";
    variantes = [];
    agregarVariante();
    msgEstado.textContent = "";

  } catch (err) {
    console.error("❌", err);
    mostrarMensaje("❌ " + err.message, "error");
    msgEstado.textContent = "";
  }
});

window.goBack = goBack;
