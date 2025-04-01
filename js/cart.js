const CART_KEY = "km_ez_cart";
const WHATSAPP_NUMBER = "593990270864";
const API_URL = "https://km-ez-ropa-backend.onrender.com/api";

// 📥 Obtener carrito desde localStorage
function getCart() {
  return JSON.parse(localStorage.getItem(CART_KEY)) || [];
}

// 💾 Guardar carrito
function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

// ➕ Agregar al carrito
function addToCart(product) {
  const cart = getCart();
  const index = cart.findIndex(p => p.id === product.id);
  if (index !== -1) {
    cart[index].cantidad += 1;
  } else {
    cart.push({ ...product, cantidad: 1 });
  }
  saveCart(cart);
  updateCartWidget();
}

// ❌ Eliminar del carrito
function removeFromCart(id) {
  const cart = getCart().filter(item => item.id !== id);
  saveCart(cart);
  renderCartItems();
  updateCartWidget();
}

// 🔁 Modificar cantidad
function changeQuantity(id, delta) {
  const cart = getCart().map(item => {
    if (item.id === id) item.cantidad += delta;
    return item;
  }).filter(p => p.cantidad > 0);
  saveCart(cart);
  renderCartItems();
  updateCartWidget();
}

// 🧮 Total
function calculateTotal() {
  const cart = getCart();
  return cart.reduce((acc, item) => acc + item.precio * item.cantidad, 0);
}

// 📲 Enviar a WhatsApp
function sendCartToWhatsApp(nombre, nota) {
  const cart = getCart();
  if (cart.length === 0) return alert("El carrito está vacío.");

  let mensaje = `Hola! Quiero consultar por estas prendas:\n`;

  cart.forEach(p => {
    mensaje += `- ${p.nombre} (x${p.cantidad})`;
    if (p.talla) mensaje += `, Talla: ${p.talla}`;
    if (p.color || p.colores) mensaje += `, Color: ${p.color || p.colores}`;
    mensaje += `\n`;
  });

  mensaje += `\nTotal estimado: $${calculateTotal()}\n`;
  if (nombre) mensaje += `Cliente: ${nombre}\n`;
  if (nota) mensaje += `Nota: ${nota}\n`;

  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(mensaje)}`;
  window.open(url, '_blank');
}

// 🧩 Widget flotante
function updateCartWidget() {
  const cart = getCart();
  const totalItems = cart.reduce((acc, item) => acc + item.cantidad, 0);
  const badge = document.querySelector("#cart-widget-count");
  if (badge) badge.textContent = totalItems;
}

// 🖼️ Renderizar lista en carrito.html
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

    const div = document.createElement("div");
    div.className = "cart-item fade-in";

    div.innerHTML = `
      <img src="${item.imagen || item.image || '../assets/logo.jpg'}" alt="${item.nombre || item.name}" />
      <div>
        <h4>${item.nombre || item.name}</h4>
        <p>$${item.precio} x ${item.cantidad}</p>
        ${item.talla ? `<p><strong>Talla:</strong> ${item.talla}</p>` : ""}
        ${item.color || item.colores ? `<p><strong>Color:</strong> ${item.color || item.colores}</p>` : ""}
        <div class="cart-actions">
          <button onclick="changeQuantity('${item.id}', -1)">-</button>
          <button onclick="changeQuantity('${item.id}', 1)">+</button>
          <button onclick="removeFromCart('${item.id}')">❌</button>
        </div>
      </div>
    `;
    container.appendChild(div);
  });

  total.textContent = `$${calculateTotal()}`;
  if (totalUnidades) {
    totalUnidades.textContent = `Total unidades: ${unidades}`;
  }
}

// 💾 Guardar pedido en backend
async function guardarPedido() {
  const cart = getCart();
  const nombre = document.getElementById("cliente-nombre").value;
  const nota = document.getElementById("cliente-nota").value;

  if (!nombre || cart.length === 0) {
    alert("Completa tu nombre y asegúrate que el carrito tenga productos.");
    return;
  }

  const body = {
    items: cart.map(p => ({
      nombre: p.nombre || p.name,
      cantidad: p.cantidad,
      precio: p.precio
    })),
    total: calculateTotal(),
    nombreCliente: nombre,
    nota
  };

  try {
    const res = await fetch(`${API_URL}/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });

    if (res.ok) {
      alert("✅ Pedido guardado correctamente");
      localStorage.removeItem(CART_KEY);
      window.location.reload();
    } else {
      const err = await res.json();
      alert("❌ Error guardando pedido: " + err.message);
    }
  } catch (e) {
    alert("❌ Error de red: " + e.message);
  }
}
