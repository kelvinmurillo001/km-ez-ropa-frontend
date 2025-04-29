import { API_BASE } from "./config.js";

const DEBUG_VISITAS = false; // Activar logs detallados solo si es necesario
const MAX_RETRIES = 3; // 🔁 Máximo de intentos
const RETRY_DELAY_MS = 3000; // ⏳ Espera 3 segundos entre reintentos

/**
 * 📊 Registrar una visita pública anónima con reintento automático.
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

  intentarRegistro(payload, 0);
}

/**
 * 🔁 Función interna que maneja los reintentos automáticos
 */
function intentarRegistro(payload, intentoActual) {
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
      if (DEBUG_VISITAS) console.log(`📊 Visita registrada exitosamente. (Intento #${intentoActual + 1})`, data);
      sessionStorage.setItem("visitaRegistrada", "true");
      setTimeout(() => sessionStorage.removeItem("visitaRegistrada"), 5000);
    })
    .catch(err => {
      if (intentoActual < MAX_RETRIES) {
        if (DEBUG_VISITAS) console.warn(`⚠️ Fallo registrando visita. Reintentando en ${RETRY_DELAY_MS / 1000}s... (Intento #${intentoActual + 1})`);
        setTimeout(() => intentarRegistro(payload, intentoActual + 1), RETRY_DELAY_MS);
      } else {
        console.warn("❌ No se pudo registrar la visita tras varios intentos:", err.message);
      }
    });
}
