// 📁 frontend/js/modoOscuro.js
document.addEventListener("DOMContentLoaded", () => {
  const botonesModoOscuro = document.querySelectorAll("#modoOscuroBtn");
  const esOscuro = localStorage.getItem("modoOscuro") === "true";

  if (esOscuro) {
    document.body.classList.add("modo-oscuro");
    document.documentElement.classList.add("modo-oscuro"); // opcional
  }

  if (botonesModoOscuro.length) {
    botonesModoOscuro.forEach((btn) => {
      btn.addEventListener("click", () => {
        const modoActivo = document.body.classList.toggle("modo-oscuro");
        document.documentElement.classList.toggle("modo-oscuro"); // opcional
        localStorage.setItem("modoOscuro", modoActivo);
      });
    });
  }
});
