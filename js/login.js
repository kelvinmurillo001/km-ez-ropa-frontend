document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");
  const errorMsg = document.getElementById("loginError");

  // Si ya hay sesión activa, redirigir al dashboard
  const token = localStorage.getItem("km_ez_token");
  if (token) {
    window.location.href = "/dashboard.html";
    return;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorMsg.textContent = ""; // limpiar

    const email = document.getElementById("emailInput")?.value.trim();
    const password = document.getElementById("passwordInput")?.value.trim();

    if (!email || !password) {
      errorMsg.textContent = "⚠️ Por favor completa todos los campos.";
      return;
    }

    try {
      const res = await fetch("/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Credenciales inválidas");
      }

      // Guardar sesión
      localStorage.setItem("km_ez_token", data.token);
      localStorage.setItem("km_ez_admin_name", data.name);

      // Redirigir al dashboard
      window.location.href = "/dashboard.html";

    } catch (err) {
      errorMsg.textContent = "❌ " + err.message;
    }
  });
});
