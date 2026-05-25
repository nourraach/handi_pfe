import cors from "cors";
import "dotenv/config";
import express from "express";
import { testPsychologiqueRoutes } from "./routes/test-psychologique.routes";
import { gestionErreursMiddleware } from "./middleware/gestion-erreurs.middleware";

const port = Number(process.env.PORT || 4108);
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
    service: "assessment-service",
    status: "ok",
    routes: ["psychological-tests"],
  });
});

app.use("/api/tests-psychologiques", testPsychologiqueRoutes);
app.use(gestionErreursMiddleware);

app.listen(port, () => {
  console.log(`[assessment-service] listening on ${port}`);
});
