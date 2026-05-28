import cors from "cors";
import "dotenv/config";
import express, { NextFunction, Request, Response } from "express";
import { createProxyMiddleware } from "http-proxy-middleware";

const port = Number(process.env.PORT || 4000);
const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
const authServiceEnabled = process.env.AUTH_SERVICE_ENABLED === "true";
const userServiceEnabled = process.env.USER_SERVICE_ENABLED === "true";
const jobServiceEnabled = process.env.JOB_SERVICE_ENABLED === "true";
const applicationServiceEnabled = process.env.APPLICATION_SERVICE_ENABLED === "true";
const interviewServiceEnabled = process.env.INTERVIEW_SERVICE_ENABLED === "true";
const reportingServiceEnabled = process.env.REPORTING_SERVICE_ENABLED === "true";
const notificationServiceEnabled = process.env.NOTIFICATION_SERVICE_ENABLED === "true";
const assessmentServiceEnabled = process.env.ASSESSMENT_SERVICE_ENABLED === "true";
const communicationServiceEnabled = process.env.COMMUNICATION_SERVICE_ENABLED === "true";
const authServiceUrl = process.env.AUTH_SERVICE_URL || "http://localhost:4101";
const userServiceUrl = process.env.USER_SERVICE_URL || "http://localhost:4102";
const jobServiceUrl = process.env.JOB_SERVICE_URL || "http://localhost:4103";
const applicationServiceUrl = process.env.APPLICATION_SERVICE_URL || "http://localhost:4104";
const interviewServiceUrl = process.env.INTERVIEW_SERVICE_URL || "http://localhost:4105";
const reportingServiceUrl = process.env.REPORTING_SERVICE_URL || "http://localhost:4106";
const notificationServiceUrl = process.env.NOTIFICATION_SERVICE_URL || "http://localhost:4107";
const assessmentServiceUrl = process.env.ASSESSMENT_SERVICE_URL || "http://localhost:4108";
const communicationServiceUrl = process.env.COMMUNICATION_SERVICE_URL || "http://localhost:4109";

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
  "/api/offres/publiques",
  "/api/offres-emploi",
  "/api/entreprise/offres",
  "/api/admin/offres/publication",
  "/api/favoris",
  "/api/recommandations",
];
const applicationServicePrefixes = [
  "/api/candidatures",
  "/api/entreprise/candidatures",
  "/api/entreprise/candidats",
  "/api/admin/candidatures",
  "/api/admin/workflow-recrutement",
  "/api/admin/detection-abus",
];
const interviewServicePrefixes = [
  "/api/entretiens",
  "/api/admin/entretiens",
  "/api/tests-entretien",
  "/api/interne/bien-etre",
];
const reportingServicePrefixes = [
  "/api/supervision",
  "/api/entreprise/reports-requests",
  "/api/avis-entreprises",
];
const notificationServicePrefixes = ["/api/notifications"];
const assessmentServicePrefixes = ["/api/tests-psychologiques"];
const communicationServicePrefixes = ["/api/chat"];

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
      auth: authServiceEnabled ? authServiceUrl : "disabled",
      user: userServiceEnabled ? userServiceUrl : "disabled",
      job: jobServiceEnabled ? jobServiceUrl : "disabled",
      application: applicationServiceEnabled ? applicationServiceUrl : "disabled",
      interview: interviewServiceEnabled ? interviewServiceUrl : "disabled",
      reporting: reportingServiceEnabled ? reportingServiceUrl : "disabled",
      notification: notificationServiceEnabled ? notificationServiceUrl : "disabled",
      assessment: assessmentServiceEnabled ? assessmentServiceUrl : "disabled",
      communication: communicationServiceEnabled ? communicationServiceUrl : "disabled",
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

const applicationProxy = createProxyMiddleware({
  target: applicationServiceUrl,
  changeOrigin: true,
});

const interviewProxy = createProxyMiddleware({
  target: interviewServiceUrl,
  changeOrigin: true,
});

const reportingProxy = createProxyMiddleware({
  target: reportingServiceUrl,
  changeOrigin: true,
});

const notificationProxy = createProxyMiddleware({
  target: notificationServiceUrl,
  changeOrigin: true,
});

const assessmentProxy = createProxyMiddleware({
  target: assessmentServiceUrl,
  changeOrigin: true,
});

const communicationProxy = createProxyMiddleware({
  target: communicationServiceUrl,
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

  if (applicationServiceEnabled && applicationServicePrefixes.some((prefix) => req.path.startsWith(prefix))) {
    return applicationProxy(req, res, next);
  }

  if (interviewServiceEnabled && interviewServicePrefixes.some((prefix) => req.path.startsWith(prefix))) {
    return interviewProxy(req, res, next);
  }

  if (reportingServiceEnabled && reportingServicePrefixes.some((prefix) => req.path.startsWith(prefix))) {
    return reportingProxy(req, res, next);
  }

  if (notificationServiceEnabled && notificationServicePrefixes.some((prefix) => req.path.startsWith(prefix))) {
    return notificationProxy(req, res, next);
  }

  if (assessmentServiceEnabled && assessmentServicePrefixes.some((prefix) => req.path.startsWith(prefix))) {
    return assessmentProxy(req, res, next);
  }

  if (communicationServiceEnabled && communicationServicePrefixes.some((prefix) => req.path.startsWith(prefix))) {
    return communicationProxy(req, res, next);
  }

  return next();
});

app.use((req: Request, res: Response, next: NextFunction) => {
  if (req.path.startsWith("/api")) {
    return res.status(404).json({
      message: "Route API non prise en charge par le gateway",
      path: req.path,
    });
  }

  return next();
});

app.listen(port, () => {
  console.log(`[api-gateway] listening on ${port}`);
});
