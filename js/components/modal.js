// js/components/modal.js

/**
 * 📦 Crea y muestra un modal emergente con contenido dinámico.
 * @param {string} titulo - Título del modal.
 * @param {HTMLElement|string} contenido - Contenido HTML o texto plano.
 */
export function abrirModal(titulo, contenido) {
    // Eliminar si ya existe
    const existente = document.getElementById("modal-overlay");
    if (existente) existente.remove();
  
    // Crear contenedor overlay
    const overlay = document.createElement("div");
    overlay.classList.add("modal-overlay");
    overlay.id = "modal-overlay";
  
    // Crear modal interno
    const modal = document.createElement("div");
    modal.classList.add("modal");
  
    // Cerrar
    const cerrar = document.createElement("button");
    cerrar.classList.add("modal-cerrar");
    cerrar.innerHTML = "✖";
    cerrar.addEventListener("click", cerrarModal);
  
    // Título
    const h3 = document.createElement("h3");
    h3.textContent = titulo;
  
    // Contenido
    const contentNode = document.createElement("div");
    if (typeof contenido === "string") {
      contentNode.innerHTML = contenido;
    } else {
      contentNode.appendChild(contenido);
    }
  
    // Armar
    modal.appendChild(cerrar);
    modal.appendChild(h3);
    modal.appendChild(contentNode);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
  }
  
  /**
   * ❌ Cierra el modal
   */
  export function cerrarModal() {
    const overlay = document.getElementById("modal-overlay");
    if (overlay) overlay.remove();
  }
  