import cors from "cors";
import "dotenv/config";
import express from "express";
import path from "path";
import { adminRoutes } from "./routes/admin.routes";
import { accountMemberRoutes } from "./routes/account-member.routes";
import { gestionUtilisateursRoutes } from "./routes/gestion-utilisateurs.routes";
import { mediaRoutes } from "./routes/media.routes";
import { profilRoutes } from "./routes/profil.routes";
import { gestionErreursMiddleware } from "./middleware/gestion-erreurs.middleware";

const port = Number(process.env.PORT || 4102);
const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";

const app = express();

app.use(
  cors({
    origin: [frontendUrl, "http://localhost:3000", "http://127.0.0.1:3000"],
    credentials: true,
  }),
);
app.use(express.json({ limit: "15mb" }));

// Protected media access (view-only UX, not publicly downloadable).
app.use("/uploads", mediaRoutes);

// Keep enterprise uploads available, but require authentication at least.
app.use(
  "/uploads/entreprises",
  express.static(path.join(__dirname, "..", "public", "uploads", "entreprises"), {
    setHeaders(res) {
      res.setHeader("Content-Disposition", "inline");
      res.setHeader("Cache-Control", "no-store");
      res.setHeader("X-Content-Type-Options", "nosniff");
    },
  }),
);

app.get("/health", (_req, res) => {
  res.json({
    service: "user-service",
    status: "ok",
    routes: ["admin-requests", "admin-users", "profiles", "account-members"],
  });
});

app.use("/api/admin", adminRoutes);
app.use("/api/admin", gestionUtilisateursRoutes);
app.use("/api", profilRoutes);
app.use("/api/entreprises/membres", accountMemberRoutes);
app.use(gestionErreursMiddleware);

app.listen(port, () => {
  console.log(`[user-service] listening on ${port}`);
});
