"use strict";

import { verificarSesion, goBack, mostrarMensaje } from "./admin-utils.js";
import { API_BASE } from "./config.js";

const token = verificarSesion();
const productId = new URLSearchParams(window.location.search).get("id");

if (!productId) {
  alert("❌ ID de producto no válido.");
  goBack();
}

const API_UPLOAD = `${API_BASE}/api/uploads`;
const API_PRODUCTO = `${API_BASE}/api/products/${productId}`;
const API_CATEGORIAS = `${API_BASE}/api/categories`;

const form = document.getElementById("formEditarProducto");
const msgEstado = document.getElementById("msgEstado");
const variantesDiv = document.getElementById("variantesExistentes");

document.addEventListener("DOMContentLoaded", () => {
  if (localStorage.getItem("modoOscuro") === "true") {
    document.body.classList.add("modo-oscuro");
  }

  cargarCategorias();
  cargarProducto();

  document.getElementById("btnAgregarVariante")?.addEventListener("click", renderVarianteNueva);
});

function validarCampo(valor, mensaje) {
  if (!valor || valor.trim() === "") {
    throw new Error(mensaje);
  }
}

async function cargarCategorias() {
  try {
    const res = await fetch(API_CATEGORIAS);
    const { data } = await res.json();
    if (!res.ok || !Array.isArray(data)) throw new Error("Respuesta inválida");

    const select = document.getElementById("categoriaInput");
    select.innerHTML = '<option value="">Selecciona una categoría</option>';
    data.forEach(cat => {
      const option = document.createElement("option");
      option.value = cat.name;
      option.textContent = cat.name;
      select.appendChild(option);
    });
  } catch (err) {
    console.error("❌ Error cargando categorías:", err);
    mostrarMensaje("❌ No se pudieron cargar las categorías", "error");
  }
}

async function cargarProducto() {
  try {
    const res = await fetch(API_PRODUCTO);
    const { producto } = await res.json(); // ✅ fix aplicado aquí

    if (!res.ok || !producto || producto._id !== productId) throw new Error("Producto no encontrado");

    document.getElementById("nombreInput").value = producto.name || "";
    document.getElementById("descripcionInput").value = producto.description || "";
    document.getElementById("precioInput").value = producto.price || "";
    document.getElementById("stockInput").value = producto.stock ?? 0;
    document.getElementById("categoriaInput").value = producto.category || "";
    document.getElementById("subcategoriaInput").value = producto.subcategory || "";
    document.getElementById("tallasInput").value = producto.sizes?.join(", ") || "";
    document.getElementById("colorInput").value = producto.color || "";
    document.getElementById("destacadoInput").checked = !!producto.featured;

    if (Array.isArray(producto.images) && producto.images.length > 0) {
      document.getElementById("imagenPrincipalActual").innerHTML = `
        <img src="${producto.images[0].url}" alt="Imagen actual" class="imagen-preview-principal" />
      `;
    }

    producto.variants?.forEach(renderVarianteExistente);
  } catch (err) {
    console.error("❌ Error al cargar producto:", err);
    msgEstado.innerHTML = `❌ Error al cargar producto.<br><button onclick="goBack()">🔙 Volver</button>`;
  }
}

function renderVarianteExistente(v, i) {
  const div = document.createElement("div");
  div.className = "variante-box";
  div.innerHTML = `
    <p><strong>Variante #${i + 1}</strong></p>
    <img src="${v.imageUrl}" alt="Variante" class="preview-mini" />
    <label>Reemplazar imagen:</label>
    <input type="file" class="variante-img" accept="image/*" />
    <label>Color:</label>
    <input type="text" class="variante-color" value="${v.color}" />
    <label>Talla:</label>
    <input type="text" class="variante-talla" value="${v.talla}" />
    <label>Stock:</label>
    <input type="number" class="variante-stock" min="0" value="${v.stock}" />
    <input type="hidden" class="variante-id" value="${v.cloudinaryId}" />
    <button type="button" class="btn-secundario btn-quitar-variante">🗑️ Quitar</button>
    <hr />
  `;
  variantesDiv.appendChild(div);
  div.querySelector(".btn-quitar-variante").addEventListener("click", () => div.remove());
}

