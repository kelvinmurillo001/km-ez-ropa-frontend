const API_URL = "https://km-ez-ropa-backend.onrender.com/api";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");
  const usernameInput = document.getElementById("username");
  const passwordInput = document.getElementById("password");
  const error = document.getElementById("error");

  if (!form || !usernameInput || !passwordInput || !error) return;

  /**
   * 🔄 Limpia errores al escribir
   */
  [usernameInput, passwordInput].forEach(input => {
    input.addEventListener("input", () => {
      error.textContent = "";
      error.removeAttribute("role");
    });
  });

  /**
   * 🔐 Manejo del envío de formulario de login
   */
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const button = form.querySelector("button");
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    if (!username || !password) {
      return showError("⚠️ Debes completar ambos campos");
    }

    button.disabled = true;
    button.textContent = "Entrando...";

    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();

      if (res.ok && data.token) {
        const token = data.token;
        const payload = parseJwt(token);

        // ✅ Validar rol de administrador
        if (payload?.role !== "admin") {
          return showError("⛔ Solo los administradores pueden ingresar");
        }

        localStorage.setItem("token", token);
        window.location.href = "panel.html";
      } else {
        showError(data.message || "❌ Usuario o contraseña incorrectos");
      }

    } catch (err) {
      console.error("❌ Error de red:", err);
      showError("❌ Error de red. Intenta nuevamente.");
    } finally {
      button.disabled = false;
      button.textContent = "Entrar";
    }
  });

  /**
   * ⚠️ Mostrar errores accesibles
   */
  function showError(msg) {
    error.textContent = msg;
    error.setAttribute("role", "alert");
  }

  /**
   * 🔍 Decodificar payload del JWT
   */
  function parseJwt(token) {
    try {
      const payload = token.split('.')[1];
      return JSON.parse(atob(payload));
    } catch {
      return null;
    }
  }
});

/**
 * ✅ Verifica token en páginas protegidas
 */
function verificarToken() {
  const token = localStorage.getItem("token");

  if (!token || token.split('.').length !== 3) {
    alert("⚠️ No autorizado. Inicia sesión primero.");
    logout();
    return;
  }

  const payload = JSON.parse(atob(token.split('.')[1]));

  if (payload.role !== "admin") {
    alert("⛔ Acceso restringido. Solo administradores.");
    logout();
  }
}

/**
 * 🔁 Cerrar sesión y redirigir
 */
function logout() {
  localStorage.removeItem("token");
  window.location.href = "login.html";
}
