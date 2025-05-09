// 📁 frontend/server.js
import express from "express";
import path from "path";
import helmet from "helmet";
import { fileURLToPath } from "url";

// 📍 Setup para __dirname con ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// 🛡️ Encabezados de seguridad
app.use(
  helmet({
    contentSecurityPolicy: false, // ⚠️ Desactivado para permitir inline scripts/styles si los usas
  })
);

// ✅ Servir solo carpetas necesarias
app.use("/assets", express.static(path.join(__dirname, "assets")));
app.use("/css", express.static(path.join(__dirname, "css")));
app.use("/js", express.static(path.join(__dirname, "js")));

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
app.get("/:page.html", (req, res, next) => {
  const { page } = req.params;

  // Evita conflictos con rutas conocidas
  if (["sitemap", "robots", "cliente"].includes(page)) return next();

  const filePath = path.join(__dirname, "views", `${page}.html`);
  res.sendFile(filePath, (err) => {
    if (err) {
      res.status(404).send("❌ Página no encontrada");
    }
  });
});

// 🧹 Catch-all para rutas no definidas
app.use((req, res) => {
  res.status(404).send("❌ Ruta no encontrada en el frontend");
});

// 🚀 Iniciar servidor
app.listen(PORT, () => {
  console.log(`🌐 Frontend en ejecución: http://localhost:${PORT}`);
  console.log(`📁 Base de archivos: ${__dirname}`);
});
