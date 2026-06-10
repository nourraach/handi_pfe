import { NextResponse } from "next/server";

const OLLAMA_URL = "http://localhost:11434/api/generate";
const OLLAMA_MODEL = "llama3.2:3b";
const MAX_INPUT_CHARS = 12000;

type JobSummaryRequest = {
  jobOffer?: unknown;
};

type OllamaGenerateResponse = {
  response?: string;
  error?: string;
};

function detectLanguage(input: string): "fr" | "en" | "ar" {
  if (/[\u0600-\u06FF]/.test(input)) {
    return "ar";
  }

  const lower = input.toLowerCase();
  const frenchHints = [" le ", " la ", " les ", " des ", " pour ", " avec ", " entreprise ", " poste ", " offre "];
  const englishHints = [" the ", " and ", " with ", " required ", " responsibilities ", " job ", " company "];

  const frScore = frenchHints.reduce((score, hint) => score + (lower.includes(hint) ? 1 : 0), 0);
  const enScore = englishHints.reduce((score, hint) => score + (lower.includes(hint) ? 1 : 0), 0);

  if (frScore >= enScore) {
    return "fr";
  }

  return "en";
}

function normalizeWhitespace(input: string) {
  return input.replace(/\r\n/g, "\n").replace(/\r/g, "\n").replace(/[ \t]+/g, " ").trim();
}

function truncateJobOfferSafely(input: string, maxChars: number) {
  if (input.length <= maxChars) {
    return input;
  }

  const normalized = normalizeWhitespace(input);
  if (normalized.length <= maxChars) {
    return normalized;
  }

  const headSize = Math.floor(maxChars * 0.75);
  const tailSize = maxChars - headSize - 40;
  const head = normalized.slice(0, headSize);
  const tail = normalized.slice(Math.max(headSize, normalized.length - tailSize));

  const headCut = head.lastIndexOf("\n") > headSize * 0.6 ? head.lastIndexOf("\n") : head.lastIndexOf(". ");
  const safeHead = headCut > 0 ? head.slice(0, headCut + 1).trim() : head.trim();

  return `${safeHead}\n\n[...truncated for processing...]\n\n${tail.trim()}`;
}

function buildSystemPrompt(language: "fr" | "en" | "ar") {
  if (language === "ar") {
    return [
      "You are an accessibility assistant for HandiTalents.",
      "Help candidates with disabilities understand job offers.",
      "Respond in Arabic only.",
      "Use simple language and short sentences.",
      "Do not invent missing information.",
      "If information is missing, write: غير مذكور.",
      "Do not give medical advice.",
      "Do not judge the candidate disability.",
      "Use this format exactly:",
      "1. ملخص بسيط",
      "2. المسؤوليات الرئيسية",
      "3. المهارات المطلوبة",
      "4. الخبرة المطلوبة",
      "5. الموقع ونوع العقد",
      "6. التسهيلات أو الترتيبات المذكورة",
      "7. نقاط مهمة قبل التقديم",
    ].join("\n");
  }

  if (language === "en") {
    return [
      "You are an accessibility assistant for HandiTalents.",
      "Help candidates with disabilities understand job offers.",
      "Respond in English only.",
      "Use simple language and short sentences.",
      "Do not invent missing information.",
      "If information is missing, write: Not specified.",
      "Do not give medical advice.",
      "Do not judge the candidate disability.",
      "Use this format exactly:",
      "1. Simple summary",
      "2. Main responsibilities",
      "3. Required skills",
      "4. Required experience",
      "5. Location and contract type",
      "6. Accessibility or accommodations mentioned",
      "7. Important points before applying",
    ].join("\n");
  }

  return [
    "You are an accessibility assistant for HandiTalents.",
    "Help candidates with disabilities understand job offers.",
    "Respond in French only.",
    "Use simple language and short sentences.",
    "Do not invent missing information.",
    "If information is missing, write: Non précisé.",
    "Do not give medical advice.",
    "Do not judge the candidate disability.",
    "Use this format exactly:",
    "1. Résumé simple",
    "2. Responsabilités principales",
    "3. Compétences requises",
    "4. Expérience requise",
    "5. Lieu et type de contrat",
    "6. Accessibilité ou aménagements mentionnés",
    "7. Points importants avant de postuler",
  ].join("\n");
}

export async function POST(request: Request) {
  let body: JobSummaryRequest;
  try {
    body = (await request.json()) as JobSummaryRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const rawOffer = typeof body.jobOffer === "string" ? body.jobOffer : "";
  const normalizedOffer = normalizeWhitespace(rawOffer);

  if (!normalizedOffer) {
    return NextResponse.json({ error: "jobOffer is required." }, { status: 400 });
  }

  const language = detectLanguage(normalizedOffer);
  const truncatedOffer = truncateJobOfferSafely(normalizedOffer, MAX_INPUT_CHARS);
  const systemPrompt = buildSystemPrompt(language);
  const prompt = `${systemPrompt}\n\nJob offer:\n${truncatedOffer}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 45000);

  try {
    const ollamaResponse = await fetch(OLLAMA_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt,
        stream: false,
        options: {
          temperature: 0.2,
        },
      }),
      signal: controller.signal,
      cache: "no-store",
    });

    if (!ollamaResponse.ok) {
      const errorText = await ollamaResponse.text();
      return NextResponse.json(
        { error: "Ollama request failed.", details: errorText.slice(0, 500) },
        { status: 502 },
      );
    }

    const payload = (await ollamaResponse.json()) as OllamaGenerateResponse;
    const summary = typeof payload.response === "string" ? payload.response.trim() : "";

    if (!summary) {
      return NextResponse.json({ error: "Empty response from Ollama." }, { status: 502 });
    }

    return NextResponse.json({
      summary,
      language,
      truncated: normalizedOffer.length > truncatedOffer.length,
    });
  } catch (error) {
    const isAbort = error instanceof Error && error.name === "AbortError";
    return NextResponse.json(
      {
        error: isAbort ? "Ollama request timed out." : "Unable to reach Ollama.",
      },
      { status: 502 },
    );
  } finally {
    clearTimeout(timeoutId);
  }
}
