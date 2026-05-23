import { EmbeddingProvider } from "./embedding.provider";
import { HashEmbeddingProvider } from "./hash-embedding.provider";
import { OpenAIEmbeddingProvider } from "./openai-embedding.provider";

export function createEmbeddingProvider(): EmbeddingProvider {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_EMBED_MODEL || "text-embedding-3-small";
  const fallbackDim = Number(process.env.EMBEDDING_FALLBACK_DIM || "1536");
  if (apiKey && apiKey.trim().length > 0) {
    return new OpenAIEmbeddingProvider(apiKey.trim(), model);
  }

  return new HashEmbeddingProvider(Number.isFinite(fallbackDim) ? fallbackDim : 1536);
}
