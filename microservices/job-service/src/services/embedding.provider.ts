export interface EmbeddingProvider {
  modelName(): string;
  embed(text: string): Promise<number[]>;
}

// Placeholder provider for V2 bootstrap.
// The real provider (OpenAI/Cohere/local) will replace this class.
export class NoopEmbeddingProvider implements EmbeddingProvider {
  modelName() {
    return "noop-v2-bootstrap";
  }

  async embed(_text: string): Promise<number[]> {
    return [];
  }
}
