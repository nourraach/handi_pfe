import cors from "cors";
import "dotenv/config";
import express from "express";
import chatRoutes from "./routes/chat.routes";
import { gestionErreursMiddleware } from "./middleware/gestion-erreurs.middleware";

const port = Number(process.env.PORT || 4109);
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
    service: "communication-service",
    status: "ok",
    routes: ["chat"],
  });
});

app.use("/api/chat", chatRoutes);
app.use(gestionErreursMiddleware);

app.listen(port, () => {
  console.log(`[communication-service] listening on ${port}`);
});
