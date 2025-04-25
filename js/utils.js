// 📁 js/utils.js
import { API_BASE } from "./config.js";

const DEBUG_VISITAS = false; // Activar logs detallados solo si es necesario

/**
 * 📊 Registrar una visita pública anónima.
 * Solo se registra una vez cada 5 segundos por sesión.
 */
export function registrarVisitaPublica() {
  if (!navigator.onLine) {
    if (DEBUG_VISITAS) console.warn("📴 Sin conexión: visita no registrada.");
    return;
  }

  const cooldownKey = "visitaRegistrada";
  if (sessionStorage.getItem(cooldownKey)) {
    if (DEBUG_VISITAS) console.log("⏳ Ya se registró visita recientemente.");
    return;
  }

  const payload = {
    pagina: window.location.pathname || "desconocida",
    fecha: new Date().toISOString(),
    referrer: document.referrer || null,
    userAgent: navigator.userAgent || "desconocido",
    titulo: document.title || "sin título"
  };

  fetch(`${API_BASE}/api/visitas/registrar`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  })
    .then(res => {
      if (!res.ok) throw new Error("Respuesta no válida");
      return res.json();
    })
    .then(data => {
      if (DEBUG_VISITAS) console.log("📊 Visita registrada:", data);
      sessionStorage.setItem(cooldownKey, "true");
      setTimeout(() => sessionStorage.removeItem(cooldownKey), 5000);
    })
    .catch(err => {
      console.warn("⚠️ No se pudo registrar visita:", err.message);
    });
}
