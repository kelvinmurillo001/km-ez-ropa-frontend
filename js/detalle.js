"use strict";

const API_BASE = "https://km-ez-ropa-backend.onrender.com/api";

document.addEventListener("DOMContentLoaded", () => {
  const id = new URLSearchParams(window.location.search).get("id");
  if (!id) {
    mostrarError("❌ Producto no encontrado.");
    return;
  }

  cargarDetalleProducto(id);
});

/* 🔄 Obtener detalle del producto */
async function cargarDetalleProducto(id) {
  try {
    const res = await fetch(`${API_BASE}/products/${id}`);
    if (!res.ok) throw new Error("No se encontró el producto");

    const producto = await res.json();
    renderizarProducto(producto);
  } catch (err) {
    console.error("Error al cargar producto:", err);
    mostrarError("❌ No se pudo cargar el producto.");
  }
}

/* 🎨 Renderizar información del producto */
function renderizarProducto(p) {
  const imagen = document.getElementById("imagenPrincipal");
  const thumbs = document.getElementById("miniaturas");
  const titulo = document.getElementById("tituloProducto");
  const descripcion = document.getElementById("descripcionProducto");
  const precio = document.getElementById("precioProducto");
  const stockEl = document.getElementById("stockProducto");
  const tallas = document.getElementById("tallasDisponibles");

  if (!p || !p._id || !p.name || !Array.isArray(p.images)) {
    mostrarError("❌ Información del producto incompleta.");
    return;
  }

  titulo.textContent = p.name;
  descripcion.textContent = p.description || "Sin descripción.";
  precio.textContent = `$${(p.price || 0).toFixed(2)}`;
  stockEl.textContent = p.stock > 0 ? `Disponible: ${p.stock}` : "❌ Agotado";

  const imagenUrl = p.images[0]?.url || "/assets/logo.jpg";
  imagen.src = imagenUrl;
  imagen.alt = p.name;

  thumbs.innerHTML = "";
  p.images.forEach((img, i) => {
    const mini = document.createElement("img");
    mini.src = img.url || "/assets/logo.jpg";
    mini.alt = `Vista ${i + 1}`;
    mini.className = i === 0 ? "active" : "";
    mini.addEventListener("click", () => cambiarImagenPrincipal(img.url, i));
    thumbs.appendChild(mini);
  });

  if (Array.isArray(p.talla) && p.talla.length) {
    tallas.innerHTML = "";
    p.talla.forEach(t => {
      const span = document.createElement("span");
      span.textContent = t;
      span.className = "talla-opcion";
      span.tabIndex = 0;
      span.addEventListener("click", () => seleccionarTalla(span));
      tallas.appendChild(span);
    });
  }

  document.getElementById("btnAgregar")?.addEventListener("click", () => {
    const tallaSeleccionada = document.querySelector(".talla-opcion.selected")?.textContent || "";
    const cantidad = parseInt(document.getElementById("cantidadProducto")?.textContent) || 1;

    const productoCart = {
      id: p._id,
      nombre: p.name,
      precio: p.price,
      imagen: imagenUrl,
      talla: tallaSeleccionada,
      color: p.colores || ""
    };

    for (let i = 0; i < cantidad; i++) addToCart(productoCart);
  });

  configurarContador();
}

/* 🔄 Cambiar imagen principal */
function cambiarImagenPrincipal(url, index) {
  const imagen = document.getElementById("imagenPrincipal");
  imagen.src = url;
  imagen.alt = `Vista ${index + 1}`;

  const miniaturas = document.querySelectorAll("#miniaturas img");
  miniaturas.forEach((img, i) => img.classList.toggle("active", i === index));
}

/* ✔️ Seleccionar talla */
function seleccionarTalla(elemento) {
  document.querySelectorAll(".talla-opcion").forEach(t => t.classList.remove("selected"));
  elemento.classList.add("selected");
}

/* 🔢 Contador de cantidad */
function configurarContador() {
  const menos = document.getElementById("btnMenos");
  const mas = document.getElementById("btnMas");
  const cantidadEl = document.getElementById("cantidadProducto");

  let cantidad = 1;

  menos?.addEventListener("click", () => {
    if (cantidad > 1) {
      cantidad--;
      cantidadEl.textContent = cantidad;
    }
  });

  mas?.addEventListener("click", () => {
    cantidad++;
    cantidadEl.textContent = cantidad;
  });
}

/* ❌ Mostrar errores */
function mostrarError(mensaje) {
  const contenedor = document.querySelector(".detalle-container");
  contenedor.innerHTML = `<p class="error">${mensaje}</p>`;
}
