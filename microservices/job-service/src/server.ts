import cors from "cors";
import "dotenv/config";
import express, { Router } from "express";
import adminOffrePublicationRoutes from "./routes/admin-offre-publication.routes";
import entrepriseOffresRoutes from "./routes/offre-emploi.routes";
import favorisRoutes from "./routes/favoris.routes";
import offreEmploiRoutes from "./routes/offre-emploi-simple.routes";
import { OffreEmploiSimpleController } from "./controllers/offre-emploi-simple.controller";
import recommendationRoutes from "./routes/recommendation.routes";
import { gestionErreursMiddleware } from "./middleware/gestion-erreurs.middleware";

const port = Number(process.env.PORT || 4103);
const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";

const app = express();
const offrePubliqueController = new OffreEmploiSimpleController();
const offresPubliquesRoutes = Router();

app.use(
  cors({
    origin: [frontendUrl, "http://localhost:3000", "http://127.0.0.1:3000"],
    credentials: true,
  }),
);
app.use(express.json({ limit: "10mb" }));

app.get("/health", (_req, res) => {
  res.json({
    service: "job-service",
    status: "ok",
    routes: ["offers", "enterprise-offers", "offer-publication", "favorites", "recommendations"],
  });
});

offresPubliquesRoutes.get("/", offrePubliqueController.obtenirOffresPubliques);
offresPubliquesRoutes.get("/:id", offrePubliqueController.obtenirOffreParId);

app.use("/api/offres/publiques", offresPubliquesRoutes);
app.use("/api/offres-emploi", offreEmploiRoutes);
app.use("/api/entreprise/offres", entrepriseOffresRoutes);
app.use("/api/admin", adminOffrePublicationRoutes);
app.use("/api/favoris", favorisRoutes);
app.use("/api/recommandations", recommendationRoutes);
app.use(gestionErreursMiddleware);

app.listen(port, () => {
  console.log(`[job-service] listening on ${port}`);
});
