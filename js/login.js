const API_URL = "https://km-ez-ropa-backend.onrender.com/api";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");
  const usernameInput = document.getElementById("username");
  const passwordInput = document.getElementById("password");
  const error = document.getElementById("error");

  if (!form || !usernameInput || !passwordInput || !error) return;

  // 🔄 Limpiar errores al escribir
  [usernameInput, passwordInput].forEach(input => {
    input.addEventListener("input", () => {
      clearError(error);
    });
  });

  // 🔐 Login on submit
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const user = usernameInput.value.trim();
    const pass = passwordInput.value.trim();

    if (!user || !pass) {
      return showError("⚠️ Debes completar ambos campos", error);
    }

    console.log("📤 Enviando al backend:", { username: user, password: pass });

    await handleLogin(user, pass, error, form.querySelector("button"));
  });
});

/**
 * 🔓 Maneja el login completo
 */
async function handleLogin(username, password, errorEl, button) {
  button.disabled = true;
  button.textContent = "Entrando...";

  try {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();

    if (res.ok && data.token) {
      const payload = parseJwt(data.token);

      if (payload?.role !== "admin") {
        return showError("⛔ Solo los administradores pueden ingresar", errorEl);
      }

      localStorage.setItem("token", data.token);
      window.location.href = "panel.html";
    } else {
      showError(data.message || "❌ Usuario o contraseña incorrectos", errorEl);
    }

  } catch (err) {
    console.error("❌ Error de red:", err);
    showError("❌ Error de red. Intenta nuevamente.", errorEl);
  } finally {
    button.disabled = false;
    button.textContent = "Entrar";
  }
}

/**
 * ❌ Mostrar mensaje de error accesible
 */
function showError(msg, el) {
  if (!el) return;
  el.textContent = msg;
  el.setAttribute("role", "alert");
}

/**
 * 🔁 Limpia error visible
 */
function clearError(el) {
  el.textContent = "";
  el.removeAttribute("role");
}

/**
 * 🔍 Decodifica payload JWT
 */
function parseJwt(token) {
  try {
    const base64 = token.split('.')[1];
    return JSON.parse(atob(base64));
  } catch (err) {
    console.warn("❌ Token inválido:", err);
    return null;
  }
}

/**
 * 🔚 Cierra sesión y redirige
 */
function logout() {
  localStorage.removeItem("token");
  window.location.href = "login.html";
}
