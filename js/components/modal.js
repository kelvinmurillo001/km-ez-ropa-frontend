/**
 * 📦 Crea y muestra un modal accesible con contenido dinámico.
 * @param {string} titulo - Título del modal.
 * @param {HTMLElement|string} contenido - Contenido HTML o texto plano.
 */
let ultimoFoco = null;

export function abrirModal(titulo, contenido) {
  cerrarModal(); // Elimina cualquier modal anterior

  ultimoFoco = document.activeElement;

  // 🛡️ Overlay
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay fade-in";
  overlay.id = "modal-overlay";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-labelledby", "modal-titulo");
  overlay.tabIndex = -1;

  // 🎯 Modal principal
  const modal = document.createElement("div");
  modal.className = "modal";
  modal.tabIndex = -1;

  // ❌ Botón cerrar
  const cerrar = document.createElement("button");
  cerrar.className = "modal-cerrar";
  cerrar.innerHTML = "✖";
  cerrar.setAttribute("aria-label", "Cerrar modal");
  cerrar.addEventListener("click", cerrarModal);

  // 📝 Título
  const h3 = document.createElement("h3");
  h3.id = "modal-titulo";
  h3.textContent = titulo;

  // 📄 Contenido dinámico
  const contentNode = document.createElement("div");
  contentNode.className = "modal-contenido";
  if (typeof contenido === "string") {
    contentNode.innerHTML = contenido;
  } else {
    contentNode.appendChild(contenido);
  }

  // 🧩 Ensamblar estructura
  modal.appendChild(cerrar);
  modal.appendChild(h3);
  modal.appendChild(contentNode);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  document.body.classList.add("no-scroll");

  // 🔁 Enfocar modal al renderizar
  setTimeout(() => modal.focus(), 50);

  // ⌨️ Esc key
  document.addEventListener("keydown", cerrarConEscape);

  // 🖱️ Cerrar al hacer clic fuera del modal
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) cerrarModal();
  });
}

/**
 * ❌ Cierra el modal si existe.
 */
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

  if (ultimoFoco && typeof ultimoFoco.focus === "function") {
    ultimoFoco.focus();
  }

  document.removeEventListener("keydown", cerrarConEscape);
}

/**
 * ⌨️ Cierra con Escape
 */
function cerrarConEscape(e) {
  if (e.key === "Escape") cerrarModal();
}
