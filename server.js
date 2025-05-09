// 📁 frontend/server.js
import express from "express";
import path from "path";
import helmet from "helmet";
import cors from "cors";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// 🛡️ Seguridad con helmet (desactiva CSP solo si usas inline styles/scripts)
app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);

// 🌐 CORS (ajusta el origin a tu dominio real de frontend si usas cookies/sesión)
app.use(
  cors({
    origin: "https://kmezropacatalogo.com", // ⚠️ Reemplaza con tu dominio real
    credentials: true,
  })
);

// 🔐 Forzar HTTPS en producción
if (process.env.NODE_ENV === "production") {
  app.use((req, res, next) => {
    if (req.headers["x-forwarded-proto"] !== "https") {
      return res.redirect("https://" + req.headers.host + req.url);
    }
    next();
  });
}

// ✅ Servir archivos estáticos con cache
app.use("/assets", express.static(path.join(__dirname, "assets"), { maxAge: "30d" }));
app.use("/css", express.static(path.join(__dirname, "css"), { maxAge: "30d" }));
app.use("/js", express.static(path.join(__dirname, "js"), { maxAge: "30d" }));

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
  if (["sitemap", "robots", "cliente"].includes(page)) return next();
  const filePath = path.join(__dirname, "views", `${page}.html`);
  res.sendFile(filePath, (err) => {
    if (err) res.status(404).send("❌ Página no encontrada");
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
