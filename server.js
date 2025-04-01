const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Servir archivos estáticos
app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/js', express.static(path.join(__dirname, 'js')));
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// Servir vistas (HTML)
app.use(express.static(path.join(__dirname, 'views')));

// Redireccionar a index.html si ruta no existe
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'views/index.html'));
});

app.listen(PORT, () => {
  console.log(`🌐 Frontend servido en http://localhost:${PORT}`);
});
