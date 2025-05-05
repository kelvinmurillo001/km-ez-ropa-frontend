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

// 🔗 Endpoints
const API_PRODUCTS = `${API_BASE}/api/products`;
const API_CATEGORIES = `${API_BASE}/api/categories`;
const API_UPLOADS = `${API_BASE}/api/uploads`;

// 🌐 DOM Elements
const form = document.getElementById("formProducto");
const imagenInput = document.getElementById("imagenPrincipalInput");
const previewPrincipal = document.getElementById("previewPrincipal");
const variantesContainer = document.getElementById("variantesContainer");
const btnAgregarVariante = document.getElementById("btnAgregarVariante");
const categoriaInput = document.getElementById("categoriaInput");
const subcategoriaInput = document.getElementById("subcategoriaInput");
const tallaTipoInput = document.getElementById("tallaTipoInput");
const msgEstado = document.getElementById("msgEstado");

let variantes = [];
let categoriasConSubcategorias = [];

// Tallas según tipo
const tallasPorTipo = {
  adulto: ["S", "M", "L", "XL", "XXL"],
  joven: ["S", "M", "L"],
  niño: ["1", "2", "3", "4", "5", "6", "8", "10", "12"],
  niña: ["1", "2", "3", "4", "5", "6", "8", "10", "12"],
  bebé: ["0-3", "3-6", "6-9", "9-12", "12-18", "18-24"]
};

// ▶️ Init
document.addEventListener("DOMContentLoaded", async () => {
  try {
    await cargarCategorias();
    agregarVariante();
    if (localStorage.getItem("modoOscuro") === "true") {
      document.body.classList.add("modo-oscuro");
    }
  } catch (err) {
    mostrarMensaje("❌ Error durante la carga inicial", "error");
  }
});

// 📁 Cargar categorías
async function cargarCategorias() {
  const res = await fetch(API_CATEGORIES);
  const { data } = await res.json();
  if (!res.ok || !Array.isArray(data)) throw new Error("Error al cargar categorías");

  categoriasConSubcategorias = data;
  categoriaInput.innerHTML = `<option value="">Selecciona categoría</option>` +
    data.map(cat => `<option value="${cat.name}">${cat.name}</option>`).join("");

  categoriaInput.addEventListener("change", () => {
    const categoria = categoriasConSubcategorias.find(c => c.name === categoriaInput.value);
    if (!categoria) return;

    subcategoriaInput.innerHTML = categoria.subcategories.length
      ? `<option value="">Selecciona una subcategoría</option>` + categoria.subcategories.map(sub => `<option value="${sub}">${sub}</option>`).join("")
      : `<option value="">Sin subcategorías</option>`;

    subcategoriaInput.disabled = categoria.subcategories.length === 0;
  });
}

// 🖼️ Imagen principal - Preview
imagenInput.addEventListener("change", () => {
  const file = imagenInput.files[0];
  if (!file) return;

  if (!file.type.startsWith("image/")) return mostrarMensaje("⚠️ Archivo inválido", "error");
  if (file.size > 2 * 1024 * 1024) return mostrarMensaje("⚠️ Imagen muy grande (máx. 2MB)", "error");

  const url = URL.createObjectURL(file);
  previewPrincipal.innerHTML = `<img src="${url}" alt="Vista previa" style="max-width:200px; border-radius:8px;" />`;
});

// ➕ Añadir variante
btnAgregarVariante.addEventListener("click", agregarVariante);

function agregarVariante() {
  const index = variantes.length;
  const div = document.createElement("div");
  div.className = "variante-item";
  div.innerHTML = `
    <label>🎨 Color:</label>
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

// ☁️ Subir imagen a Cloudinary
async function subirImagen(file) {
  if (!file || !file.type.startsWith("image/") || file.size > 2 * 1024 * 1024) {
    throw new Error("⚠️ Imagen inválida o demasiado grande");
  }

  const formData = new FormData();
  formData.append("image", file);

  const res = await fetch(API_UPLOADS, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Error al subir imagen");

  return {
    url: data.url || data.secure_url,
    cloudinaryId: data.public_id
  };
}

// 💾 Crear producto
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  form.classList.add("bloqueado");
  msgEstado.textContent = "";

  try {
    const nombre = form.nombreInput.value.trim();
    const descripcion = form.descripcionInput.value.trim();
    const precio = parseFloat(form.precioInput.value);
    const categoria = categoriaInput.value;
    const subcategoria = subcategoriaInput?.value || "";
    const tallaTipo = tallaTipoInput.value;
    const destacado = document.getElementById("destacadoInput")?.checked || false;
    const filePrincipal = imagenInput.files[0];

    if (!filePrincipal) return mostrarMensaje("⚠️ Imagen principal requerida", "error");

    msgEstado.textContent = "📤 Subiendo imagen principal...";
    const imagenPrincipal = await subirImagen(filePrincipal);

    const variantesFinales = [];
    const claves = new Set();

    for (const v of variantesContainer.querySelectorAll(".variante-item")) {
      const color = v.querySelector("input[name^='color']")?.value.trim().toLowerCase();
      const talla = v.querySelector("input[name^='talla']")?.value.trim().toUpperCase();
      const stock = parseInt(v.querySelector("input[type='number']")?.value) || 0;
      const fileInput = v.querySelector("input[type='file']");

      if (!fileInput?.files.length || !color || !talla) {
        throw new Error("⚠️ Todos los campos de variantes son obligatorios.");
      }

      const clave = `${color}-${talla}`;
      if (claves.has(clave)) throw new Error("⚠️ Variante duplicada (color + talla)");
      claves.add(clave);

      const subida = await subirImagen(fileInput.files[0]);

      variantesFinales.push({
        imageUrl: subida.url,
        cloudinaryId: subida.cloudinaryId,
        color,
        talla,
        stock
      });
    }

    const nuevoProducto = {
      name: nombre,
      description: descripcion,
      price: precio,
      category: categoria,
      subcategory,
      tallaTipo,
      featured: destacado,
      variants: variantesFinales,
      images: [{
        url: imagenPrincipal.url,
        cloudinaryId: imagenPrincipal.cloudinaryId,
        talla: "única",
        color: "principal"
      }],
      createdBy: user?.name || "admin"
    };

    msgEstado.textContent = "💾 Guardando producto...";
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
  } finally {
    form.classList.remove("bloqueado");
  }
});

window.goBack = goBack;
