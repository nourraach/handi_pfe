import { NextResponse } from "next/server";

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL?.trim() || "http://localhost:11434";
const DEFAULT_MODEL = process.env.OLLAMA_MODEL?.trim() || "llama3.2:3b";

type OllamaAction = "generate" | "chat" | "tags";

function buildUrl(action: OllamaAction) {
  switch (action) {
    case "generate":
      return `${OLLAMA_BASE_URL}/api/generate`;
    case "chat":
      return `${OLLAMA_BASE_URL}/api/chat`;
    case "tags":
      return `${OLLAMA_BASE_URL}/api/tags`;
    default:
      return `${OLLAMA_BASE_URL}/api/generate`;
  }
}

export async function GET() {
  try {
    const response = await fetch(buildUrl("tags"), {
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          connected: false,
          error: "Ollama not available",
        },
        { status: 503 },
      );
    }

    const payload = await response.json().catch(() => ({}));
    return NextResponse.json({
      connected: true,
      models: Array.isArray(payload.models) ? payload.models : [],
    });
  } catch (error) {
    return NextResponse.json(
      {
        connected: false,
        error: error instanceof Error ? error.message : "Unable to reach Ollama.",
      },
      { status: 503 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
    }

    const action = typeof (body as { action?: unknown }).action === "string" ? (body as { action: string }).action : "generate";
    const endpoint = buildUrl(action === "chat" ? "chat" : action === "tags" ? "tags" : "generate");
    const requestMethod = action === "tags" ? "GET" : "POST";
    const payload = { ...(body as Record<string, unknown>) };
    delete payload.action;

    if (requestMethod === "POST" && !("model" in payload)) {
      payload.model = DEFAULT_MODEL;
    }

    const response = await fetch(endpoint, {
      method: requestMethod,
      headers: requestMethod === "POST" ? { "Content-Type": "application/json" } : undefined,
      body: requestMethod === "POST" ? JSON.stringify(payload) : undefined,
      cache: "no-store",
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      return NextResponse.json(
        {
          error: `Ollama API error: ${errorText || response.statusText}`,
        },
        { status: response.status },
      );
    }

    const data = await response.json().catch(() => ({}));
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to reach Ollama.",
      },
      { status: 500 },
    );
  }
}
