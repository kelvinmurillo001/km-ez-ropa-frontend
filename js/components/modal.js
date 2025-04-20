"use strict";

// 📦 CREAR MODAL BÁSICO
export function crearModal(id = "modalPromo", contenidoHTML = "") {
  // Si ya existe, lo removemos
  const existente = document.getElementById(id);
  if (existente) existente.remove();

  const modal = document.createElement("div");
  modal.id = id;
  modal.className = "modal-overlay";
  modal.innerHTML = `
    <div class="modal">
      <button class="modal-cerrar" id="cerrarModal">✖️</button>
      <div class="modal-contenido">
        ${contenidoHTML}
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  document.getElementById("cerrarModal").addEventListener("click", () => modal.remove());
}

// 📦 FUNCIÓN PARA CARGAR FORMULARIO DE EDICIÓN
export function mostrarModalEdicion(promo) {
  const contenidoHTML = `
    <h3>✏️ Editar Promoción</h3>
    <form id="formEditarPromo" data-id="${promo._id}">
      <label>Mensaje:</label>
      <input type="text" id="editMensaje" value="${promo.message}" required />

      <label>Tema:</label>
      <select id="editTema">
        <option value="blue" ${promo.theme === "blue" ? "selected" : ""}>Azul</option>
        <option value="orange" ${promo.theme === "orange" ? "selected" : ""}>Naranja</option>
        <option value="green" ${promo.theme === "green" ? "selected" : ""}>Verde</option>
        <option value="red" ${promo.theme === "red" ? "selected" : ""}>Rojo</option>
      </select>

      <label>Fecha inicio:</label>
      <input type="date" id="editInicio" value="${promo.startDate?.substring(0, 10) || ""}" />

      <label>Fecha fin:</label>
      <input type="date" id="editFin" value="${promo.endDate?.substring(0, 10) || ""}" />

      <label>Posición:</label>
      <select id="editPosition">
        <option value="top" ${promo.position === "top" ? "selected" : ""}>🔝 Top</option>
        <option value="middle" ${promo.position === "middle" ? "selected" : ""}>📍 Medio</option>
        <option value="bottom" ${promo.position === "bottom" ? "selected" : ""}>🔻 Inferior</option>
      </select>

      <label>¿Activa?</label>
      <input type="checkbox" id="editActiva" ${promo.active ? "checked" : ""} />

      <button type="submit" class="btn mt-2">💾 Guardar</button>
    </form>
  `;

  crearModal("modalPromo", contenidoHTML);

  document.getElementById("formEditarPromo").addEventListener("submit", guardarCambiosPromo);
}

// 📦 GUARDAR CAMBIOS DESDE EL MODAL
async function guardarCambiosPromo(e) {
  e.preventDefault();
  const form = e.target;
  const id = form.dataset.id;

  const payload = {
    message: document.getElementById("editMensaje").value.trim(),
    theme: document.getElementById("editTema").value,
    startDate: document.getElementById("editInicio").value || null,
    endDate: document.getElementById("editFin").value || null,
    position: document.getElementById("editPosition").value,
    active: document.getElementById("editActiva").checked
  };

  try {
    const res = await fetch(`/api/promos`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${verificarSesion()}`
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "❌ Error al guardar");

    alert("✅ Promoción actualizada");
    document.getElementById("modalPromo")?.remove();

    // Opcional: Recargar el listado si estás en lista
    if (window.cargarTodasPromos) window.cargarTodasPromos();
  } catch (err) {
    console.error(err);
    alert("❌ No se pudo actualizar la promoción");
  }
}
