"use strict";

// 📦 Cargar promociones al iniciar
document.addEventListener("DOMContentLoaded", async () => {
  try {
    const res = await fetch("https://km-ez-ropa-backend.onrender.com/api/promos");
    if (!res.ok) throw new Error("❌ Error al obtener promociones");
    
    const { data: promos = [] } = await res.json();
    if (!Array.isArray(promos) || promos.length === 0) return;

    const clavePagina = detectarClavePagina(window.location.pathname);
    const hoy = new Date();

    const activas = promos.filter(p =>
      p.active &&
      Array.isArray(p.pages) &&
      p.pages.includes(clavePagina) &&
      (!p.startDate || new Date(p.startDate) <= hoy) &&
      (!p.endDate || new Date(p.endDate) >= hoy)
    );

    const agrupadas = agruparPorPosicion(activas);
    Object.entries(agrupadas).forEach(([posicion, grupoPromos]) => {
      mostrarRotador(grupoPromos, posicion);
    });

  } catch (err) {
    console.error("❌ Error al cargar promociones activas:", err.message);
  }
});

// 🧠 Identificar página actual
function detectarClavePagina(path) {
  if (path.includes("checkout")) return "checkout";
  if (path.includes("carrito")) return "carrito";
  if (path.includes("categorias")) return "categorias";
  if (path.includes("productos")) return "productos";
  if (path.includes("detalle")) return "detalle";
  if (path === "/" || path.includes("index")) return "home";
  return "otros";
}

// 🔢 Agrupar promociones por posición
function agruparPorPosicion(lista = []) {
  return lista.reduce((acc, promo) => {
    const pos = promo.position || "top";
    if (!acc[pos]) acc[pos] = [];
    acc[pos].push(promo);
    return acc;
  }, {});
}

// 🎯 Mostrar carrusel de promociones
function mostrarRotador(promos = [], posicion = "top") {
  if (!promos.length) return;

  const wrapper = document.createElement("section");
  wrapper.className = `promo-display promo-${promos[0].theme || "blue"} promo-${posicion}`;
  wrapper.setAttribute("role", "region");
  wrapper.setAttribute("aria-label", `Promociones en posición ${posicion}`);
  wrapper.style.position = "relative";
  wrapper.style.overflow = "hidden";

  const contenedor = document.createElement("div");
  contenedor.className = "promo-slider";
  contenedor.style.whiteSpace = "nowrap";
  contenedor.style.transition = "transform 0.5s ease-in-out";

  promos.forEach((promo, i) => {
    const slide = document.createElement("div");
    slide.className = "promo-slide";
    slide.setAttribute("aria-hidden", i > 0 ? "true" : "false");
    slide.style.display = "inline-block";
    slide.style.width = "100%";

    let contenido = `<p class="promo-msg">📣 ${sanitize(promo.message)}</p>`;

    if (promo.mediaType === "image" && promo.mediaUrl) {
      contenido += `<img src="${promo.mediaUrl}" alt="Imagen promocional" class="promo-img" loading="lazy" onerror="this.style.display='none'" />`;
    }

    if (promo.mediaType === "video" && promo.mediaUrl) {
      contenido += `
        <video controls class="promo-video" preload="metadata">
          <source src="${promo.mediaUrl}" type="video/mp4" />
          Tu navegador no soporta video.
        </video>`;
    }

    slide.innerHTML = contenido;
    contenedor.appendChild(slide);
  });

  wrapper.appendChild(contenedor);
  insertarSegunPosicion(wrapper, posicion);

  if (promos.length > 1) {
    let index = 0;
    setInterval(() => {
      index = (index + 1) % promos.length;
      contenedor.style.transform = `translateX(-${index * 100}%)`;

      [...contenedor.children].forEach((slide, i) =>
        slide.setAttribute("aria-hidden", i !== index)
      );
    }, 6000);
  }
}

// 🧼 Sanear contenido
function sanitize(text = "") {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// 🏗️ Insertar banner según posición
function insertarSegunPosicion(elemento, posicion) {
  const main = document.querySelector("main");
  const body = document.body;

  switch (posicion) {
    case "top":
      main?.prepend(elemento) || body.prepend(elemento);
      break;
    case "bottom":
      main?.appendChild(elemento) || body.appendChild(elemento);
      break;
    case "middle":
      if (main?.firstChild) {
        main.insertBefore(elemento, main.firstChild);
      } else {
        main?.appendChild(elemento) || body.appendChild(elemento);
      }
      break;
    default:
      body.appendChild(elemento);
  }
}
