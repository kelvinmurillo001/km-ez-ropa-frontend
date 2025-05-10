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

// 🌐 CORS (ajustado al dominio real del frontend)
app.use(cors({
  origin: "https://kmezropacatalogo.com",
  credentials: true,
}));

// 🛡️ Helmet (cabeceras de seguridad base)
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "same-origin" }));
app.use(helmet.frameguard({ action: "deny" }));
app.use(helmet.noSniff());
app.use(helmet.referrerPolicy({ policy: "strict-origin-when-cross-origin" }));

// ✅ CSP mejorada con soporte para Kaspersky y GA
app.use((req, res, next) => {
  res.setHeader("Content-Security-Policy",
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' https://accounts.google.com https://apis.google.com https://www.googletagmanager.com https://www.google-analytics.com https://gc.kis.v2.scr.kaspersky-labs.com; " +
    "style-src 'self' 'unsafe-inline' https://gc.kis.v2.scr.kaspersky-labs.com; " +
    "img-src 'self' data: https://*.googleusercontent.com https://lh3.googleusercontent.com https://developers.google.com https://gc.kis.v2.scr.kaspersky-labs.com; " +
    "connect-src 'self' https://api.kmezropacatalogo.com https://www.google-analytics.com; " +
    "font-src 'self' https://fonts.googleapis.com https://fonts.gstatic.com; " +
    "frame-src https://accounts.google.com https://*.google.com; " +
    "object-src 'none'; base-uri 'self'; frame-ancestors 'none';"
  );
  next();
});

// 🔐 Redirección HTTPS en producción
if (process.env.NODE_ENV === "production") {
  app.use((req, res, next) => {
    if (req.headers["x-forwarded-proto"] !== "https") {
      return res.redirect("https://" + req.headers.host + req.url);
    }
    next();
  });
}

// ✅ Archivos estáticos con caché optimizada
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

// ✅ Ruta para cliente autenticado
app.get("/cliente", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "cliente.html"));
});

// 📄 Rutas *.html (excepto especiales)
app.get("/:page.html", (req, res, next) => {
  const { page } = req.params;
  const exclusions = ["sitemap", "robots", "cliente"];
  if (exclusions.includes(page)) return next();

  const filePath = path.join(__dirname, "views", `${page}.html`);
  res.sendFile(filePath, (err) => {
    if (err) res.status(404).send("❌ Página no encontrada");
  });
});

// 🧹 Catch-all
app.use((req, res) => {
  res.status(404).send("❌ Ruta no encontrada en el frontend");
});

// 🚀 Iniciar servidor
app.listen(PORT, () => {
  console.log(`🌐 Frontend en ejecución: http://localhost:${PORT}`);
  console.log(`📁 Base de archivos: ${__dirname}`);
});
