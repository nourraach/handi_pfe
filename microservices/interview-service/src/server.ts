import cors from "cors";
import "dotenv/config";
import express from "express";
import adminEntretienRoutes from "./routes/admin-entretien.routes";
import bienEtreInterneRoutes from "./routes/bien-etre-interne.routes";
import entretienRoutes from "./routes/entretien.routes";
import testEntretienRoutes from "./routes/test-entretien.routes";
import { gestionErreursMiddleware } from "./middleware/gestion-erreurs.middleware";

const port = Number(process.env.PORT || 4105);
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
    service: "interview-service",
    status: "ok",
    routes: ["interviews", "admin-interviews", "interview-tests", "wellbeing"],
  });
});

app.use("/api/entretiens", entretienRoutes);
app.use("/api/admin", adminEntretienRoutes);
app.use("/api/tests-entretien", testEntretienRoutes);
app.use("/api/interne/bien-etre", bienEtreInterneRoutes);
app.use(gestionErreursMiddleware);

app.listen(port, () => {
  console.log(`[interview-service] listening on ${port}`);
});
