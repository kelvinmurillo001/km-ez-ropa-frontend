// utils.js
import { API_BASE } from "./config.js";

/**
 * 📊 Registrar una visita pública (sin autenticación)
 * Enviará datos como página visitada, fecha y contexto básico
 */
export function registrarVisitaPublica() {
  // ⚠️ Si no hay conexión, no lo intentes
  if (!navigator.onLine) {
    console.warn("📴 Sin conexión, no se registra visita.");
    return;
  }

  // ⚠️ Verifica que no se haya registrado en los últimos 5 segundos
  if (sessionStorage.getItem("visitaRegistrada")) return;

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
    .then(res => res.json())
    .then(data => {
      console.log("📊 Visita registrada:", data);
      sessionStorage.setItem("visitaRegistrada", "true");
      setTimeout(() => sessionStorage.removeItem("visitaRegistrada"), 5000); // Prevención doble envío
    })
    .catch(err => {
      console.warn("⚠️ No se pudo registrar visita (no crítico):", err.message);
    });
}
