// 🌐 Detectar entorno actual
const hostname = (window?.location?.hostname || "").toLowerCase();
export const IS_LOCALHOST = hostname.includes("localhost") || hostname.includes("127.0.0.1");

// 🌍 Dominio del frontend
export const FRONTEND_DOMAIN = window.location.origin;

// 🔗 Base URL de la API
export const API_BASE = IS_LOCALHOST
  ? "http://localhost:5000"               // 🧪 Desarrollo local
  : "https://api.kmezropacatalogo.com";  // ✅ Producción real

// 🔐 URL para iniciar sesión con Google
export const GOOGLE_LOGIN_URL = `${API_BASE}/auth/google`;

// 📦 Claves estándar para almacenamiento local
export const STORAGE_KEYS = {
  token: "admin_token",
  user: "admin_user"
};

// ⏱️ Tiempo estándar de expiración de sesión (en minutos)
export const SESSION_TIMEOUT_MIN = 60;
