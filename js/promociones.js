"use strict";

import { verificarSesion, goBack, mostrarMensaje } from "./admin-utils.js";
import { API_BASE } from "./config.js";

const token = verificarSesion();

const API_PROMOS = `${API_BASE}/api/promos`;
const API_CATEGORIES = `${API_BASE}/api/categories`;

const formPromo = document.getElementById("formPromo");
const promoImagen = document.getElementById("promoImagen");
const promoTitulo = document.getElementById("promoTitulo");
const promoCategoria = document.getElementById("promoCategoria");
const listaPromos = document.getElementById("listaPromos");
const msgPromo = document.getElementById("msgPromo");

document.addEventListener("DOMContentLoaded", () => {
  cargarCategorias();
  cargarPromociones();

  formPromo?.addEventListener("submit", crearPromocion);
});

// === CARGAR CATEGORÍAS PARA SELECT ===
async function cargarCategorias() {
  try {
    const res = await fetch(API_CATEGORIES);
    if (!res.ok) throw new Error("❌ Error al obtener categorías");

    const data = await res.json();

    promoCategoria.innerHTML += data.map(cat =>
      `<option value="${cat.name}">${cat.name}</option>`
    ).join('');
  } catch (err) {
    console.error(err);
    mostrarMensaje("⚠️ Error al cargar categorías", "error");
  }
}

// === CREAR NUEVA PROMOCIÓN ===
async function crearPromocion(e) {
  e.preventDefault();

  const file = promoImagen.files[0];
  const titulo = promoTitulo.value.trim();
  const categoria = promoCategoria.value;
  const btnSubmit = formPromo.querySelector("button[type='submit']");

  if (!file || !titulo || !categoria) {
    msgPromo.textContent = "⚠️ Todos los campos son obligatorios.";
    msgPromo.style.color = "orange";
    return;
  }

  try {
    btnSubmit.disabled = true;
    msgPromo.textContent = "⏳ Subiendo promoción...";
    msgPromo.style.color = "#888";

    const formData = new FormData();
    formData.append("image", file);
    formData.append("titulo", titulo);
    formData.append("categoria", categoria);

    const res = await fetch(API_PROMOS, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: formData
    });

    if (!res.ok) throw new Error("Error al crear promoción");

    const data = await res.json();

    msgPromo.textContent = "✅ Promoción creada con éxito.";
    msgPromo.style.color = "limegreen";

    formPromo.reset();
    cargarPromociones();
  } catch (err) {
    console.error("❌", err);
    msgPromo.textContent = "❌ Error al crear la promoción.";
    msgPromo.style.color = "red";
  } finally {
    btnSubmit.disabled = false;
  }
}

// === CARGAR PROMOCIONES EXISTENTES ===
async function cargarPromociones() {
  try {
    const res = await fetch(API_PROMOS);
    if (!res.ok) throw new Error("Error al cargar promociones");

    const promos = await res.json();

    if (!Array.isArray(promos) || promos.length === 0) {
      listaPromos.innerHTML = "<p>No hay promociones activas.</p>";
      return;
    }

    listaPromos.innerHTML = promos.map(promo => `
      <div class="promo-card">
        <img src="${promo.image}" alt="${promo.titulo}" />
        <h4>${promo.titulo}</h4>
        <p>Categoría: ${promo.categoria}</p>
        <p>Estado: 
          <span style="color:${promo.activa ? 'green' : 'red'};">
            ${promo.activa ? '✅ Activa' : '⛔ Inactiva'}
          </span>
        </p>
        <div class="promo-actions">
          <button onclick="cambiarEstadoPromo('${promo._id}', ${!promo.activa})">
            ${promo.activa ? 'Desactivar' : 'Activar'}
          </button>
          <button onclick="eliminarPromo('${promo._id}')">🗑️ Eliminar</button>
        </div>
      </div>
    `).join('');
  } catch (err) {
    console.error("❌ Error cargando promociones:", err);
    listaPromos.innerHTML = "<p style='color:red;'>❌ No se pudieron cargar promociones.</p>";
  }
}

// === CAMBIAR ESTADO DE PROMOCIÓN ===
async function cambiarEstadoPromo(id, activa) {
  try {
    const res = await fetch(`${API_PROMOS}/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ activa })
    });

    if (!res.ok) throw new Error("Error al actualizar estado");
    const data = await res.json();

    mostrarMensaje("✅ Estado actualizado", "success");
    cargarPromociones();
  } catch (err) {
    console.error("❌", err);
    mostrarMensaje("❌ No se pudo cambiar el estado", "error");
  }
}

// === ELIMINAR PROMOCIÓN ===
async function eliminarPromo(id) {
  const confirmar = confirm("⚠️ ¿Deseas eliminar esta promoción?");
  if (!confirmar) return;

  try {
    const res = await fetch(`${API_PROMOS}/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) throw new Error("Error al eliminar promoción");
    const data = await res.json();

    mostrarMensaje("✅ Promoción eliminada", "success");
    cargarPromociones();
  } catch (err) {
    console.error("❌", err);
    mostrarMensaje("❌ No se pudo eliminar", "error");
  }
}

// 🌐 Exponer funciones globales
window.goBack = goBack;
window.cambiarEstadoPromo = cambiarEstadoPromo;
window.eliminarPromo = eliminarPromo;
