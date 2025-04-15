const API_BASE = "https://km-ez-ropa-backend.onrender.com";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("formLogin");

  form?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = form.email.value.trim();
    const password = form.password.value.trim();

    if (!email || !password) {
      mostrarError("⚠️ Ingresa tu correo y contraseña.");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (!res.ok) {
        mostrarError(data.message || "❌ Error al iniciar sesión.");
        return;
      }

      // Guardar token y datos
      localStorage.setItem("km_ez_token", data.token);
      localStorage.setItem("km_ez_user", JSON.stringify(data.usuario));

      // Redirigir
      window.location.href = "/panel.html";
    } catch (err) {
      console.error("❌ Error:", err);
      mostrarError("❌ Error de red o servidor.");
    }
  });

  // Modo oscuro
  if (localStorage.getItem("modoOscuro") === "true") {
    document.body.classList.add("modo-oscuro");
  }
});

function mostrarError(msg) {
  const div = document.getElementById("errorMensaje");
  if (div) {
    div.textContent = msg;
    div.style.display = "block";
  }
}
