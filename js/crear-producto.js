"use strict";

import { verificarSesion, goBack } from "./admin-utils.js";

const token = verificarSesion();
const API_BASE = "https://km-ez-ropa-backend.onrender.com/api";
const cloudinaryUploadUrl = `${API_BASE}/upload`;

// DOM Elements
const form = document.getElementById("formProducto");
const imagenPrincipalInput = document.getElementById("imagenPrincipalInput");
const previewPrincipal = document.getElementById("previewPrincipal");
const variantesContainer = document.getElementById("variantesContainer");
const btnAgregarVariante = document.getElementById("btnAgregarVariante");
const msgEstado = document.getElementById("msgEstado");

// Cargar categorías al iniciar
document.addEventListener("DOMContentLoaded", async () => {
  try {
    const res = await fetch(`${API_BASE}/categories`);
    const categorias = await res.json();
    const select = document.getElementById("categoriaInput");

    categorias.forEach(cat => {
      const option = document.createElement("option");
      option.value = cat._id;
      option.textContent = cat.name;
      select.appendChild(option);
    });

  } catch (err) {
    console.error("Error cargando categorías", err);
  }
});

// Vista previa de imagen principal
imagenPrincipalInput.addEventListener("change", e => {
  const file = e.target.files[0];
  if (!file) return;

  const img = document.createElement("img");
  img.src = URL.createObjectURL(file);
  img.className = "preview-mini";
  previewPrincipal.innerHTML = "";
  previewPrincipal.appendChild(img);
});

// Añadir variante dinámica
btnAgregarVariante.addEventListener("click", () => {
  const div = document.createElement("div");
  div.className = "variante-box";
  div.innerHTML = `
    <label>Imagen Variante:</label>
    <input type="file" class="variante-img" accept="image/*" required />
    <label>Color:</label>
    <input type="color" class="variante-color" required />
    <label>Talla:</label>
    <input type="text" class="variante-talla" required />
    <label>Stock:</label>
    <input type="number" class="variante-stock" min="0" required />
    <hr />
  `;
  variantesContainer.appendChild(div);
});

// 🧠 Subir imagen a Cloudinary vía backend
async function subirImagen(file) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(cloudinaryUploadUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Error al subir imagen");
  return {
    url: data.secure_url,
    cloudinaryId: data.public_id
  };
}

// 📤 Enviar producto
form.addEventListener("submit", async e => {
  e.preventDefault();
  msgEstado.textContent = "Subiendo imágenes...";

  try {
    // 1. Subir imagen principal
    const imgFile = imagenPrincipalInput.files[0];
    if (!imgFile) throw new Error("Imagen principal requerida");
    const imagenPrincipal = await subirImagen(imgFile);

    // 2. Procesar variantes
    const variantes = [];
    const bloques = variantesContainer.querySelectorAll(".variante-box");

    for (const bloque of bloques) {
      const fileInput = bloque.querySelector(".variante-img");
      const color = bloque.querySelector(".variante-color").value;
      const talla = bloque.querySelector(".variante-talla").value.trim();
      const stock = parseInt(bloque.querySelector(".variante-stock").value);

      const file = fileInput.files[0];
      const img = await subirImagen(file);

      variantes.push({
        imageUrl: img.url,
        cloudinaryId: img.cloudinaryId,
        color,
        talla,
        stock
      });
    }

    // 3. Obtener otros datos
    const producto = {
      name: document.getElementById("nombreInput").value.trim(),
      description: document.getElementById("descripcionInput").value.trim(),
      price: parseFloat(document.getElementById("precioInput").value),
      stock: parseInt(document.getElementById("stockInput").value),
      category: document.getElementById("categoriaInput").value,
      tallas: document.getElementById("tallasInput").value.split(",").map(t => t.trim()).filter(Boolean),
      color: document.getElementById("colorInput").value,
      images: [imagenPrincipal],
      variants: variantes
    };

    // 4. Enviar al backend
    const res = await fetch(`${API_BASE}/products`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(producto)
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "No se pudo crear el producto");
    }

    msgEstado.textContent = "✅ Producto creado con éxito.";
    form.reset();
    previewPrincipal.innerHTML = "";
    variantesContainer.innerHTML = "";

  } catch (err) {
    console.error("Error:", err);
    msgEstado.textContent = "❌ " + err.message;
  }
});

// Exportar para HTML
window.goBack = goBack;
