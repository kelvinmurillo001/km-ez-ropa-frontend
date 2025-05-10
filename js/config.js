const hostname = (window?.location?.hostname || "").toLowerCase();
const isLocalhost = hostname.includes("localhost") || hostname.includes("127.0.0.1");

export const FRONTEND_DOMAIN = window.location.origin;

export const API_BASE = isLocalhost
  ? "http://localhost:5000"
  : "https://api.kmezropacatalogo.com"; // ✅ producción

export const GOOGLE_LOGIN_URL = `${API_BASE}/auth/google`;
