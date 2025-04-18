"use strict";

import { verificarSesion, goBack, mostrarMensaje } from "./admin-utils.js";
import { API_BASE } from "./config.js";

// 🔐 Verificar sesión
const token = verificarSesion();

// Endpoints
const API_PRODUCTS = `${API_BASE}/api/products`;
const API_CATEGORIES = `${API_BASE}/api/categories`;
const API_UPLOADS = `${API_BASE}/api/uploads`;

// DOM Elements
const form = document.getElementById("formProducto");
const imagenInput = document.getElementById("imagenPrincipalInput");
const previewPrincipal = document.getElementById("previewPrincipal");
const variantesContainer = document.getElementById("variantesContainer");
const btnAgregarVariante = document.getElementById("btnAgregarVariante");
const categoriaInput = document.getElementById("categoriaInput");
const msgEstado = document.getElementById("msgEstado");

let variantes = [];

document.addEventListener("DOMContentLoaded", async () => {
  await cargarCategorias();
  agregarVariante(); // inicial
  if (localStorage.getItem("modoOscuro") === "true") {
    document.body.classList.add("modo-oscuro");
  }
});

// 📷 Vista previa
imagenInput.addEventListener("change", () => {
  const file = imagenInput.files[0];
  if (!file) return;
  if (!file.type.startsWith("image/")) return mostrarMensaje("⚠️ Archivo no válido", "error");
  if (file.size > 2 * 1024 * 1024) return mostrarMensaje("⚠️ Imagen supera 2MB", "error");

  const url = URL.createObjectURL(file);
  previewPrincipal.innerHTML = `<img src="${url}" alt="Vista previa imagen" />`;
});

// 🗂️ Cargar categorías
async function cargarCategorias() {
  try {
    const res = await fetch(API_CATEGORIES);
    const data = await res.json();
    if (!res.ok || !Array.isArray(data)) throw new Error();

    categoriaInput.innerHTML = `<option value="">Selecciona categoría</option>` +
      data.map(cat => `<option value="${cat.name}">${cat.name}</option>`).join("");

  } catch (err) {
    console.error("❌ Error categorías:", err);
    mostrarMensaje("❌ No se pudieron cargar las categorías", "error");
  }
}

// ➕ Agregar nueva variante
btnAgregarVariante.addEventListener("click", () => agregarVariante());

function agregarVariante() {
  const index = variantes.length;
  const div = document.createElement("div");
  div.className = "variante-item";
  div.innerHTML = `
    <label>Color Variante:</label>
    <input type="color" name="colorVariante${index}" required />

    <label>Imagen:</label>
    <input type="file" name="imagenVariante${index}" accept="image/*" />

    <label>Stock:</label>
    <input type="number" name="stockVariante${index}" min="0" value="0" required />

    <button type="button" class="btn-secundario" onclick="this.parentElement.remove()">❌ Quitar</button>
    <hr />
  `;
  variantesContainer.appendChild(div);
  variantes.push(index);
}

// ☁️ Subida de imagen
async function subirImagen(file) {
  const formData = new FormData();
  formData.append("image", file);

  const res = await fetch(API_UPLOADS, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Error al subir imagen");
  return data.url || data.secure_url;
}

// 📤 Envío del producto
form.addEventListener("submit", async e => {
  e.preventDefault();

  const nombre = form.nombreInput.value.trim();
  const descripcion = form.descripcionInput.value.trim();
  const precio = parseFloat(form.precioInput.value);
  const stock = parseInt(form.stockInput.value);
  const categoria = categoriaInput.value;
  const color = form.colorInput.value;
  const tallas = form.tallasInput.value.split(",").map(t => t.trim()).filter(Boolean);
  const filePrincipal = imagenInput.files[0];

  if (!filePrincipal) return mostrarMensaje("⚠️ Imagen principal requerida", "error");
  if (!nombre || !descripcion || isNaN(precio) || isNaN(stock) || !categoria)
    return mostrarMensaje("⚠️ Completa todos los campos obligatorios", "error");

  try {
    msgEstado.textContent = "⏳ Subiendo imagen principal...";
    const imagenURL = await subirImagen(filePrincipal);

    const variantesFinales = [];

    for (const v of variantesContainer.querySelectorAll(".variante-item")) {
      const colorInput = v.querySelector("input[type='color']");
      const stockInput = v.querySelector("input[type='number']");
      const fileInput = v.querySelector("input[type='file']");

      let imageURL = "";

      if (fileInput?.files.length) {
        const file = fileInput.files[0];
        if (!file.type.startsWith("image/")) {
          return mostrarMensaje("⚠️ Imagen variante no válida", "error");
        }
        if (file.size > 2 * 1024 * 1024) {
          return mostrarMensaje("⚠️ Variante excede tamaño máximo", "error");
        }

        msgEstado.textContent = "⏳ Subiendo imagen de variante...";
        imageURL = await subirImagen(file);
      }

      variantesFinales.push({
        color: colorInput.value,
        stock: parseInt(stockInput.value) || 0,
        imageUrl: imageURL || null
      });
    }

    // 📦 Enviar producto
    const nuevoProducto = {
      name: nombre,
      description: descripcion,
      price: precio,
      stock,
      image: imagenURL,
      category: categoria,
      color,
      sizes: tallas,
      variants: variantesFinales
    };

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

    mostrarMensaje("✅ Producto creado correctamente", "success");
    form.reset();
    previewPrincipal.innerHTML = "";
    variantesContainer.innerHTML = "";
    variantes = [];
    agregarVariante();

  } catch (err) {
    console.error("❌ Error al crear producto:", err);
    mostrarMensaje("❌ " + err.message, "error");
  }
});
