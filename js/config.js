// 🌐 Detectar entorno actual
const hostname = (window?.location?.hostname || "").toLowerCase();
const isLocalhost = hostname.includes("localhost") || hostname.includes("127.0.0.1");

// 🌍 Dominio del frontend (uso general)
export const FRONTEND_DOMAIN = window.location.origin;

// 🔗 Base URL de la API según entorno
export const API_BASE = isLocalhost
  ? "http://localhost:5000"               // 🧪 Local dev
  : "https://api.kmezropacatalogo.com";   // ✅ Producción

// 🔐 URL de login con Google
export const GOOGLE_LOGIN_URL = `${API_BASE}/auth/google`;
