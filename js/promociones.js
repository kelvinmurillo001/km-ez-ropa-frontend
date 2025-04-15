"use strict";

import { verificarSesion, goBack } from "./admin-utils.js";

const token = verificarSesion();
const API_BASE = "https://km-ez-ropa-backend.onrender.com/api";
const API_PROMOS = `${API_BASE}/promos`;
const API_UPLOAD = `${API_BASE}/upload`;
const API_CATEGORIAS = `${API_BASE}/categories`;

// DOM
const formPromo = document.getElementById("formPromo");
const listaPromos = document.getElementById("listaPromos");
const msgPromo = document.getElementById("msgPromo");

// Al cargar
document.addEventListener("DOMContentLoaded", () => {
  cargarCategorias();
  cargarPromociones();
});

// Cargar categorías para select
async function cargarCategorias() {
  try {
    const res = await fetch(API_CATEGORIAS);
    const categorias = await res.json();
    const select = document.getElementById("promoCategoria");

    categorias.forEach(c => {
      const opt = document.createElement("option");
      opt.value = c._id;
      opt.textContent = c.name;
      select.appendChild(opt);
    });
  } catch (err) {
    console.error("❌ Error al cargar categorías", err);
  }
}

// Subir imagen a Cloudinary vía backend
async function subirImagen(file) {
  const fd = new FormData();
  fd.append("file", file);

  const res = await fetch(API_UPLOAD, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: fd
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Error al subir imagen");
  return { url: data.secure_url, cloudinaryId: data.public_id };
}

// Crear promoción
formPromo.addEventListener("submit", async e => {
  e.preventDefault();
  msgPromo.textContent = "Subiendo imagen...";

  try {
    const titulo = document.getElementById("promoTitulo").value.trim();
    const categoria = document.getElementById("promoCategoria").value;
    const file = document.getElementById("promoImagen").files[0];

    if (!file) throw new Error("Imagen requerida");
    const imagen = await subirImagen(file);

    const res = await fetch(API_PROMOS, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        titulo,
        imageUrl: imagen.url,
        cloudinaryId: imagen.cloudinaryId,
        categoria
      })
    });

    if (!res.ok) throw new Error("No se pudo crear promoción");

    msgPromo.textContent = "✅ Promoción creada correctamente.";
    formPromo.reset();
    cargarPromociones();

  } catch (err) {
    console.error("❌", err);
    msgPromo.textContent = "❌ " + err.message;
  }
});

// Cargar promociones existentes
async function cargarPromociones() {
  try {
    const res = await fetch(API_PROMOS, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const promos = await res.json();
    renderPromos(promos);
  } catch (err) {
    console.error("❌ Error al cargar promociones", err);
    listaPromos.innerHTML = `<p style="color:red;">❌ Error al cargar promociones.</p>`;
  }
}

// Render cards
function renderPromos(promos) {
  if (!Array.isArray(promos) || promos.length === 0) {
    listaPromos.innerHTML = `<p>No hay promociones creadas.</p>`;
    return;
  }

  listaPromos.innerHTML = promos.map(p => `
    <div class="promo-card">
      <img src="${p.imageUrl}" alt="${p.titulo}" />
      <h4>${p.titulo}</h4>
      <p>Categoría: ${p.categoria?.name || "Sin asignar"}</p>
      <p class="estado ${p.activo ? 'activo' : 'inactivo'}">
        Estado: ${p.activo ? "Activo ✅" : "Inactivo ❌"}
      </p>
      <button onclick="cambiarEstadoPromo('${p._id}')" class="btn-secundario">
        ${p.activo ? "Desactivar" : "Activar"}
      </button>
      <button onclick="eliminarPromo('${p._id}')" class="btn-eliminar mt-1">🗑️ Eliminar</button>
    </div>
  `).join("");
}

// Activar/desactivar
window.cambiarEstadoPromo = async function(id) {
  try {
    const res = await fetch(`${API_PROMOS}/${id}/estado`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) throw new Error("Error al cambiar estado");
    await cargarPromociones();
  } catch (err) {
    console.error("❌", err);
    alert("❌ No se pudo cambiar el estado.");
  }
};

// Eliminar promoción
window.eliminarPromo = async function(id) {
  const confirmar = confirm("⚠️ ¿Estás seguro de eliminar esta promoción?");
  if (!confirmar) return;

  try {
    const res = await fetch(`${API_PROMOS}/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) throw new Error("Error al eliminar");
    await cargarPromociones();
  } catch (err) {
    console.error("❌", err);
    alert("❌ No se pudo eliminar la promoción.");
  }
};

window.goBack = goBack;
