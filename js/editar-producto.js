"use strict";

import { verificarSesion, goBack } from "./admin-utils.js";
import { API_BASE } from "./config.js";

const token = verificarSesion();
const productId = new URLSearchParams(window.location.search).get("id");

if (!productId) {
  alert("❌ ID de producto no válido.");
  goBack();
}

const API_UPLOAD = `${API_BASE}/uploads`;
const API_PRODUCTO = `${API_BASE}/products/${productId}`;
const API_CATEGORIAS = `${API_BASE}/categories`;

const form = document.getElementById("formEditarProducto");
const msgEstado = document.getElementById("msgEstado");
const variantesDiv = document.getElementById("variantesExistentes");

document.addEventListener("DOMContentLoaded", () => {
  if (localStorage.getItem("modoOscuro") === "true") {
    document.body.classList.add("modo-oscuro");
  }

  cargarCategorias();
  cargarProducto();

  document.getElementById("btnAgregarVariante")?.addEventListener("click", agregarVariante);
});

async function cargarCategorias() {
  try {
    const res = await fetch(API_CATEGORIAS);
    const categorias = await res.json();

    const select = document.getElementById("categoriaInput");
    select.innerHTML = '<option value="">Selecciona una categoría</option>';
    categorias.forEach(cat => {
      const option = document.createElement("option");
      option.value = cat.name;
      option.textContent = cat.name;
      select.appendChild(option);
    });
  } catch (err) {
    console.error("❌ Error cargando categorías:", err);
    msgEstado.textContent = "❌ No se pudieron cargar las categorías.";
  }
}

async function cargarProducto() {
  try {
    const res = await fetch(API_PRODUCTO);
    const p = await res.json();

    if (!res.ok) throw new Error("Producto no encontrado");

    document.getElementById("nombreInput").value = p.name || "";
    document.getElementById("descripcionInput").value = p.description || "";
    document.getElementById("precioInput").value = p.price || "";
    document.getElementById("stockInput").value = p.stock || 0;
    document.getElementById("categoriaInput").value = p.category || "";
    document.getElementById("subcategoriaInput").value = p.subcategory || "";
    document.getElementById("tallasInput").value = p.sizes?.join(", ") || "";
    document.getElementById("colorInput").value = p.color || "#000000";
    document.getElementById("featuredInput").checked = !!p.featured;

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
        <img src="${v.imageUrl}" alt="Variante" class="preview-mini" />
        <label>Reemplazar imagen:</label>
        <input type="file" class="variante-img" accept="image/*" />
        <label>Color:</label>
        <input type="color" class="variante-color" value="${v.color}" />
        <label>Talla:</label>
        <input type="text" class="variante-talla" value="${v.talla}" />
        <label>Stock:</label>
        <input type="number" class="variante-stock" min="0" value="${v.stock}" />
        <input type="hidden" class="variante-id" value="${v.cloudinaryId}" />
        <button type="button" class="btn-secundario btn-quitar-variante">🗑️ Quitar</button>
        <hr />
      `;
      variantesDiv.appendChild(div);
    });

    variantesDiv.querySelectorAll(".btn-quitar-variante").forEach(btn => {
      btn.addEventListener("click", () => btn.parentElement.remove());
    });

  } catch (err) {
    console.error("❌ Error al cargar producto:", err);
    msgEstado.innerHTML = `❌ Error al cargar producto.<br><button onclick="goBack()">🔙 Volver</button>`;
  }
}

async function subirImagen(file) {
  const formData = new FormData();
  formData.append("image", file);

  const res = await fetch(API_UPLOAD, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Error subiendo imagen");

  return {
    url: data.url || data.secure_url,
    cloudinaryId: data.public_id
  };
}

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
    <button type="button" class="btn-secundario btn-quitar-variante">🗑️ Quitar</button>
    <hr />
  `;
  variantesDiv.appendChild(div);
  div.querySelector(".btn-quitar-variante").addEventListener("click", () => div.remove());
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  msgEstado.textContent = "⏳ Guardando cambios...";

  try {
    const nombre = form.nombreInput.value.trim();
    const descripcion = form.descripcionInput.value.trim();
    const precio = parseFloat(form.precioInput.value);
    const stock = parseInt(form.stockInput.value);
    const categoria = form.categoriaInput.value;
    const subcategoria = form.subcategoriaInput?.value?.trim() || null;
    const destacado = form.featuredInput?.checked || false;
    const color = form.colorInput.value;
    const sizes = form.tallasInput.value.split(",").map(s => s.trim()).filter(Boolean);

    if (!nombre || !descripcion || isNaN(precio) || isNaN(stock) || !categoria) {
      msgEstado.textContent = "⚠️ Por favor completa todos los campos obligatorios.";
      return;
    }

    const nuevaImg = form.imagenPrincipalNueva?.files[0];
    let nuevaImagen = null;
    if (nuevaImg) {
      nuevaImagen = await subirImagen(nuevaImg);
    }

    const bloques = document.querySelectorAll(".variante-box");
    const variantes = await Promise.all(Array.from(bloques).map(async (b) => {
      const file = b.querySelector(".variante-img")?.files[0];
      const color = b.querySelector(".variante-color")?.value || "#000000";
      const talla = b.querySelector(".variante-talla")?.value || "";
      const stock = parseInt(b.querySelector(".variante-stock")?.value || "0");
      const cloudinaryId = b.querySelector(".variante-id")?.value;

      let imageUrl = null;
      let finalCloudinaryId = cloudinaryId;

      if (file) {
        const subida = await subirImagen(file);
        imageUrl = subida.url;
        finalCloudinaryId = subida.cloudinaryId;
      } else if (cloudinaryId) {
        imageUrl = b.querySelector("img")?.src;
      }

      return { imageUrl, cloudinaryId: finalCloudinaryId, color, talla, stock };
    }));

    const payload = {
      name: nombre,
      description: descripcion,
      price: precio,
      stock,
      category: categoria,
      subcategory,
      color,
      sizes,
      featured: destacado,
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
    if (!res.ok) throw new Error(result.message || "No se pudo actualizar el producto");

    msgEstado.textContent = "✅ Producto actualizado con éxito.";

  } catch (err) {
    console.error("❌", err);
    msgEstado.textContent = `❌ ${err.message}`;
  }
});

window.goBack = goBack;
