"use strict";

// 📦 DOM Elements
const carritoItems = document.getElementById("carritoItems");
const carritoTotal = document.getElementById("carritoTotal");
const btnIrCheckout = document.getElementById("btnIrCheckout");
const btnVaciarCarrito = document.getElementById("btnVaciarCarrito");
const contadorCarrito = document.getElementById("cartCount");

// 🔐 LocalStorage Keys
const STORAGE_KEY = "km_ez_cart";
const BACKUP_KEY = "km_ez_cart_backup";

let carrito = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

// ▶️ Al cargar página
document.addEventListener("DOMContentLoaded", () => {
  limpiarItemsInvalidos();
  renderizarCarrito();

  btnIrCheckout?.addEventListener("click", irACheckout);
  btnVaciarCarrito?.addEventListener("click", vaciarCarrito);

  if (localStorage.getItem("modoOscuro") === "true") {
    document.body.classList.add("modo-oscuro");
  }
});

/* ─────────────────────────────────────────────────────────────── */
/* 🔐 UTILIDADES DE SANITIZACIÓN                                   */
/* ─────────────────────────────────────────────────────────────── */
function sanitizeText(str) {
  const temp = document.createElement("div");
  temp.textContent = str || "";
  return temp.innerHTML.trim();
}

function sanitizeURL(url) {
  try {
    return new URL(url, window.location.origin).href;
  } catch {
    return "/assets/logo.jpg";
  }
}

/* ─────────────────────────────────────────────────────────────── */
/* 💾 GESTIÓN DE CARRITO EN LOCALSTORAGE                           */
/* ─────────────────────────────────────────────────────────────── */
function guardarCarrito() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(carrito));
  sessionStorage.setItem(BACKUP_KEY, JSON.stringify(carrito)); // respaldo
  actualizarCarritoWidget();
}

function limpiarItemsInvalidos() {
  carrito = carrito.filter(item =>
    item &&
    typeof item.id === "string" &&
    typeof item.nombre === "string" &&
    typeof item.talla === "string" &&
    typeof item.color === "string" &&
    typeof item.imagen === "string" &&
    typeof item.precio === "number" &&
    typeof item.cantidad === "number" &&
    !isNaN(item.precio) &&
    !isNaN(item.cantidad) &&
    item.precio >= 0 &&
    item.cantidad > 0
  );
  guardarCarrito();
}

/* ─────────────────────────────────────────────────────────────── */
/* 💰 CALCULAR Y MOSTRAR TOTAL                                     */
/* ─────────────────────────────────────────────────────────────── */
function actualizarTotal() {
  const total = carrito.reduce((acc, item) =>
    acc + (item.precio || 0) * (item.cantidad || 0), 0);

  carritoTotal.textContent = `$${total.toFixed(2)}`;
  const disabled = carrito.length === 0;
  btnIrCheckout.disabled = disabled;
  btnVaciarCarrito.disabled = disabled;
}

/* 🧮 Widget flotante carrito */
function actualizarCarritoWidget() {
  const total = carrito.reduce((sum, item) => sum + item.cantidad, 0);
  if (contadorCarrito) contadorCarrito.textContent = total;
}

