import cors from "cors";
import "dotenv/config";
import express from "express";
import avisEntrepriseRoutes from "./routes/avis-entreprise.routes";
import { enterpriseReportingRoutes } from "./routes/enterprise-reporting.routes";
import { supervisionRoutes } from "./routes/supervision.routes";
import { gestionErreursMiddleware } from "./middleware/gestion-erreurs.middleware";

const port = Number(process.env.PORT || 4106);
const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";

const app = express();

app.use(
  cors({
    origin: [frontendUrl, "http://localhost:3000", "http://127.0.0.1:3000"],
    credentials: true,
  }),
);
app.use(express.json({ limit: "10mb" }));

app.get("/health", (_req, res) => {
  res.json({
    service: "reporting-service",
    status: "ok",
    routes: ["supervision", "enterprise-reports", "company-reviews"],
  });
});

app.use("/api/supervision", supervisionRoutes);
app.use("/api/entreprise/reports-requests", enterpriseReportingRoutes);
app.use("/api/avis-entreprises", avisEntrepriseRoutes);
app.use(gestionErreursMiddleware);

app.listen(port, () => {
  console.log(`[reporting-service] listening on ${port}`);
});
