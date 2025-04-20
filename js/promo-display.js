"use strict";

// ✅ Cargar promociones activas
document.addEventListener("DOMContentLoaded", async () => {
  try {
    const res = await fetch("https://km-ez-ropa-backend.onrender.com/api/promos");
    const promos = await res.json();

    if (!Array.isArray(promos) || promos.length === 0) return;

    const pageKey = obtenerClavePagina(window.location.pathname);
    const hoy = new Date();

    const activas = promos.filter(promo =>
      promo.active &&
      Array.isArray(promo.pages) &&
      promo.pages.includes(pageKey) &&
      (!promo.startDate || new Date(promo.startDate) <= hoy) &&
      (!promo.endDate || new Date(promo.endDate) >= hoy)
    );

    activas.forEach(promo => mostrarPromo(promo));
  } catch (err) {
    console.error("❌ Error al cargar promociones activas:", err);
  }
});

// 🧠 Detección automática de página
function obtenerClavePagina(path) {
  if (path.includes("checkout")) return "checkout";
  if (path.includes("carrito")) return "carrito";
  if (path.includes("categorias")) return "categorias";
  if (path.includes("productos")) return "productos";
  if (path.includes("detalle")) return "detalle";
  if (path === "/" || path.includes("index")) return "home";
  return "otros";
}

// 🎯 Mostrar promoción
function mostrarPromo(promo) {
  const promoBox = document.createElement("section");
  promoBox.className = `promo-display promo-${promo.theme || "blue"} promo-${promo.position || "top"}`;
  promoBox.setAttribute("role", "region");
  promoBox.setAttribute("aria-label", "Promoción destacada");

  // 💬 Mensaje
  let contenido = `<p class="promo-msg">📣 ${promo.message}</p>`;

  // 🖼️ Imagen
  if (promo.mediaType === "image" && promo.mediaUrl) {
    contenido += `<img src="${promo.mediaUrl}" alt="Promoción" class="promo-img" loading="lazy" />`;
  }

  // 🎬 Video
  if (promo.mediaType === "video" && promo.mediaUrl) {
    contenido += `
      <video controls class="promo-video" preload="metadata">
        <source src="${promo.mediaUrl}" type="video/mp4" />
        Tu navegador no soporta video.
      </video>`;
  }

  promoBox.innerHTML = contenido;

  // 📌 Insertar
  const container = document.querySelector("main") || document.body;
  if (promo.position === "top") {
    container.prepend(promoBox);
  } else if (promo.position === "bottom") {
    container.appendChild(promoBox);
  } else {
    // Por defecto middle → dentro de <main>
    const target = document.querySelector("main");
    if (target) {
      target.insertBefore(promoBox, target.firstChild);
    } else {
      container.appendChild(promoBox);
    }
  }
}