/* ─────────────────────────────────────────────────────────────── */
/* 🛍️ RENDERIZAR CARRITO                                           */
/* ─────────────────────────────────────────────────────────────── */
function renderizarCarrito() {
  if (!carrito.length) {
    carritoItems.innerHTML = `
      <div class="text-center fade-in" role="status" aria-live="polite">
        <p>🛍️ Tu carrito está vacío. <a href='/categorias.html'>Explora nuestras categorías</a>.</p>
      </div>`;
    carritoTotal.textContent = "$0.00";
    btnIrCheckout.disabled = true;
    btnVaciarCarrito.disabled = true;
    actualizarCarritoWidget();
    return;
  }

  carritoItems.innerHTML = "";

  carrito.forEach((item, index) => {
    const imagen = sanitizeURL(item.imagen);
    const nombre = sanitizeText(item.nombre);
    const talla = sanitizeText(item.talla || "Única");
    const color = sanitizeText(item.color || "N/A");
    const precio = parseFloat(item.precio) || 0;
    const cantidad = Math.max(1, Math.min(100, parseInt(item.cantidad) || 1));
    const subtotal = (precio * cantidad).toFixed(2);

    const div = document.createElement("div");
    div.className = "carrito-item fade-in";
    div.setAttribute("role", "group");
    div.setAttribute("aria-label", `Producto: ${nombre}, Talla: ${talla}, Color: ${color}, Cantidad: ${cantidad}`);

    div.innerHTML = `
      <img src="${imagen}" alt="${nombre}" class="carrito-img" />
      <div class="carrito-detalles">
        <h4>${nombre}</h4>
        <p><strong>Talla:</strong> ${talla}</p>
        <p><strong>Color:</strong> ${color}</p>
        <p><strong>Precio:</strong> $${precio.toFixed(2)}</p>
        <div class="carrito-cantidad">
          <label for="cantidad_${index}">Cantidad:</label>
          <input 
            type="number" 
            id="cantidad_${index}" 
            min="1" 
            max="100" 
            value="${cantidad}" 
            data-index="${index}" 
            aria-label="Cambiar cantidad de ${nombre}" 
          />
        </div>
        <p><strong>Subtotal:</strong> $${subtotal}</p>
        <button 
          class="btn-eliminar" 
          data-index="${index}" 
          aria-label="Eliminar ${nombre} del carrito">
          🗑️ Eliminar
        </button>
      </div>
    `;
    carritoItems.appendChild(div);
  });

  actualizarTotal();
  agregarListeners();
}

/* ─────────────────────────────────────────────────────────────── */
/* 🎧 LISTENERS PARA CANTIDAD Y ELIMINAR                           */
/* ─────────────────────────────────────────────────────────────── */
function agregarListeners() {
  // ✅ Debounce para cambio de cantidad
  const debounce = (func, delay) => {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => func.apply(this, args), delay);
    };
  };

  document.querySelectorAll(".carrito-cantidad input").forEach(input => {
    input.addEventListener("input", debounce(e => {
      const i = parseInt(e.target.dataset.index);
      const nuevaCantidad = Math.max(1, Math.min(100, parseInt(e.target.value) || 1));
      if (!isNaN(i) && carrito[i]) {
        carrito[i].cantidad = nuevaCantidad;
        guardarCarrito();
        renderizarCarrito();
      }
    }, 300));
  });

  document.querySelectorAll(".btn-eliminar").forEach(btn => {
    btn.addEventListener("click", e => {
      const i = parseInt(e.target.dataset.index);
      if (!isNaN(i) && carrito[i]) {
        const confirmar = confirm(`❌ ¿Eliminar "${carrito[i].nombre}" del carrito?`);
        if (confirmar) {
          const itemEl = btn.closest(".carrito-item");
          itemEl.classList.add("fade-out");
          setTimeout(() => {
            carrito.splice(i, 1);
            guardarCarrito();
            renderizarCarrito();
          }, 300); // tiempo de animación
        }
      }
    });
  });
}

/* ─────────────────────────────────────────────────────────────── */
/* ✅ CHECKOUT Y VACIAR                                            */
/* ─────────────────────────────────────────────────────────────── */
function irACheckout() {
  if (carrito.length > 0) {
    window.location.href = "/checkout.html";
  }
}

function vaciarCarrito() {
  const confirmar = confirm("⚠️ ¿Seguro que quieres vaciar todo el carrito?");
  if (confirmar) {
    sessionStorage.setItem(BACKUP_KEY, JSON.stringify(carrito)); // respaldo
    carrito = [];
    guardarCarrito();
    renderizarCarrito();
  }
}
