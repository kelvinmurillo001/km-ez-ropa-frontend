"use strict";

const CART_KEY = "km_ez_cart";
const WHATSAPP_NUMBER = "593990270864";
const API_URL = "https://km-ez-ropa-backend.onrender.com/api";

/* 📥 Obtener carrito */
function getCart() {
  try {
    const cart = JSON.parse(localStorage.getItem(CART_KEY));
    return Array.isArray(cart) ? cart : [];
  } catch {
    return [];
  }
}

/* 💾 Guardar carrito */
function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

/* 🧩 Clave única */
function generateKey(product) {
  return `${product.id}_${product.talla || ""}_${product.color || ""}`.toLowerCase();
}

/* ➕ Añadir producto */
function addToCart(product) {
  if (!product?.id || !product?.nombre || !product?.precio || !product?.imagen) {
    console.warn("❌ Producto inválido:", product);
    return;
  }

  const cart = getCart();
  const key = generateKey(product);
  const index = cart.findIndex(p => generateKey(p) === key);

  if (index !== -1) {
    cart[index].cantidad += 1;
  } else {
    cart.push({ ...product, cantidad: 1 });
  }

  saveCart(cart);
  updateCartWidget();

  if (window.location.href.includes("detalle.html")) {
    alert("✅ Producto añadido al carrito.");
  }
}

/* ❌ Quitar producto */
function removeFromCart(key) {
  const nuevoCarrito = getCart().filter(item => generateKey(item) !== key);
  saveCart(nuevoCarrito);
  renderCartItems();
  updateCartWidget();
}

/* 🔁 Modificar cantidad */
function changeQuantity(key, delta) {
  const updated = getCart()
    .map(item => {
      if (generateKey(item) === key) item.cantidad += delta;
      return item;
    })
    .filter(item => item.cantidad > 0);

  saveCart(updated);
  renderCartItems();
  updateCartWidget();
}

/* 🧮 Total */
function calculateTotal() {
  return getCart()
    .reduce((sum, item) => sum + ((parseFloat(item.precio || item.price) || 0) * item.cantidad), 0)
    .toFixed(2);
}

/* 💾 Backend */
async function guardarPedido(nombre, nota = "", origen = "whatsapp") {
  const cart = getCart();
  if (!nombre || cart.length === 0) {
    alert("⚠️ Ingresa tu nombre y agrega productos.");
    return false;
  }

  const payload = {
    nombreCliente: nombre,
    nota,
    origen,
    total: calculateTotal(),
    items: cart.map(p => ({
      nombre: p.nombre || p.name || "Producto",
      cantidad: p.cantidad,
      precio: p.precio || p.price || 0,
      talla: p.talla || "",
      color: p.color || p.colores || ""
    }))
  };

  try {
    const res = await fetch(`${API_URL}/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const result = await res.json();
    if (!res.ok) {
      alert("❌ Error al guardar pedido: " + (result.message || "Desconocido"));
      return false;
    }

    return true;
  } catch (err) {
    alert("❌ Error de red: " + err.message);
    return false;
  }
}

/* 📲 WhatsApp */
async function sendCartToWhatsApp(nombre, nota = "") {
  const cart = getCart();
  if (!nombre) return alert("⚠️ Ingresa tu nombre");
  if (!cart.length) return alert("🛒 El carrito está vacío");

  const ok = await guardarPedido(nombre, nota, "whatsapp");
  if (!ok) return;

  let mensaje = `👋 Hola! Estoy interesado en los siguientes productos:\n\n`;

  cart.forEach(p => {
    mensaje += `• ${p.nombre} x${p.cantidad}`;
    if (p.talla) mensaje += ` | Talla: ${p.talla}`;
    if (p.color || p.colores) mensaje += ` | Color: ${p.color || p.colores}`;
    mensaje += `\n`;
  });

  mensaje += `\n💰 Total: $${calculateTotal()}\n👤 Nombre: ${nombre}\n`;
  if (nota) mensaje += `📌 Nota: ${nota}\n`;

  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(mensaje)}`;
  window.open(url, "_blank");

  localStorage.removeItem(CART_KEY);
  setTimeout(() => (window.location.href = "index.html"), 2500);
}

/* 🔢 Contador */
function updateCartWidget() {
  const count = getCart().reduce((sum, item) => sum + item.cantidad, 0);
  const badge = document.querySelector("#cart-widget-count");
  if (badge) badge.textContent = count;
}

/* 🖼️ Renderizar item */
function renderizarItem(item) {
  const nombre = item.nombre || item.name || "Producto";
  const precio = item.precio || item.price || 0;
  const imagen = item.imagen || item.image || "/assets/logo.jpg";
  const key = generateKey(item);

  const div = document.createElement("div");
  div.className = "cart-item fade-in";
  div.innerHTML = `
    <img src="${imagen}" alt="${nombre}" onclick="abrirModalImagen('${imagen}')" onerror="this.src='/assets/logo.jpg'" />
    <div class="cart-info">
      <h4>${nombre}</h4>
      <p><strong>Precio:</strong> $${precio} x ${item.cantidad}</p>
      ${item.talla ? `<p><strong>Talla:</strong> ${item.talla}</p>` : ""}
      ${(item.color || item.colores) ? `<p><strong>Color:</strong> ${item.color || item.colores}</p>` : ""}
      <div class="cart-actions">
        <button onclick="changeQuantity('${key}', -1)">➖</button>
        <span>${item.cantidad}</span>
        <button onclick="changeQuantity('${key}', 1)">➕</button>
        <button onclick="removeFromCart('${key}')">🗑</button>
      </div>
    </div>
  `;
  return div;
}

/* 🛍️ Renderizar todos */
function renderCartItems() {
  const cart = getCart();
  const contenedor = document.querySelector("#cart-items");
  const total = document.querySelector("#cart-total");
  const unidadesEl = document.querySelector("#total-unidades");

  if (!contenedor || !total) return;

  contenedor.innerHTML = "";

  if (!cart.length) {
    contenedor.innerHTML = `<p style="text-align:center; font-weight:bold;">🛒 Tu carrito está vacío.</p>`;
    if (unidadesEl) unidadesEl.textContent = "Total unidades: 0";
    total.textContent = "$0.00";
    return;
  }

  let unidades = 0;
  cart.forEach(item => {
    unidades += item.cantidad;
    contenedor.appendChild(renderizarItem(item));
  });

  total.textContent = `$${calculateTotal()}`;
  if (unidadesEl) unidadesEl.textContent = `Total unidades: ${unidades}`;
}

/* 🔍 Modal */
function abrirModalImagen(src) {
  const modal = document.getElementById("imageModal");
  const img = document.getElementById("modalImage");
  if (modal && img) {
    img.src = src;
    modal.classList.remove("oculto");
  }
}

function cerrarModalImagen() {
  const modal = document.getElementById("imageModal");
  if (modal) modal.classList.add("oculto");
}

/* 🌍 Exportar funciones */
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.changeQuantity = changeQuantity;
window.sendCartToWhatsApp = sendCartToWhatsApp;
window.renderCartItems = renderCartItems;
window.updateCartWidget = updateCartWidget;
window.abrirModalImagen = abrirModalImagen;
window.cerrarModalImagen = cerrarModalImagen;
