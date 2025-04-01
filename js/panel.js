// ✅ Protección de acceso
document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("⚠️ Acceso no autorizado. Por favor, inicia sesión.");
      window.location.href = "login.html";
    }
  });
  
  // 🔒 Cerrar sesión
  function logout() {
    localStorage.removeItem("token");
    window.location.href = "login.html";
  }
  