const API_URL = "https://km-ez-ropa-backend.onrender.com/api";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");
  const usernameInput = document.getElementById("username");
  const passwordInput = document.getElementById("password");
  const error = document.getElementById("error");

  if (!form || !usernameInput || !passwordInput || !error) return;

  // 🔄 Limpiar error al escribir
  [usernameInput, passwordInput].forEach(input => {
    input.addEventListener("input", () => {
      error.textContent = "";
      error.removeAttribute("role");
    });
  });

  // 🔐 Envío de formulario
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const button = form.querySelector("button");
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    if (!username || !password) {
      showError("⚠️ Debes completar ambos campos");
      return;
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
        // 🧠 Validar rol
        const payload = JSON.parse(atob(data.token.split('.')[1]));
        if (payload.role !== "admin") {
          showError("⛔ Solo los administradores pueden ingresar");
          return;
        }

        // ✅ Guardar token y redirigir
        localStorage.setItem("token", data.token);
        window.location.href = "panel.html";
      } else {
        showError(data.message || "❌ Usuario o contraseña incorrectos");
      }

    } catch (err) {
      console.error("❌ Error al conectar:", err);
      showError("❌ Error de red. Intenta nuevamente.");
    } finally {
      button.disabled = false;
      button.textContent = "Entrar";
    }
  });

  function showError(msg) {
    error.textContent = msg;
    error.setAttribute("role", "alert");
  }
});

// ✅ Verifica token para páginas protegidas (ej. panel.html)
function verificarToken() {
  const token = localStorage.getItem("token");
  if (!token) {
    alert("⚠️ No autorizado. Inicia sesión primero.");
    window.location.href = "login.html";
    return;
  }

  const payload = JSON.parse(atob(token.split('.')[1]));
  if (payload.role !== "admin") {
    alert("⛔ Acceso restringido. Solo administradores.");
    localStorage.removeItem("token");
    window.location.href = "login.html";
  }
}

// 🔁 Cerrar sesión
function logout() {
  localStorage.removeItem("token");
  window.location.href = "login.html";
}
