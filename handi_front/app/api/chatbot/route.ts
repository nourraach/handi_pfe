import { NextResponse } from "next/server";

const OLLAMA_URL = "http://localhost:11434/api/generate";
const OLLAMA_MODEL = "llama3.2:3b";
const MAX_MESSAGE_CHARS = 4000;
const MAX_CONTEXT_CHARS = 3000;
const MAX_HISTORY_MESSAGES = 8;

type ChatRole = "user" | "assistant";

type ChatMessage = {
  role?: unknown;
  content?: unknown;
};

type ChatbotRequest = {
  message?: unknown;
  messages?: unknown;
  currentPath?: unknown;
  pageTitle?: unknown;
  pageContext?: unknown;
};

type OllamaGenerateResponse = {
  response?: string;
  error?: string;
};

function normalizeWhitespace(input: string) {
  return input.replace(/\r\n/g, "\n").replace(/\r/g, "\n").replace(/[ \t]+/g, " ").trim();
}

function limitText(input: string, maxChars: number) {
  const normalized = normalizeWhitespace(input);
  if (normalized.length <= maxChars) {
    return normalized;
  }

  return `${normalized.slice(0, maxChars).trim()}…`;
}

function detectLanguage(input: string): "fr" | "en" | "ar" {
  if (/[\u0600-\u06FF]/.test(input)) {
    return "ar";
  }

  const lower = ` ${input.toLowerCase()} `;
  const frenchHints = [" je ", " vous ", " offre ", " emploi ", " bonjour ", " candidat ", " profil "];
  const englishHints = [" the ", " job ", " profile ", " hello ", " application ", " candidate ", " offer "];

  const frScore = frenchHints.reduce((score, hint) => score + (lower.includes(hint) ? 1 : 0), 0);
  const enScore = englishHints.reduce((score, hint) => score + (lower.includes(hint) ? 1 : 0), 0);

  return frScore >= enScore ? "fr" : "en";
}

function isChatRole(value: unknown): value is ChatRole {
  return value === "user" || value === "assistant";
}

function sanitizeMessages(input: unknown): Array<{ role: ChatRole; content: string }> {
  if (!Array.isArray(input)) {
    return [];
  }

  return input
    .filter((item): item is ChatMessage => Boolean(item) && typeof item === "object")
    .map((item) => ({
      role: isChatRole(item.role) ? item.role : "user",
      content: typeof item.content === "string" ? limitText(item.content, MAX_MESSAGE_CHARS) : "",
    }))
    .filter((item) => item.content.length > 0)
    .slice(-MAX_HISTORY_MESSAGES);
}

function buildSystemPrompt(language: "fr" | "en" | "ar") {
  if (language === "ar") {
    return [
      "You are HandiTalents accessibility chat assistant.",
      "Respond in Arabic only.",
      "Help candidates with disabilities understand the platform, job offers, applications, profile completion, and accessibility features.",
      "Use simple words and short sentences.",
      "Be warm, respectful, and practical.",
      "Do not invent facts.",
      "If information is missing, say: غير مذكور.",
      "Do not give medical advice.",
      "Do not judge the user's disability.",
      "When useful, give short step-by-step help.",
    ].join("\n");
  }

  if (language === "en") {
    return [
      "You are HandiTalents accessibility chat assistant.",
      "Respond in English only.",
      "Help candidates with disabilities understand the platform, job offers, applications, profile completion, and accessibility features.",
      "Use simple words and short sentences.",
      "Be warm, respectful, and practical.",
      "Do not invent facts.",
      "If information is missing, say: Not specified.",
      "Do not give medical advice.",
      "Do not judge the user's disability.",
      "When useful, give short step-by-step help.",
    ].join("\n");
  }

  return [
    "You are HandiTalents accessibility chat assistant.",
    "Respond in French only.",
    "Help candidates with disabilities understand the platform, job offers, applications, profile completion, and accessibility features.",
    "Use simple words and short sentences.",
    "Be warm, respectful, and practical.",
    "Do not invent facts.",
    "If information is missing, say: Non precise.",
    "Do not give medical advice.",
    "Do not judge the user's disability.",
    "When useful, give short step-by-step help.",
  ].join("\n");
}

function buildPrompt(params: {
  language: "fr" | "en" | "ar";
  messages: Array<{ role: ChatRole; content: string }>;
  currentPath: string;
  pageTitle: string;
  pageContext: string;
}) {
  const history = params.messages
    .map((item) => `${item.role === "assistant" ? "Assistant" : "User"}: ${item.content}`)
    .join("\n");

  const contextBlock = [
    params.currentPath ? `Current page path: ${params.currentPath}` : "",
    params.pageTitle ? `Current page title: ${params.pageTitle}` : "",
    params.pageContext ? `Visible page context:\n${params.pageContext}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  return [
    buildSystemPrompt(params.language),
    contextBlock ? `Application context:\n${contextBlock}` : "",
    history ? `Conversation:\n${history}` : "",
    "Answer the user's latest request clearly.",
  ]
    .filter(Boolean)
    .join("\n\n");
}

export async function POST(request: Request) {
  let body: ChatbotRequest;

  try {
    body = (await request.json()) as ChatbotRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const directMessage = typeof body.message === "string" ? body.message : "";
  const sanitizedMessages = sanitizeMessages(body.messages);
  const fallbackMessage = sanitizedMessages[sanitizedMessages.length - 1]?.content ?? "";
  const latestMessage = limitText(directMessage || fallbackMessage, MAX_MESSAGE_CHARS);

  if (!latestMessage) {
    return NextResponse.json({ error: "message is required." }, { status: 400 });
  }

  const currentPath = typeof body.currentPath === "string" ? limitText(body.currentPath, 200) : "";
  const pageTitle = typeof body.pageTitle === "string" ? limitText(body.pageTitle, 180) : "";
  const pageContext = typeof body.pageContext === "string" ? limitText(body.pageContext, MAX_CONTEXT_CHARS) : "";
  const language = detectLanguage(latestMessage);
  const prompt = buildPrompt({
    language,
    messages: sanitizedMessages.length > 0 ? sanitizedMessages : [{ role: "user", content: latestMessage }],
    currentPath,
    pageTitle,
    pageContext,
  });

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
          temperature: 0.3,
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
    const reply = typeof payload.response === "string" ? payload.response.trim() : "";

    if (!reply) {
      return NextResponse.json({ error: "Empty response from Ollama." }, { status: 502 });
    }

    return NextResponse.json({
      reply,
      language,
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
