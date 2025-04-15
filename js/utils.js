/**
 * 📊 Registrar una visita pública (sin autenticación)
 * Enviará datos como página visitada y fecha
 */
export function registrarVisitaPublica() {
    fetch("https://km-ez-ropa-backend.onrender.com/api/visitas/registrar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pagina: window.location.pathname,
        fecha: new Date().toISOString()
      })
    })
    .then(res => res.json())
    .then(data => console.log("📊 Visita registrada:", data))
    .catch(err => console.error("❌ Error registrando visita:", err));
  }
  