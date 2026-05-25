import cors from "cors";
import "dotenv/config";
import express, { NextFunction, Request, Response } from "express";
import { createProxyMiddleware } from "http-proxy-middleware";

const port = Number(process.env.PORT || 4000);
const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
const authServiceEnabled = process.env.AUTH_SERVICE_ENABLED === "true";
const userServiceEnabled = process.env.USER_SERVICE_ENABLED === "true";
const jobServiceEnabled = process.env.JOB_SERVICE_ENABLED === "true";
const authServiceUrl = process.env.AUTH_SERVICE_URL || "http://localhost:4101";
const userServiceUrl = process.env.USER_SERVICE_URL || "http://localhost:4102";
const jobServiceUrl = process.env.JOB_SERVICE_URL || "http://localhost:4103";
const coreServiceUrl = process.env.CORE_SERVICE_URL || "http://localhost:5000";

const app = express();
const userServicePrefixes = [
  "/api/admin/demandes-en-attente",
  "/api/admin/approuver",
  "/api/admin/refuser",
  "/api/admin/utilisateurs",
  "/api/candidats/profil",
  "/api/entreprises/profil",
  "/api/admin/profil",
  "/api/entreprises/membres",
];
const jobServicePrefixes = [
  "/api/offres-emploi",
  "/api/entreprise/offres",
  "/api/admin/offres/publication",
  "/api/favoris",
  "/api/recommandations",
];

app.use(
  cors({
    origin: [frontendUrl, "http://localhost:3000", "http://127.0.0.1:3000"],
    credentials: true,
  }),
);

app.get("/health", (_req, res) => {
  res.json({
    service: "api-gateway",
    status: "ok",
    routes: {
      auth: authServiceEnabled ? authServiceUrl : coreServiceUrl,
      user: userServiceEnabled ? userServiceUrl : coreServiceUrl,
      job: jobServiceEnabled ? jobServiceUrl : coreServiceUrl,
      core: coreServiceUrl,
    },
  });
});

const authProxy = createProxyMiddleware({
  target: authServiceUrl,
  changeOrigin: true,
});

const userProxy = createProxyMiddleware({
  target: userServiceUrl,
  changeOrigin: true,
});

const jobProxy = createProxyMiddleware({
  target: jobServiceUrl,
  changeOrigin: true,
});

const coreProxy = createProxyMiddleware({
  target: coreServiceUrl,
  changeOrigin: true,
});

app.use((req: Request, res: Response, next: NextFunction) => {
  if (authServiceEnabled && req.path.startsWith("/api/auth")) {
    return authProxy(req, res, next);
  }

  if (userServiceEnabled && userServicePrefixes.some((prefix) => req.path.startsWith(prefix))) {
    return userProxy(req, res, next);
  }

  if (jobServiceEnabled && jobServicePrefixes.some((prefix) => req.path.startsWith(prefix))) {
    return jobProxy(req, res, next);
  }

  return next();
});

app.use((req: Request, res: Response, next: NextFunction) => {
  if (req.path.startsWith("/api")) {
    return coreProxy(req, res, next);
  }

  return next();
});

app.listen(port, () => {
  console.log(`[api-gateway] listening on ${port}`);
});
