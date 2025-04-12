"use strict";

const CART_KEY = "km_ez_cart";
const WHATSAPP_NUMBER = "593990270864";
const API_URL = "https://km-ez-ropa-backend.onrender.com/api";

// 📥 Obtener carrito
function getCart() {
  try {
    const cart = JSON.parse(localStorage.getItem(CART_KEY));
    return Array.isArray(cart) ? cart : [];
  } catch {
    return [];
  }
}

// 💾 Guardar carrito
function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

// 🔑 Generar clave única por producto + talla + color
function generateKey(product) {
  return `${product.id}_${product.talla || ""}_${product.color || ""}`;
}

// ➕ Agregar al carrito
function addToCart(product) {
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
}

// ❌ Eliminar producto por clave
function removeFromCart(key) {
  const updated = getCart().filter(item => generateKey(item) !== key);
  saveCart(updated);
  renderCartItems();
  updateCartWidget();
}

// 🔁 Cambiar cantidad
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

// 🧮 Calcular total
function calculateTotal() {
  return getCart()
    .reduce((sum, item) => sum + ((parseFloat(item.precio || item.price) || 0) * item.cantidad), 0)
    .toFixed(2);
}

// 💾 Guardar pedido en backend
async function guardarPedido(nombre, nota, origen = "whatsapp") {
  const cart = getCart();
  if (!nombre || cart.length === 0) {
    alert("⚠️ Ingresa tu nombre y productos");
    return false;
  }

  const payload = {
    nombreCliente: nombre,
    nota,
    origen,
    total: calculateTotal(),
    items: cart.map(p => ({
      nombre: p.nombre || p.name,
      cantidad: p.cantidad,
      precio: p.precio || p.price,
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
      alert("❌ Error guardando pedido: " + (result.message || "Desconocido"));
      return false;
    }

    return true;
  } catch (err) {
    alert("❌ Error de red: " + err.message);
    return false;
  }
}

// 📲 Enviar pedido por WhatsApp
async function sendCartToWhatsApp(nombre, nota) {
  const cart = getCart();
  if (!nombre) return alert("⚠️ Ingresa tu nombre");
  if (cart.length === 0) return alert("🛒 El carrito está vacío");

  const ok = await guardarPedido(nombre, nota);
  if (!ok) return;

  let msg = `👋 Hola! Me interesa consultar por estos productos:\n\n`;
  cart.forEach(p => {
    msg += `• ${p.nombre || p.name} (x${p.cantidad})`;
    if (p.talla) msg += ` | Talla: ${p.talla}`;
    if (p.color || p.colores) msg += ` | Color: ${p.color || p.colores}`;
    msg += `\n`;
  });

  msg += `\n💰 Total estimado: $${calculateTotal()}\n👤 Cliente: ${nombre}\n`;
  if (nota) msg += `📌 Nota: ${nota}\n`;

  const whatsappURL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
  window.open(whatsappURL, "_blank");

  localStorage.removeItem(CART_KEY);
  setTimeout(() => window.location.href = "index.html", 2000);
}

// 🔢 Actualizar contador del carrito
function updateCartWidget() {
  const count = getCart().reduce((sum, item) => sum + item.cantidad, 0);
  const badge = document.querySelector("#cart-widget-count");
  if (badge) badge.textContent = count;
}

// 🖼️ Renderizar carrito
function renderCartItems() {
  const cart = getCart();
  const contenedor = document.querySelector("#cart-items");
  const total = document.querySelector("#cart-total");
  const unidadesEl = document.querySelector("#total-unidades");

  if (!contenedor || !total) return;

  contenedor.innerHTML = "";
  let unidades = 0;

  cart.forEach(item => {
    unidades += item.cantidad;
    const nombre = item.nombre || item.name || "Producto";
    const precio = item.precio || item.price || 0;
    const imagen = item.imagen || item.image || "/assets/logo.jpg";

    const idKey = generateKey(item);

    const div = document.createElement("div");
    div.className = "cart-item fade-in";
    div.innerHTML = `
      <img src="${imagen}" alt="${nombre}" onclick="abrirModalImagen('${imagen}')" />
      <div class="cart-info">
        <h4>${nombre}</h4>
        <p><strong>Precio:</strong> $${precio} x ${item.cantidad}</p>
        ${item.talla ? `<p><strong>Talla:</strong> ${item.talla}</p>` : ""}
        ${(item.color || item.colores) ? `<p><strong>Color:</strong> ${item.color || item.colores}</p>` : ""}
        <div class="cart-actions">
          <button onclick="changeQuantity('${idKey}', -1)">➖</button>
          <span>${item.cantidad}</span>
          <button onclick="changeQuantity('${idKey}', 1)">➕</button>
          <button onclick="removeFromCart('${idKey}')">🗑️</button>
        </div>
      </div>
    `;
    contenedor.appendChild(div);
  });

  total.textContent = `$${calculateTotal()}`;
  if (unidadesEl) unidadesEl.textContent = `Total unidades: ${unidades}`;
}

// 🖼️ Imagen en modal
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
