document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");
  const usernameInput = document.getElementById("username");
  const passwordInput = document.getElementById("password");
  const error = document.getElementById("error");

  // Solo ejecuta si es login.html
  if (!form || !usernameInput || !passwordInput || !error) return;

  // Limpiar mensaje de error al escribir
  [usernameInput, passwordInput].forEach(input => {
    input.addEventListener("input", () => error.textContent = "");
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const button = e.target.querySelector("button");
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    error.textContent = "";
    button.disabled = true;
    button.textContent = "Entrando...";

    if (!username || !password) {
      error.textContent = "⚠️ Debes completar ambos campos";
      button.disabled = false;
      button.textContent = "Entrar";
      return;
    }

    try {
      const res = await fetch("https://km-ez-ropa-backend.onrender.com/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();

      if (res.ok && data.token) {
        localStorage.setItem("token", data.token);
        window.location.href = "panel.html";
      } else {
        error.textContent = data.message || "❌ Usuario o contraseña incorrectos";
      }

    } catch (err) {
      console.error("❌ Error en la solicitud:", err);
      error.textContent = "⚠️ No se pudo conectar con el servidor";
    } finally {
      button.disabled = false;
      button.textContent = "Entrar";
    }
  });
});

// ✅ Verifica el token antes de acceder a páginas protegidas
function verificarToken() {
  const token = localStorage.getItem("token");
  if (!token) {
    alert("⚠️ No autorizado. Inicia sesión primero.");
    window.location.href = "login.html";
  }
}
