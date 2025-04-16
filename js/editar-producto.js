"use strict";

import { verificarSesion, goBack } from "./admin-utils.js";

const token = verificarSesion();
const API_BASE = "https://km-ez-ropa-backend.onrender.com/api";
const productId = new URLSearchParams(window.location.search).get("id");

const API_UPLOAD = `${API_BASE}/uploads`;
const API_PRODUCTO = `${API_BASE}/products/${productId}`;
const API_CATEGORIAS = `${API_BASE}/categories`;

const form = document.getElementById("formEditarProducto");
const msgEstado = document.getElementById("msgEstado");
const variantesDiv = document.getElementById("variantesExistentes");

document.addEventListener("DOMContentLoaded", () => {
  cargarCategorias();
  cargarProducto();

  document.getElementById("btnAgregarVariante")?.addEventListener("click", agregarVariante);
});

/* 📂 Cargar categorías del backend */
async function cargarCategorias() {
  try {
    const res = await fetch(API_CATEGORIAS);
    const categorias = await res.json();

    const select = document.getElementById("categoriaInput");
    categorias.forEach(cat => {
      const option = document.createElement("option");
      option.value = cat.name;
      option.textContent = cat.name;
      select.appendChild(option);
    });
  } catch (err) {
    console.error("❌ Error al cargar categorías", err);
  }
}

/* 🧾 Cargar datos del producto */
async function cargarProducto() {
  try {
    const res = await fetch(API_PRODUCTO);
    const p = await res.json();

    document.getElementById("nombreInput").value = p.name || "";
    document.getElementById("descripcionInput").value = p.description || "";
    document.getElementById("precioInput").value = p.price || "";
    document.getElementById("stockInput").value = p.stock || 0;
    document.getElementById("categoriaInput").value = p.category || "";
    document.getElementById("tallasInput").value = p.sizes?.join(", ") || "";
    document.getElementById("colorInput").value = p.color || "#000000";

    if (Array.isArray(p.images) && p.images.length > 0) {
      document.getElementById("imagenPrincipalActual").innerHTML = `
        <img src="${p.images[0].url}" alt="Imagen actual" class="preview-mini" />
      `;
    }

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
    msgEstado.textContent = "❌ Error al cargar producto.";
  }
}

/* 📤 Subir imagen a Cloudinary */
async function subirImagen(file) {
  const fd = new FormData();
  fd.append("image", file);

  const res = await fetch(API_UPLOAD, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: fd
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Error subiendo imagen");

  return {
    url: data.url || data.secure_url,
    cloudinaryId: data.public_id
  };
}

/* ➕ Agregar variante */
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
  variantesDiv.appendChild(div);
}

/* 💾 Guardar Cambios */
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  msgEstado.textContent = "⏳ Guardando cambios...";

  try {
    const nombre = document.getElementById("nombreInput").value.trim();
    const descripcion = document.getElementById("descripcionInput").value.trim();
    const precio = parseFloat(document.getElementById("precioInput").value);
    const stock = parseInt(document.getElementById("stockInput").value);
    const categoria = document.getElementById("categoriaInput").value;
    const color = document.getElementById("colorInput").value;
    const sizes = document.getElementById("tallasInput").value.split(",").map(s => s.trim()).filter(Boolean);

    const nuevaImg = document.getElementById("imagenPrincipalNueva").files[0];
    let nuevaImagen = null;
    if (nuevaImg) {
      nuevaImagen = await subirImagen(nuevaImg);
    }

    const variantes = [];
    const bloques = document.querySelectorAll(".variante-box");

    for (const b of bloques) {
      const file = b.querySelector(".variante-img")?.files[0];
      const color = b.querySelector(".variante-color")?.value || "#000";
      const talla = b.querySelector(".variante-talla")?.value || "";
      const stock = parseInt(b.querySelector(".variante-stock")?.value || "0");
      const cloudinaryId = b.querySelector(".variante-id")?.value;

      let imageUrl = null;
      let finalCloudinaryId = cloudinaryId;

      if (file) {
        const subida = await subirImagen(file);
        imageUrl = subida.url;
        finalCloudinaryId = subida.cloudinaryId;
      }

      variantes.push({
        imageUrl,
        cloudinaryId: finalCloudinaryId,
        color,
        talla,
        stock
      });
    }

    const payload = {
      name: nombre,
      description: descripcion,
      price: precio,
      stock,
      category: categoria,
      color,
      sizes,
      variants: variantes
    };

    if (nuevaImagen) {
      payload.images = [nuevaImagen];
    }

    const res = await fetch(API_PRODUCTO, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    const result = await res.json();

    if (!res.ok) throw new Error(result.message || "No se pudo actualizar");

    msgEstado.textContent = "✅ Producto actualizado con éxito.";

  } catch (err) {
    console.error("❌", err);
    msgEstado.textContent = `❌ ${err.message}`;
  }
});

// Global
window.goBack = goBack;
