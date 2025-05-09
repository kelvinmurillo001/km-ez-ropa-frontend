// 📁 frontend/server.js
import express from "express";
import path from "path";
import { fileURLToPath } from "url";

// 📍 Setup para __dirname con ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ Servir archivos estáticos
app.use(express.static(__dirname));

// 🌐 sitemap.xml
app.get("/sitemap.xml", (req, res) => {
  res.sendFile(path.join(__dirname, "sitemap.xml"));
});

// 🤖 robots.txt
app.get("/robots.txt", (req, res) => {
  res.sendFile(path.join(__dirname, "robots.txt"));
});

// 🏠 Página principal
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "index.html"));
});

// ✅ Ruta explícita para usuarios autenticados (evita 404 post-login con Google)
app.get("/cliente", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "cliente.html"));
});

// 📄 Otras páginas *.html
app.get("/:page.html", (req, res) => {
  const { page } = req.params;
  const filePath = path.join(__dirname, "views", `${page}.html`);

  res.sendFile(filePath, (err) => {
    if (err) {
      res.status(404).send("❌ Página no encontrada");
    }
  });
});

// 🚀 Iniciar servidor
app.listen(PORT, () => {
  console.log(`🌐 Frontend en ejecución: http://localhost:${PORT}`);
});
