"use strict";

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const res = await fetch("https://km-ez-ropa-backend.onrender.com/api/promos");
    const promos = await res.json();

    if (!Array.isArray(promos)) return;

    const path = window.location.pathname;
    const currentPage = getPageFromPath(path);

    promos.forEach(promo => {
      if (!promo.active || !promo.pages.includes(currentPage)) return;

      const container = document.createElement("div");
      container.classList.add("promo-banner");
      container.classList.add(`position-${promo.position}`);

      if (promo.mediaType === "image" && promo.mediaUrl) {
        container.innerHTML = `<img src="${promo.mediaUrl}" alt="Promo" style="width:100%; border-radius:6px;">`;
      } else if (promo.mediaType === "video" && promo.mediaUrl) {
        container.innerHTML = `
          <video controls autoplay muted style="max-width:100%; border-radius:6px;">
            <source src="${promo.mediaUrl}" type="video/mp4">
            Tu navegador no soporta el video.
          </video>
        `;
      } else {
        container.textContent = promo.message;
      }

      insertarEnPosicion(container, promo.position);
    });

  } catch (err) {
    console.error("❌ Error cargando promociones en display:", err);
  }
});

function getPageFromPath(path) {
  if (path === "/" || path.includes("index")) return "home";
  if (path.includes("categorias")) return "categorias";
  if (path.includes("productos")) return "productos";
  if (path.includes("detalle")) return "detalle";
  if (path.includes("checkout")) return "checkout";
  return "";
}

function insertarEnPosicion(el, pos) {
  const main = document.querySelector("main") || document.body;
  if (pos === "top") main.prepend(el);
  else if (pos === "bottom") main.appendChild(el);
  else main.insertBefore(el, main.children[Math.floor(main.children.length / 2)]);
}
