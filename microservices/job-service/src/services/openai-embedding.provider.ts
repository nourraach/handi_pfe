import { EmbeddingProvider } from "./embedding.provider";

type OpenAIEmbeddingResponse = {
  data?: Array<{ embedding: number[] }>;
};

export class OpenAIEmbeddingProvider implements EmbeddingProvider {
  constructor(
    private readonly apiKey: string,
    private readonly model = "text-embedding-3-small",
  ) {}

  modelName() {
    return this.model;
  }

  async embed(text: string): Promise<number[]> {
    const response = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.model,
        input: text,
      }),
    });

    const payload = (await response.json().catch(() => ({}))) as OpenAIEmbeddingResponse & {
      error?: { message?: string };
    };

    if (!response.ok) {
      throw new Error(payload?.error?.message || "Erreur OpenAI embeddings");
    }

    const embedding = payload?.data?.[0]?.embedding;
    if (!Array.isArray(embedding) || embedding.length === 0) {
      throw new Error("Embedding OpenAI vide");
    }

    return embedding;
  }
}
