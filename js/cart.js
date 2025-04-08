"use strict";

const CART_KEY = "km_ez_cart";
const WHATSAPP_NUMBER = "593990270864";
const API_URL = "https://km-ez-ropa-backend.onrender.com/api";

/**
 * 📥 Obtener carrito desde localStorage
 */
function getCart() {
  try {
    const cart = JSON.parse(localStorage.getItem(CART_KEY));
    return Array.isArray(cart) ? cart : [];
  } catch {
    return [];
  }
}

/**
 * 💾 Guardar carrito en localStorage
 */
function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

/**
 * ➕ Agregar producto al carrito
 */
function addToCart(product) {
  const cart = getCart();
  const existingIndex = cart.findIndex(p => p.id === product.id);

  if (existingIndex !== -1) {
    cart[existingIndex].cantidad += 1;
  } else {
    cart.push({ ...product, cantidad: 1 });
  }

  saveCart(cart);
  updateCartWidget();
}

/**
 * ❌ Eliminar producto del carrito
 */
function removeFromCart(id) {
  const updatedCart = getCart().filter(item => item.id !== id);
  saveCart(updatedCart);
  renderCartItems();
  updateCartWidget();
}

/**
 * 🔁 Cambiar cantidad de un producto
 */
function changeQuantity(id, delta) {
  const updatedCart = getCart()
    .map(item => {
      if (item.id === id) item.cantidad += delta;
      return item;
    })
    .filter(item => item.cantidad > 0);

  saveCart(updatedCart);
  renderCartItems();
  updateCartWidget();
}

/**
 * 🧮 Calcular total del carrito
 */
function calculateTotal() {
  return getCart()
    .reduce((acc, item) => acc + ((parseFloat(item.precio || item.price) || 0) * item.cantidad), 0)
    .toFixed(2);
}

/**
 * 💾 Guardar pedido en el backend
 */
async function guardarPedido(nombre, nota, origen = "whatsapp") {
  const cart = getCart();

  if (!nombre || cart.length === 0) {
    alert("⚠️ Debes completar tu nombre y agregar productos al carrito.");
    return false;
  }

  const body = {
    items: cart.map(item => ({
      nombre: item.nombre || item.name,
      cantidad: item.cantidad,
      precio: item.precio || item.price
    })),
    total: calculateTotal(),
    nombreCliente: nombre,
    nota,
    origen
  };

  try {
    const res = await fetch(`${API_URL}/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    const result = await res.json();

    if (!res.ok) {
      alert("❌ Error guardando pedido: " + (result.message || "Error desconocido"));
      return false;
    }

    return true;
  } catch (err) {
    alert("❌ Error de red: " + err.message);
    return false;
  }
}

/**
 * 📲 Enviar pedido por WhatsApp
 */
async function sendCartToWhatsApp(nombre, nota) {
  const cart = getCart();
  if (!nombre) return alert("⚠️ Ingresa tu nombre.");
  if (cart.length === 0) return alert("🛒 El carrito está vacío.");

  const guardado = await guardarPedido(nombre, nota);
  if (!guardado) return;

  let mensaje = `Hola! Quiero consultar por estas prendas:\n`;

  cart.forEach(p => {
    mensaje += `- ${p.nombre || p.name} (x${p.cantidad})`;
    if (p.talla) mensaje += `, Talla: ${p.talla}`;
    if (p.color || p.colores) mensaje += `, Color: ${p.color || p.colores}`;
    mensaje += `\n`;
  });

  mensaje += `\nTotal estimado: $${calculateTotal()}\nCliente: ${nombre}\n`;
  if (nota) mensaje += `Nota: ${nota}\n`;

  const whatsappURL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(mensaje)}`;
  window.open(whatsappURL, "_blank");

  localStorage.removeItem(CART_KEY);
  setTimeout(() => window.location.href = "index.html", 2000);
}

/**
 * 🔢 Actualiza el contador del widget de carrito
 */
function updateCartWidget() {
  const totalItems = getCart().reduce((acc, item) => acc + item.cantidad, 0);
  const badge = document.querySelector("#cart-widget-count");
  if (badge) badge.textContent = totalItems;
}

/**
 * 🖼️ Renderizar productos en carrito.html
 */
function renderCartItems() {
  const cart = getCart();
  const container = document.querySelector("#cart-items");
  const total = document.querySelector("#cart-total");
  const totalUnidades = document.querySelector("#total-unidades");

  if (!container || !total) return;

  container.innerHTML = "";
  let unidades = 0;

  cart.forEach(item => {
    unidades += item.cantidad;

    const nombre = item.nombre || item.name || "Producto";
    const precio = item.precio || item.price || 0;
    const imagen = item.imagen || item.image || "../assets/logo.jpg";

    const div = document.createElement("div");
    div.className = "cart-item fade-in";
    div.innerHTML = `
      <img src="${imagen}" alt="${nombre}" />
      <div class="cart-info">
        <h4>${nombre}</h4>
        <p><strong>Precio:</strong> $${precio} x ${item.cantidad}</p>
        ${item.talla ? `<p><strong>Talla:</strong> ${item.talla}</p>` : ""}
        ${(item.color || item.colores) ? `<p><strong>Color:</strong> ${item.color || item.colores}</p>` : ""}
        <div class="cart-actions">
          <button onclick="changeQuantity('${item.id}', -1)">➖</button>
          <span>${item.cantidad}</span>
          <button onclick="changeQuantity('${item.id}', 1)">➕</button>
          <button onclick="removeFromCart('${item.id}')">🗑️</button>
        </div>
      </div>
    `;

    container.appendChild(div);
  });

  total.textContent = `$${calculateTotal()}`;
  if (totalUnidades) totalUnidades.textContent = `Total unidades: ${unidades}`;
}

/**
 * 🖼️ Abrir modal con imagen
 */
function abrirModalImagen(src) {
  const modal = document.getElementById("imageModal");
  const img = document.getElementById("modalImage");
  if (img && modal) {
    img.src = src;
    modal.classList.remove("oculto");
  }
}

/**
 * ❌ Cerrar modal de imagen
 */
function cerrarModalImagen() {
  const modal = document.getElementById("imageModal");
  if (modal) modal.classList.add("oculto");
}