function renderVarianteNueva() {
  if (document.querySelectorAll(".variante-box").length >= 4) {
    mostrarMensaje("⚠️ Máximo 4 variantes permitidas", "warning");
    return;
  }

  const div = document.createElement("div");
  div.className = "variante-box";
  div.innerHTML = `
    <p><strong>Nueva Variante</strong></p>
    <label>Imagen:</label>
    <input type="file" class="variante-img" accept="image/*" required />
    <label>Color:</label>
    <input type="text" class="variante-color" placeholder="Ej: blanco, vino" required />
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

async function subirImagen(file) {
  if (!file || !file.type.startsWith("image/") || file.size > 2 * 1024 * 1024) {
    throw new Error("⚠️ Imagen inválida o muy pesada");
  }

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

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  mostrarMensaje("⏳ Guardando cambios...", "info");
  form.classList.add("bloqueado");

  try {
    const nombre = form.nombreInput.value.trim();
    const descripcion = form.descripcionInput.value.trim();
    const precio = parseFloat(form.precioInput.value);
    const stockBase = parseInt(form.stockInput.value || "0");
    const categoria = form.categoriaInput.value;
    const subcategoria = form.subcategoriaInput?.value?.trim() || null;
    const destacado = form.destacadoInput?.checked || false;
    const color = form.colorInput.value.trim();
    const sizes = form.tallasInput.value.split(",").map(s => s.trim()).filter(Boolean);

    validarCampo(nombre, "⚠️ Nombre del producto obligatorio");
    validarCampo(descripcion, "⚠️ Descripción del producto requerida");
    validarCampo(categoria, "⚠️ Selecciona una categoría");
    if (isNaN(precio)) throw new Error("⚠️ Precio inválido");

    const nuevaImg = form.imagenPrincipalNueva?.files[0];
    let nuevaImagen = null;
    if (nuevaImg) nuevaImagen = await subirImagen(nuevaImg);

    const bloques = document.querySelectorAll(".variante-box");
    const variantes = await Promise.all(Array.from(bloques).map(async (b) => {
      const file = b.querySelector(".variante-img")?.files[0];
      const color = b.querySelector(".variante-color")?.value?.trim();
      const talla = b.querySelector(".variante-talla")?.value?.trim();
      const stock = parseInt(b.querySelector(".variante-stock")?.value || "0");
      const cloudinaryId = b.querySelector(".variante-id")?.value;

      validarCampo(color, "⚠️ Color requerido en variante");
      validarCampo(talla, "⚠️ Talla requerida en variante");
      if (isNaN(stock) || stock < 0) throw new Error("⚠️ Stock inválido en variante");

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

    const claves = new Set();
    for (const v of variantes) {
      const clave = `${v.talla}-${v.color}`;
      if (claves.has(clave)) throw new Error("⚠️ Hay variantes duplicadas (talla + color)");
      claves.add(clave);
    }

    const payload = {
      name: nombre,
      description: descripcion,
      price: precio,
      category: categoria,
      subcategory,
      color,
      sizes,
      featured: destacado,
      variants
    };

    if (nuevaImagen) payload.images = [nuevaImagen];
    if (variantes.length === 0) payload.stock = stockBase;

    const res = await fetch(API_PRODUCTO, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    const result = await res.json();
    if (!res.ok) throw new Error(result.message || "Error actualizando producto");

    mostrarMensaje("✅ Producto actualizado con éxito", "success");

  } catch (err) {
    console.error("❌", err);
    mostrarMensaje(`❌ ${err.message}`, "error");
  } finally {
    form.classList.remove("bloqueado");
  }
});

window.goBack = goBack;
