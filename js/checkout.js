"use strict";

// ✅ Configuración base
import { API_BASE } from "./config.js";

const STORAGE_KEY = "km_ez_cart";
let carrito = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

const resumenPedido = document.getElementById("resumenPedido");
const totalFinal = document.getElementById("totalFinal");
const form = document.getElementById("formCheckout");
const msgEstado = document.getElementById("msgEstado");
const btnUbicacion = document.getElementById("btnUbicacion");

const API_ORDERS = `${API_BASE}/api/orders`;

// ▶️ Mostrar resumen del pedido
document.addEventListener("DOMContentLoaded", () => {
  if (!Array.isArray(carrito) || carrito.length === 0) {
    resumenPedido.innerHTML = `<p style="color:orange; text-align:center;">⚠️ Tu carrito está vacío.</p>`;
    totalFinal.textContent = "$0.00";
    form?.querySelector("button[type='submit']")?.setAttribute("disabled", "true");
    return;
  }

  let total = 0;
  resumenPedido.innerHTML = carrito.map(item => {
    const nombre = sanitizeText(item.nombre || "Producto sin nombre");
    const talla = sanitizeText(item.talla || "Única");
    const cantidad = parseInt(item.cantidad) || 0;
    const precio = parseFloat(item.precio) || 0;
    const subtotal = precio * cantidad;
    total += subtotal;

    return `
      <div class="resumen-item">
        <p>👕 <strong>${nombre}</strong> | Talla: ${talla} | Cant: ${cantidad} | $${subtotal.toFixed(2)}</p>
      </div>
    `;
  }).join("");

  totalFinal.textContent = `$${total.toFixed(2)}`;
});

// ✅ Confirmar pedido
form?.addEventListener("submit", async e => {
  e.preventDefault();
  msgEstado.textContent = "⏳ Enviando pedido...";
  msgEstado.style.color = "#ccc";

  const nombre = document.getElementById("nombreInput").value.trim();
  const email = document.getElementById("emailInput").value.trim();
  const telefono = document.getElementById("telefonoInput").value.trim();
  const direccion = document.getElementById("direccionInput").value.trim();
  const metodoPago = document.querySelector("input[name='metodoPago']:checked")?.value;

  if (!nombre || !email || !telefono || !direccion || !metodoPago) {
    return mostrarError("❌ Todos los campos son obligatorios.");
  }

  if (!validarEmail(email)) {
    return mostrarError("❌ Email inválido.");
  }

  if (!/^[0-9+\-\s]{7,15}$/.test(telefono)) {
    return mostrarError("❌ Teléfono inválido. Usa solo dígitos, espacios, + o -");
  }

  const total = carrito.reduce((acc, item) =>
    acc + (parseFloat(item.precio) || 0) * (parseInt(item.cantidad) || 0), 0
  );

  const pedido = {
    nombreCliente: sanitizeText(nombre),
    email,
    telefono,
    direccion: sanitizeText(direccion),
    metodoPago,
    total,
    estado: metodoPago === "transferencia" ? "pendiente" : "pagado",
    items: carrito.map(item => ({
      productId: item.id || null,
      name: sanitizeText(item.nombre || ""),
      talla: sanitizeText(item.talla || ""),
      cantidad: parseInt(item.cantidad) || 1,
      precio: parseFloat(item.precio) || 0
    }))
  };

  try {
    const res = await fetch(API_ORDERS, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(pedido)
    });

    if (!res.ok) throw new Error("Error al enviar el pedido");

    msgEstado.textContent = "✅ Pedido enviado con éxito. ¡Gracias por tu compra!";
    msgEstado.style.color = "limegreen";

    // ✅ Enviar por WhatsApp si es transferencia
    if (metodoPago === "transferencia") {
      const mensajeWA = `
📦 *NUEVO PEDIDO POR TRANSFERENCIA*

👤 *Cliente:* ${nombre}
📞 *Teléfono:* ${telefono}
📧 *Email:* ${email}
📍 *Dirección:* ${direccion}

🛍️ *Productos:*
${carrito.map(i => `• ${i.cantidad} x ${i.nombre} - Talla: ${i.talla} - $${(i.precio * i.cantidad).toFixed(2)}`).join("\n")}

💳 *Pago:* Transferencia Bancaria
💰 *Total:* $${total.toFixed(2)}

📲 *Responder para confirmar o coordinar el pago.*
      `.trim();

      const whatsappURL = `https://wa.me/593990270864?text=${encodeURIComponent(mensajeWA)}`;
      window.open(whatsappURL, "_blank");
    }

    localStorage.removeItem(STORAGE_KEY);

    setTimeout(() => {
      window.location.href = "/index.html";
    }, 2500);
  } catch (err) {
    console.error("❌", err);
    mostrarError("❌ No se pudo enviar el pedido. Intenta nuevamente.");
  }
});

// ✅ Validar email
function validarEmail(email) {
  const regex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]{2,}$/;
  return regex.test(email);
}

// ✅ Mostrar errores
function mostrarError(msg) {
  msgEstado.textContent = msg;
  msgEstado.style.color = "tomato";
}

// ✅ Limpiar texto para seguridad
function sanitizeText(text) {
  const temp = document.createElement("div");
  temp.textContent = text;
  return temp.innerHTML;
}

// 🌍 Obtener ubicación
function obtenerUbicacion() {
  if (!navigator.geolocation) {
    mostrarError("⚠️ Tu navegador no soporta geolocalización.");
    return;
  }

  msgEstado.textContent = "📍 Obteniendo ubicación...";

  navigator.geolocation.getCurrentPosition(
    async position => {
      const { latitude, longitude } = position.coords;
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`);
        const data = await res.json();
        const direccion = data.display_name || `${latitude}, ${longitude}`;
        document.getElementById("direccionInput").value = direccion;
        msgEstado.textContent = "✅ Dirección sugerida completada automáticamente.";
        msgEstado.style.color = "limegreen";
      } catch (err) {
        console.error("Error al obtener dirección:", err);
        mostrarError("❌ No se pudo obtener la dirección.");
      }
    },
    () => mostrarError("❌ No se pudo acceder a la ubicación.")
  );
}

btnUbicacion?.addEventListener("click", obtenerUbicacion);
