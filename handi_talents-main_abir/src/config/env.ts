import dotenv from "dotenv";

dotenv.config();

const obtenirVariable = (cle: string, valeurParDefaut?: string): string => {
  const valeur = process.env[cle] ?? valeurParDefaut;

  if (!valeur) {
    throw new Error(`La variable d'environnement ${cle} est requise.`);
  }

  return valeur;
};

export const env = {
  port: Number(process.env.PORT ?? 4000),
  nodeEnv: process.env.NODE_ENV ?? "development",
  databaseUrl: obtenirVariable("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/handitalents"),
  jwtSecret: obtenirVariable("JWT_SECRET", "votre_secret_jwt"),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "1d",
  frontendUrl: process.env.FRONTEND_URL ?? "http://localhost:3000",
  emailFrom: process.env.EMAIL_FROM ?? "no-reply@handitalents.com",
  smtpHost: process.env.SMTP_HOST,
  smtpPort: Number(process.env.SMTP_PORT ?? 587),
  smtpSecure: process.env.SMTP_SECURE === "true",
  smtpUser: process.env.SMTP_USER,
  smtpPass: process.env.SMTP_PASS,
  smsFrom: process.env.SMS_FROM ?? "",
  twilioSid: process.env.TWILIO_SID ?? "",
  twilioToken: process.env.TWILIO_TOKEN ?? "",
  iaApiUrl: process.env.IA_API_URL ?? "http://localhost:8000",
  iaShortlistMinScore: Number(process.env.IA_SHORTLIST_MIN_SCORE ?? 50),
  iaShortlistRequired: process.env.IA_SHORTLIST_REQUIRED === "true",
};
