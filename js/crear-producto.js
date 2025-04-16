"use strict";

import { verificarSesion, goBack, mostrarMensaje } from "./admin-utils.js";
import { API_BASE } from "./config.js";

// 🔐 Autenticación
const token = verificarSesion();

// Endpoints
const API_PRODUCTS = `${API_BASE}/products`;
const API_CATEGORIES = `${API_BASE}/categories`;
const API_UPLOADS = `${API_BASE}/uploads`;

// Elementos del DOM
const form = document.getElementById("formProducto");
const imagenInput = document.getElementById("imagenPrincipalInput");
const previewPrincipal = document.getElementById("previewPrincipal");
const variantesContainer = document.getElementById("variantesContainer");
const btnAgregarVariante = document.getElementById("btnAgregarVariante");
const categoriaInput = document.getElementById("categoriaInput");
const msgEstado = document.getElementById("msgEstado");

let variantes = [];

// 🚀 Carga inicial
document.addEventListener("DOMContentLoaded", async () => {
  await cargarCategorias();
  agregarVariante();
  restaurarModoOscuro();
});

// 🌗 Soporte para modo oscuro persistente
function restaurarModoOscuro() {
  if (localStorage.getItem("modoOscuro") === "true") {
    document.body.classList.add("modo-oscuro");
  }
}

// 📸 Previsualizar imagen principal
imagenInput.addEventListener("change", () => {
  const file = imagenInput.files[0];
  if (!file) return;
  const url = URL.createObjectURL(file);
  previewPrincipal.innerHTML = `<img src="${url}" alt="Vista previa" />`;
});

// 📂 Cargar categorías desde backend
async function cargarCategorias() {
  try {
    const res = await fetch(API_CATEGORIES);
    const data = await res.json();

    if (!res.ok) throw new Error("No se pudieron obtener categorías");

    categoriaInput.innerHTML += data
      .map(c => `<option value="${c.name}">${c.name}</option>`)
      .join("");
  } catch (err) {
    console.error("❌ Error al cargar categorías:", err);
    mostrarMensaje("❌ No se pudieron cargar las categorías", "error");
  }
}

// ➕ Agregar variante de producto
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

// 💾 Subir imagen a servidor
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

  return data.url;
}

// ✅ Guardar producto
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const nombre = document.getElementById("nombreInput").value.trim();
  const descripcion = document.getElementById("descripcionInput").value.trim();
  const precio = parseFloat(document.getElementById("precioInput").value);
  const stock = parseInt(document.getElementById("stockInput").value);
  const categoria = categoriaInput.value;
  const color = document.getElementById("colorInput").value;
  const tallas = document.getElementById("tallasInput").value
    .split(",")
    .map(t => t.trim())
    .filter(Boolean);

  const filePrincipal = imagenInput.files[0];
  if (!filePrincipal) return mostrarMensaje("⚠️ La imagen principal es obligatoria", "error");

  try {
    msgEstado.textContent = "⏳ Subiendo imagen principal...";
    const imagenURL = await subirImagen(filePrincipal);

    // 📦 Procesar variantes
    const variantesFinales = [];
    const variantesElems = variantesContainer.querySelectorAll(".variante-item");

    for (const variante of variantesElems) {
      const colorInput = variante.querySelector(`input[type="color"]`);
      const stockInput = variante.querySelector(`input[type="number"]`);
      const imgInput = variante.querySelector(`input[type="file"]`);

      let varImgURL = "";

      if (imgInput?.files.length) {
        msgEstado.textContent = "⏳ Subiendo imagen de variante...";
        varImgURL = await subirImagen(imgInput.files[0]);
      }

      variantesFinales.push({
        color: colorInput.value,
        stock: parseInt(stockInput.value) || 0,
        image: varImgURL
      });
    }

    // 📦 Crear producto final
    const nuevoProducto = {
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
      body: JSON.stringify(nuevoProducto)
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "No se pudo guardar el producto");

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
