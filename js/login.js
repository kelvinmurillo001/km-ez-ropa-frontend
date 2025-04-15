"use strict";

const API_URL = "https://km-ez-ropa-backend.onrender.com/api";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");
  const usernameInput = document.getElementById("username");
  const passwordInput = document.getElementById("password");
  const error = document.getElementById("error");
  const submitBtn = form?.querySelector("button");

  if (!form || !usernameInput || !passwordInput || !error || !submitBtn) return;

  // 🔄 Limpiar errores al escribir
  [usernameInput, passwordInput].forEach(input =>
    input.addEventListener("input", () => clearError(error))
  );

  // 🔐 Login al enviar
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    if (!username || !password) {
      return showError("⚠️ Debes completar ambos campos.", error);
    }

    // 🧪 Validación simple
    if (username.length < 3 || password.length < 4) {
      return showError("❌ Credenciales demasiado cortas.", error);
    }

    await handleLogin(username, password, error, submitBtn);
  });
});

/**
 * 🔐 Procesa el login contra el backend
 */
async function handleLogin(username, password, errorEl, button) {
  try {
    toggleButtonState(button, true, "⏳ Verificando...");

    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();

    if (!res.ok || !data.token) {
      const msg = data.message || "❌ Usuario o contraseña incorrectos.";
      return showError(msg, errorEl);
    }

    const payload = parseJwt(data.token);

    if (!payload || payload.role !== "admin") {
      return showError("⛔ Solo administradores pueden acceder.", errorEl);
    }

    localStorage.setItem("token", data.token);
    window.location.href = "panel.html";

  } catch (err) {
    console.error("❌ Error al conectar:", err);
    showError("❌ Error de red. Intenta más tarde.", errorEl);
  } finally {
    toggleButtonState(button, false, "Entrar");
  }
}

/**
 * ❌ Muestra mensaje de error accesible
 */
function showError(msg, el) {
  if (!el) return;
  el.textContent = msg;
  el.classList.remove("oculto");
  el.setAttribute("role", "alert");
  el.setAttribute("aria-live", "assertive");
  el.focus?.();
}

/**
 * 🧽 Limpia mensaje de error
 */
function clearError(el) {
  if (!el) return;
  el.textContent = "";
  el.removeAttribute("role");
  el.classList.add("oculto");
}

/**
 * 🔍 Decodifica payload de un JWT
 */
function parseJwt(token) {
  try {
    const base64 = token.split(".")[1];
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

/**
 * 🧠 Controla estado de botón
 */
function toggleButtonState(btn, disable, text) {
  if (!btn) return;
  btn.disabled = disable;
  btn.textContent = text;
}

/**
 * 🚪 Cierra sesión
 */
function logout() {
  localStorage.removeItem("token");
  window.location.href = "login.html";
}
