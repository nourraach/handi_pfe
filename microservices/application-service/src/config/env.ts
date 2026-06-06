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
  cleInterneBienEtre: process.env.INTERNAL_WELLBEING_KEY ?? "cle-dev-bien-etre",
  claudeApiKey: process.env.CLAUDE_API_KEY ?? process.env.ANTHROPIC_API_KEY ?? "",
  claudeModel: process.env.CLAUDE_MODEL ?? "claude-3-5-haiku-latest",
  geminiApiKey: process.env.GEMINI_API_KEY ?? "",
  geminiInterviewModel: process.env.GEMINI_INTERVIEW_MODEL ?? "gemini-2.5-flash",
  interviewPrepTimeoutMs: Number(process.env.INTERVIEW_PREP_GENERATION_TIMEOUT_MS ?? 30000),
  interviewPrepCacheTtlDays: Number(process.env.INTERVIEW_PREP_CACHE_TTL_DAYS ?? 30),
  aiServiceUrls: (process.env.AI_SERVICE_URLS ?? "http://host.docker.internal:8000,http://localhost:8000")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean),
  aiShortlistMinScore: Number(process.env.AI_SHORTLIST_MIN_SCORE ?? 60),
  aiRequestTimeoutMs: Number(process.env.AI_REQUEST_TIMEOUT_MS ?? 30000),
};
