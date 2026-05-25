import cors from "cors";
import "dotenv/config";
import express from "express";
import notificationRoutes from "./routes/notification.routes";
import { gestionErreursMiddleware } from "./middleware/gestion-erreurs.middleware";

const port = Number(process.env.PORT || 4107);
const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";

const app = express();

app.use(
  cors({
    origin: [frontendUrl, "http://localhost:3000", "http://127.0.0.1:3000"],
    credentials: true,
  }),
);
app.use(express.json({ limit: "2mb" }));

app.get("/health", (_req, res) => {
  res.json({
    service: "notification-service",
    status: "ok",
    routes: ["notifications"],
  });
});

app.use("/api/notifications", notificationRoutes);
app.use(gestionErreursMiddleware);

app.listen(port, () => {
  console.log(`[notification-service] listening on ${port}`);
});
