"use strict";

import { verificarSesion, goBack, mostrarMensaje } from "./admin-utils.js";
import { API_BASE } from "./config.js";


// 🔐 Verifica sesión admin
const token = verificarSesion();

const API_PRODUCTS = "https://km-ez-ropa-backend.onrender.com/api/products";
const API_CATEGORIES = "https://km-ez-ropa-backend.onrender.com/api/categories";
const API_UPLOADS = "https://km-ez-ropa-backend.onrender.com/api/uploads";

const form = document.getElementById("formProducto");
const imagenInput = document.getElementById("imagenPrincipalInput");
const previewPrincipal = document.getElementById("previewPrincipal");
const variantesContainer = document.getElementById("variantesContainer");
const btnAgregarVariante = document.getElementById("btnAgregarVariante");
const categoriaInput = document.getElementById("categoriaInput");
const msgEstado = document.getElementById("msgEstado");

let variantes = [];

// === CARGA INICIAL ===
document.addEventListener("DOMContentLoaded", async () => {
  await cargarCategorias();
  agregarVariante(); // Mínimo 1 variante visible
});

// === PREVISUALIZAR IMAGEN ===
imagenInput.addEventListener("change", () => {
  const file = imagenInput.files[0];
  if (!file) return;
  const url = URL.createObjectURL(file);
  previewPrincipal.innerHTML = `<img src="${url}" alt="Preview Imagen" />`;
});

// === CARGAR CATEGORÍAS ===
async function cargarCategorias() {
  try {
    const res = await fetch(API_CATEGORIES);
    const data = await res.json();

    if (!res.ok) throw new Error("Error al cargar categorías");

    categoriaInput.innerHTML += data.map(c => `<option value="${c.name}">${c.name}</option>`).join('');
  } catch (err) {
    console.error("❌", err);
    mostrarMensaje("❌ No se pudieron cargar las categorías", "error");
  }
}

// === AÑADIR VARIANTE ===
btnAgregarVariante.addEventListener("click", () => agregarVariante());

function agregarVariante() {
  const index = variantes.length;
  const div = document.createElement("div");
  div.classList.add("variante-item");
  div.innerHTML = `
    <label>Color Variante:</label>
    <input type="color" name="colorVariante${index}" />

    <label>Imagen:</label>
    <input type="file" name="imagenVariante${index}" accept="image/*" />

    <label>Stock:</label>
    <input type="number" name="stockVariante${index}" min="0" value="0" />

    <button type="button" class="btn-secundario" onclick="this.parentElement.remove()">❌ Quitar</button>
    <hr />
  `;
  variantesContainer.appendChild(div);
  variantes.push(index);
}

// === GUARDAR PRODUCTO ===
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const nombre = document.getElementById("nombreInput").value.trim();
  const descripcion = document.getElementById("descripcionInput").value.trim();
  const precio = parseFloat(document.getElementById("precioInput").value);
  const stock = parseInt(document.getElementById("stockInput").value);
  const categoria = categoriaInput.value;
  const color = document.getElementById("colorInput").value;
  const tallas = document.getElementById("tallasInput").value.split(',').map(t => t.trim()).filter(Boolean);

  const filePrincipal = imagenInput.files[0];
  if (!filePrincipal) return mostrarMensaje("⚠️ Imagen principal es obligatoria", "error");

  try {
    msgEstado.textContent = "⏳ Subiendo imagen...";
    const formData = new FormData();
    formData.append("image", filePrincipal);

    const uploadRes = await fetch(API_UPLOADS, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData
    });

    const uploadData = await uploadRes.json();
    if (!uploadRes.ok) throw new Error(uploadData.message || "Error al subir imagen");

    const imagenURL = uploadData.url;

    // Variantes procesadas
    const variantesFinales = [];
    for (let i = 0; i < variantesContainer.children.length; i++) {
      const variante = variantesContainer.children[i];
      const colorInput = variante.querySelector(`input[type="color"]`);
      const stockInput = variante.querySelector(`input[type="number"]`);
      const imgInput = variante.querySelector(`input[type="file"]`);
      const varColor = colorInput?.value;
      const varStock = parseInt(stockInput?.value) || 0;

      let varImgURL = "";

      if (imgInput?.files.length) {
        const varFormData = new FormData();
        varFormData.append("image", imgInput.files[0]);

        const varRes = await fetch(API_UPLOADS, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: varFormData
        });

        const varData = await varRes.json();
        if (!varRes.ok) throw new Error("Error subiendo imagen variante");
        varImgURL = varData.url;
      }

      variantesFinales.push({
        color: varColor,
        stock: varStock,
        image: varImgURL
      });
    }

    // Crear producto final
    const producto = {
      name: nombre,
      description: descripcion,
      price: precio,
      stock,
      image: imagenURL,
      category: categoria,
      color,
      sizes: tallas,
      variantes: variantesFinales
    };

    msgEstado.textContent = "⏳ Guardando producto...";
    const res = await fetch(API_PRODUCTS, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(producto)
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "No se pudo guardar el producto");

    mostrarMensaje("✅ Producto creado exitosamente", "success");
    form.reset();
    previewPrincipal.innerHTML = "";
    variantesContainer.innerHTML = "";
    variantes = [];
    agregarVariante();
  } catch (err) {
    console.error("❌", err);
    mostrarMensaje("❌ " + err.message, "error");
  }
});
