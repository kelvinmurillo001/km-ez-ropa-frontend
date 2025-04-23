/**
 * 📦 Crea y muestra un modal accesible con contenido dinámico.
 * @param {string} titulo - Título del modal.
 * @param {HTMLElement|string} contenido - Contenido HTML o texto plano.
 */
export function abrirModal(titulo, contenido) {
  cerrarModal(); // Elimina modal anterior si existe

  // 🛡️ Overlay
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  overlay.id = "modal-overlay";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-labelledby", "modal-titulo");
  overlay.tabIndex = -1;

  // 🎯 Modal
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

  // 📄 Contenido
  const contentNode = document.createElement("div");
  contentNode.className = "modal-contenido";
  if (typeof contenido === "string") {
    contentNode.innerHTML = contenido;
  } else {
    contentNode.appendChild(contenido);
  }

  // 🧩 Ensamblar
  modal.appendChild(cerrar);
  modal.appendChild(h3);
  modal.appendChild(contentNode);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  // 🔁 Enfocar el modal automáticamente
  setTimeout(() => {
    modal.focus();
  }, 50);

  // ⌨️ Cerrar con Esc
  document.addEventListener("keydown", cerrarConEscape);
}

/**
 * ❌ Cierra el modal si está presente.
 */
export function cerrarModal() {
  const overlay = document.getElementById("modal-overlay");
  if (overlay) overlay.remove();
  document.removeEventListener("keydown", cerrarConEscape);
}

/**
 * ⌨️ Cerrar al presionar Esc
 */
function cerrarConEscape(e) {
  if (e.key === "Escape") cerrarModal();
}
