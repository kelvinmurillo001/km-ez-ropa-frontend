// 📁 frontend/js/modoOscuro.js
document.addEventListener("DOMContentLoaded", () => {
    const btnModoOscuro = document.getElementById("modoOscuroBtn");
    const esOscuro = localStorage.getItem("modoOscuro") === "true";
  
    if (esOscuro) {
      document.body.classList.add("modo-oscuro");
    }
  
    if (btnModoOscuro) {
      btnModoOscuro.addEventListener("click", () => {
        const modoActivo = document.body.classList.toggle("modo-oscuro");
        localStorage.setItem("modoOscuro", modoActivo);
      });
    }
  });
  