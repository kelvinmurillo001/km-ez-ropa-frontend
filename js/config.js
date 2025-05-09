const hostname = window?.location?.hostname;

export const API_BASE =
  hostname.includes("localhost") || hostname.includes("127.0.0.1")
    ? "http://localhost:5000"
    : "https://api.kmezropacatalogo.com"; // ✅ apunta al backend real

export const GOOGLE_LOGIN_URL = `${API_BASE}/auth/google`; // ✅ correcto
