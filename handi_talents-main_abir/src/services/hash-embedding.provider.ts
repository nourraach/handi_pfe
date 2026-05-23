import { EmbeddingProvider } from "./embedding.provider";

const DEFAULT_DIMENSION = 1536;

function stableHash(input: string) {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

export class HashEmbeddingProvider implements EmbeddingProvider {
  constructor(private readonly dimension = DEFAULT_DIMENSION) {}

  modelName() {
    return `hash-${this.dimension}`;
  }

  async embed(text: string): Promise<number[]> {
    const vector = new Array(this.dimension).fill(0);
    const tokens = String(text || "")
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((token) => token.length > 1);

    for (const token of tokens) {
      const idx = stableHash(token) % this.dimension;
      vector[idx] += 1;
    }

    const norm = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));
    if (!norm) return vector;
    return vector.map((value) => value / norm);
  }
}
