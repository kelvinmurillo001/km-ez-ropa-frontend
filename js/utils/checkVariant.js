// frontend/js/utils/checkVariant.js

/**
 * Valida si una variante específica de talla y color está disponible.
 * @param {Array} variants - Lista de variantes disponibles del producto.
 * @param {string} talla - Talla seleccionada por el usuario.
 * @param {string} color - Color seleccionado por el usuario.
 * @param {number} cantidad - Cantidad deseada.
 * @returns {Object} - Resultado de la validación: { ok: Boolean, message?: String, variante?: Object }
 */
export function validarVariante(variants = [], talla, color, cantidad = 1) {
    if (!Array.isArray(variants) || variants.length === 0) {
      return { ok: false, message: "❌ Este producto no tiene variantes registradas." };
    }
  
    const keyTalla = (talla || "").trim().toLowerCase();
    const keyColor = (color || "").trim().toLowerCase();
  
    if (!keyTalla || !keyColor) {
      return { ok: false, message: "⚠️ Debes seleccionar una talla y un color." };
    }
  
    const variante = variants.find(
      v => v.talla === keyTalla && v.color === keyColor
    );
  
    if (!variante) {
      return {
        ok: false,
        message: `❌ Variante no encontrada: ${talla} - ${color}`
      };
    }
  
    if (!variante.activo) {
      return {
        ok: false,
        message: `❌ Variante inactiva: ${talla} - ${color}`
      };
    }
  
    if (typeof cantidad !== "number" || cantidad <= 0) {
      return {
        ok: false,
        message: "⚠️ Cantidad inválida."
      };
    }
  
    if (variante.stock < cantidad) {
      return {
        ok: false,
        message: `❌ No hay suficiente stock disponible para ${talla} - ${color}.`
      };
    }
  
    return { ok: true, variante };
  }
  