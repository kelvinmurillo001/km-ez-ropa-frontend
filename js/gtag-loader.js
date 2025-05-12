// 📁 frontend/js/gtag-loader.js

window.dataLayer = window.dataLayer || [];
function gtag() {
  dataLayer.push(arguments);
}

// 🕐 Inicialización
gtag('js', new Date());

// 🧭 Configuración GA4 (ajusta el ID si es necesario)
gtag('config', 'G-BNWNNFDCC3', {
  anonymize_ip: true,
  send_page_view: true
});
