const express = require('express'); 
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// ✅ Servir archivos estáticos como /css, /js, /assets
app.use(express.static(__dirname));

// 🗺️ sitemap.xml
app.get('/sitemap.xml', (req, res) => {
  res.sendFile(path.join(__dirname, 'sitemap.xml'));
});

// 🤖 robots.txt
app.get('/robots.txt', (req, res) => {
  res.sendFile(path.join(__dirname, 'robots.txt'));
});

// ✅ Página principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// ✅ Rutas como /login.html, /carrito.html, /admin.html
app.get('/:page.html', (req, res) => {
  const requestedPage = req.params.page;
  const filePath = path.join(__dirname, 'views', `${requestedPage}.html`);
  
  res.sendFile(filePath, (err) => {
    if (err) {
      res.status(404).send("❌ Página no encontrada");
    }
  });
});

app.listen(PORT, () => {
  console.log(`🌐 Frontend servido en http://localhost:${PORT}`);
});
