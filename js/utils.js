import { API_BASE } from "./config.js";

const DEBUG_VISITAS = false;
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 3000;
const COOLDOWN_KEY = "visitaRegistrada";
const COOLDOWN_MS = 5000;

/**
 * 📊 Registrar una visita anónima
 */
export function registrarVisitaPublica() {
  try {
    if (typeof window === "undefined" || typeof document === "undefined") {
      if (DEBUG_VISITAS) console.warn("⛔️ Entorno no compatible para registrar visitas.");
      return;
    }

    if (!navigator.onLine) {
      if (DEBUG_VISITAS) console.warn("📴 Sin conexión. No se registra visita.");
      return;
    }

    if (sessionStorage.getItem(COOLDOWN_KEY)) {
      if (DEBUG_VISITAS) console.log("🕒 Visita ya registrada recientemente.");
      return;
    }

    const payload = {
      pagina: window.location.pathname || "desconocida",
      titulo: document.title || "sin título",
      fecha: new Date().toISOString(),
      referrer: document.referrer || null,
      userAgent: navigator.userAgent || "navegador-desconocido"
    };

    intentarRegistro(payload, 0);
  } catch (error) {
    if (DEBUG_VISITAS) console.error("❌ Error inesperado al preparar visita:", error);
  }
}

/**
 * 🔁 Intento con reintento automático
 */
function intentarRegistro(payload, intentoActual) {
  fetch(`${API_BASE}/api/visitas/registrar`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  })
    .then(async (res) => {
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.message || `HTTP ${res.status}`);
      }

      sessionStorage.setItem(COOLDOWN_KEY, "true");
      setTimeout(() => sessionStorage.removeItem(COOLDOWN_KEY), COOLDOWN_MS);

      if (DEBUG_VISITAS) {
        console.log(`✅ Visita registrada (Intento #${intentoActual + 1})`, data);
      }
    })
    .catch(err => {
      if (intentoActual < MAX_RETRIES) {
        if (DEBUG_VISITAS) {
          console.warn(`⚠️ Error registrando visita. Reintentando (${intentoActual + 1}/${MAX_RETRIES}) en ${RETRY_DELAY_MS / 1000}s`, err.message);
        }
        setTimeout(() => intentarRegistro(payload, intentoActual + 1), RETRY_DELAY_MS);
      } else {
        console.error("❌ Registro de visita falló después de varios intentos:", err.message);
      }
    });
}
