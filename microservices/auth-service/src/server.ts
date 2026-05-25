import cors from "cors";
import "dotenv/config";
import express from "express";
import path from "path";
import { authRoutes } from "./routes/auth.routes";
import { gestionErreursMiddleware } from "./middleware/gestion-erreurs.middleware";

const port = Number(process.env.PORT || 4101);
const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";

const app = express();

app.use(
  cors({
    origin: [frontendUrl, "http://localhost:3000", "http://127.0.0.1:3000"],
    credentials: true,
  }),
);
app.use(express.json({ limit: "2mb" }));
app.use("/uploads", express.static(path.join(__dirname, "..", "public", "uploads")));

app.get("/health", (_req, res) => {
  res.json({
    service: "auth-service",
    status: "ok",
    extracted: true,
  });
});

app.use("/api/auth", authRoutes);
app.use(gestionErreursMiddleware);

app.listen(port, () => {
  console.log(`[auth-service] listening on ${port}`);
});
