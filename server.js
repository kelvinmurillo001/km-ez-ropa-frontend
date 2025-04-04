const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// ✅ Sirve todos los archivos estáticos desde la raíz del proyecto
app.use(express.static(__dirname));

// ✅ Redirecciona todas las rutas desconocidas a index.html (SPA fallback)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🌐 Frontend servido en http://localhost:${PORT}`);
});
