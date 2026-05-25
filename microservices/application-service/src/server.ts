import cors from "cors";
import "dotenv/config";
import express from "express";
import path from "path";
import adminCandidatureRoutes from "./routes/admin-candidature.routes";
import candidatureRoutes from "./routes/candidature.routes";
import entrepriseCandidatsRoutes from "./routes/entreprise-candidats.routes";
import { entrepriseCandidatureExportRoutes } from "./routes/entreprise-candidature-export.routes";
import { gestionErreursMiddleware } from "./middleware/gestion-erreurs.middleware";

const port = Number(process.env.PORT || 4104);
const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";

const app = express();

app.use(
  cors({
    origin: [frontendUrl, "http://localhost:3000", "http://127.0.0.1:3000"],
    credentials: true,
  }),
);
app.use(express.json({ limit: "15mb" }));
app.use("/uploads", express.static(path.join(__dirname, "..", "public", "uploads")));

app.get("/health", (_req, res) => {
  res.json({
    service: "application-service",
    status: "ok",
    routes: ["applications", "enterprise-applications", "admin-applications", "candidate-search"],
  });
});

app.use("/api/candidatures", candidatureRoutes);
app.use("/api/entreprise/candidatures", candidatureRoutes);
app.use("/api/entreprise/candidatures/export", entrepriseCandidatureExportRoutes);
app.use("/api/entreprise/candidats", entrepriseCandidatsRoutes);
app.use("/api/admin", adminCandidatureRoutes);
app.use(gestionErreursMiddleware);

app.listen(port, () => {
  console.log(`[application-service] listening on ${port}`);
});
