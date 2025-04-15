"use strict";

import { verificarSesion, goBack } from "./admin-utils.js";

const token = verificarSesion();
const API_BASE = "https://km-ez-ropa-backend.onrender.com/api";
const productId = new URLSearchParams(window.location.search).get("id");
const uploadEndpoint = `${API_BASE}/upload`;
const productoEndpoint = `${API_BASE}/products/${productId}`;

const form = document.getElementById("formEditarProducto");
const msgEstado = document.getElementById("msgEstado");

document.addEventListener("DOMContentLoaded", () => {
  cargarCategorias();
  cargarProducto();
  document.getElementById("btnAgregarVariante").addEventListener("click", agregarVariante);
});

// 🔄 Cargar categorías disponibles
async function cargarCategorias() {
  const res = await fetch(`${API_BASE}/categories`);
  const data = await res.json();
  const select = document.getElementById("categoriaInput");

  data.forEach(cat => {
    const option = document.createElement("option");
    option.value = cat._id;
    option.textContent = cat.name;
    select.appendChild(option);
  });
}

// 🔄 Cargar producto actual
async function cargarProducto() {
  try {
    const res = await fetch(productoEndpoint);
    const p = await res.json();

    document.getElementById("nombreInput").value = p.name;
    document.getElementById("descripcionInput").value = p.description;
    document.getElementById("precioInput").value = p.price;
    document.getElementById("stockInput").value = p.stock;
    document.getElementById("categoriaInput").value = p.category;
    document.getElementById("tallasInput").value = p.tallas?.join(", ") || "";
    document.getElementById("colorInput").value = p.color || "#000000";

    // Imagen principal actual
    const cont = document.getElementById("imagenPrincipalActual");
    cont.innerHTML = `<img src="${p.images[0].url}" class="preview-mini" />`;

    // Variantes existentes
    const variantesDiv = document.getElementById("variantesExistentes");
    p.variants?.forEach((v, i) => {
      const div = document.createElement("div");
      div.className = "variante-box";
      div.innerHTML = `
        <p><strong>Variante #${i + 1}</strong></p>
        <img src="${v.imageUrl}" class="preview-mini" />
        <label>Reemplazar imagen:</label>
        <input type="file" class="variante-img" accept="image/*" />
        <label>Color:</label>
        <input type="color" class="variante-color" value="${v.color}" />
        <label>Talla:</label>
        <input type="text" class="variante-talla" value="${v.talla}" />
        <label>Stock:</label>
        <input type="number" class="variante-stock" min="0" value="${v.stock}" />
        <input type="hidden" class="variante-id" value="${v.cloudinaryId}" />
        <hr />
      `;
      variantesDiv.appendChild(div);
    });

  } catch (err) {
    console.error("❌ Error al cargar producto:", err);
    msgEstado.textContent = "❌ No se pudo cargar el producto.";
  }
}

// ⬆️ Subir imagen
async function subirImagen(file) {
  const fd = new FormData();
  fd.append("file", file);

  const res = await fetch(uploadEndpoint, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: fd
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Error al subir imagen");
  return { url: data.secure_url, cloudinaryId: data.public_id };
}

// ➕ Añadir nueva variante
function agregarVariante() {
  const div = document.createElement("div");
  div.className = "variante-box";
  div.innerHTML = `
    <p><strong>Nueva Variante</strong></p>
    <label>Imagen:</label>
    <input type="file" class="variante-img" accept="image/*" required />
    <label>Color:</label>
    <input type="color" class="variante-color" required />
    <label>Talla:</label>
    <input type="text" class="variante-talla" required />
    <label>Stock:</label>
    <input type="number" class="variante-stock" min="0" required />
    <hr />
  `;
  document.getElementById("variantesExistentes").appendChild(div);
}

// 💾 Guardar cambios
form.addEventListener("submit", async e => {
  e.preventDefault();
  msgEstado.textContent = "⏳ Guardando cambios...";

  try {
    const nombre = document.getElementById("nombreInput").value.trim();
    const descripcion = document.getElementById("descripcionInput").value.trim();
    const precio = parseFloat(document.getElementById("precioInput").value);
    const stock = parseInt(document.getElementById("stockInput").value);
    const categoria = document.getElementById("categoriaInput").value;
    const tallas = document.getElementById("tallasInput").value.split(",").map(t => t.trim()).filter(Boolean);
    const color = document.getElementById("colorInput").value;

    const nuevaImagen = document.getElementById("imagenPrincipalNueva").files[0];
    let imagen = null;

    if (nuevaImagen) {
      imagen = await subirImagen(nuevaImagen);
    }

    const variantes = [];
    const bloques = document.querySelectorAll("#variantesExistentes .variante-box");

    for (const b of bloques) {
      const file = b.querySelector(".variante-img")?.files[0];
      const color = b.querySelector(".variante-color").value;
      const talla = b.querySelector(".variante-talla").value;
      const stock = parseInt(b.querySelector(".variante-stock").value);
      const cloudinaryId = b.querySelector(".variante-id")?.value;

      let imagenVariante = { imageUrl: null, cloudinaryId: null };
      if (file) {
        imagenVariante = await subirImagen(file);
      }

      variantes.push({
        imageUrl: imagenVariante.url,
        cloudinaryId: imagenVariante.cloudinaryId || cloudinaryId,
        color,
        talla,
        stock
      });
    }

    const dataEnviar = {
      name: nombre,
      description: descripcion,
      price: precio,
      stock,
      category: categoria,
      tallas,
      color,
      ...(imagen && { images: [imagen] }),
      variants: variantes
    };

    const res = await fetch(productoEndpoint, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(dataEnviar)
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "No se pudo actualizar");
    }

    msgEstado.textContent = "✅ Producto actualizado correctamente.";

  } catch (err) {
    console.error("❌", err);
    msgEstado.textContent = "❌ " + err.message;
  }
});

// global
window.goBack = goBack;
