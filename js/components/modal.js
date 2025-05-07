"use strict";

/**
 * 📦 Crea y muestra un modal accesible con contenido dinámico.
 * @param {string} titulo - Título del modal.
 * @param {HTMLElement|string} contenido - Contenido HTML o texto plano.
 */

let ultimoFoco = null;

/* ───────────────────────────────────────────── */
/* ➡️ Abrir Modal                                */
/* ───────────────────────────────────────────── */
export function abrirModal(titulo, contenido) {
  cerrarModal(); // ❌ Cierra modales existentes

  ultimoFoco = document.activeElement;

  // 🛡️ Overlay
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay fade-in";
  overlay.id = "modal-overlay";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-labelledby", "modal-titulo");
  overlay.tabIndex = -1;

  // 🧱 Modal principal
  const modal = document.createElement("div");
  modal.className = "modal";
  modal.tabIndex = -1;

  // ❌ Botón cerrar
  const cerrarBtn = document.createElement("button");
  cerrarBtn.className = "modal-cerrar";
  cerrarBtn.innerHTML = "✖";
  cerrarBtn.setAttribute("aria-label", "Cerrar modal");
  cerrarBtn.addEventListener("click", cerrarModal);
  cerrarBtn.addEventListener("keydown", e => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      cerrarModal();
    }
  });

  // 📝 Título
  const tituloNode = document.createElement("h3");
  tituloNode.id = "modal-titulo";
  tituloNode.textContent = titulo;

  // 📄 Contenido
  const contenidoNode = document.createElement("div");
  contenidoNode.className = "modal-contenido";

  if (typeof contenido === "string") {
    contenidoNode.innerHTML = contenido;
  } else if (contenido instanceof HTMLElement) {
    contenidoNode.appendChild(contenido);
  }

  // 🧩 Ensamblar
  modal.append(cerrarBtn, tituloNode, contenidoNode);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  document.body.classList.add("no-scroll");

  // 🧠 Foco automático
  setTimeout(() => modal.focus(), 60);

  // 🧽 Listeners
  overlay.addEventListener("click", e => {
    if (e.target === overlay) cerrarModal();
  });

  document.addEventListener("keydown", cerrarConEscape);
}

/* ───────────────────────────────────────────── */
/* ❌ Cerrar Modal                               */
/* ───────────────────────────────────────────── */
export function cerrarModal() {
  const overlay = document.getElementById("modal-overlay");
  if (overlay) {
    overlay.classList.remove("fade-in");
    overlay.classList.add("fade-out");

    setTimeout(() => {
      overlay.remove();
      document.body.classList.remove("no-scroll");
    }, 200);
  }

  // 🔁 Foco de retorno
  if (ultimoFoco && typeof ultimoFoco.focus === "function") {
    setTimeout(() => ultimoFoco.focus(), 100);
    ultimoFoco = null;
  }

  document.removeEventListener("keydown", cerrarConEscape);
}

/* ───────────────────────────────────────────── */
/* ⌨️ Cerrar con tecla Escape                    */
/* ───────────────────────────────────────────── */
function cerrarConEscape(e) {
  if (e.key === "Escape") {
    e.preventDefault();
    cerrarModal();
  }
}
