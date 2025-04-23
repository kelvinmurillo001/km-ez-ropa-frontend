// 📁 js/utils.js
import { API_BASE } from "./config.js";

/**
 * 📊 Registrar una visita pública anónima
 * Este registro se envía solo una vez cada 5 segundos por sesión
 * para evitar sobrecarga innecesaria en el backend.
 */
export function registrarVisitaPublica() {
  if (!navigator.onLine) {
    console.warn("📴 Sin conexión: visita no registrada.");
    return;
  }

  // Prevenir registros duplicados por sesión
  const cooldownKey = "visitaRegistrada";
  if (sessionStorage.getItem(cooldownKey)) return;

  const payload = {
    pagina: window.location.pathname,
    fecha: new Date().toISOString(),
    referrer: document.referrer || null,
    userAgent: navigator.userAgent,
    titulo: document.title || null
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
      console.log("📊 Visita registrada:", data);
      sessionStorage.setItem(cooldownKey, "true");
      setTimeout(() => sessionStorage.removeItem(cooldownKey), 5000);
    })
    .catch(err => {
      console.warn("⚠️ No se pudo registrar visita:", err.message);
    });
}
