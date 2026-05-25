import cors from "cors";
import "dotenv/config";
import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";

const port = Number(process.env.PORT || 4000);
const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
const authServiceEnabled = process.env.AUTH_SERVICE_ENABLED === "true";
const authServiceUrl = process.env.AUTH_SERVICE_URL || "http://localhost:4101";
const coreServiceUrl = process.env.CORE_SERVICE_URL || "http://localhost:5000";

const app = express();

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
      core: coreServiceUrl,
    },
  });
});

if (authServiceEnabled) {
  app.use(
    "/api/auth",
    createProxyMiddleware({
      target: authServiceUrl,
      changeOrigin: true,
      pathRewrite: { "^/api/auth": "/api/auth" },
    }),
  );
}

app.use(
  "/api",
  createProxyMiddleware({
    target: coreServiceUrl,
    changeOrigin: true,
  }),
);

app.listen(port, () => {
  console.log(`[api-gateway] listening on ${port}`);
});
