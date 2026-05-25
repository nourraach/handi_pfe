import { pool } from "../db";

type EmbeddingRow = {
  entityId: string;
  embedding: number[];
};

function toVectorLiteral(values: number[]) {
  return `[${values.join(",")}]`;
}

function parseEmbeddingText(raw: string): number[] {
  const text = String(raw || "").trim();
  if (!text) return [];

  const normalized = text
    .replace(/^\{/, "[")
    .replace(/\}$/, "]")
    .replace(/^\[/, "")
    .replace(/\]$/, "");

  if (!normalized) return [];

  return normalized
    .split(",")
    .map((v) => Number(v.trim()))
    .filter((v) => Number.isFinite(v));
}

export class EmbeddingStorageService {
  private hasVectorExtensionCache: boolean | null = null;

  async hasVectorExtension() {
    if (this.hasVectorExtensionCache !== null) return this.hasVectorExtensionCache;

    const result = await pool.query(
      `SELECT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector') AS enabled`,
    );

    this.hasVectorExtensionCache = Boolean(result.rows[0]?.enabled);
    return this.hasVectorExtensionCache;
  }

  async upsertCandidateEmbedding(input: {
    candidateId: string;
    embedding: number[];
    sourceHash: string;
    modelName: string;
  }) {
    if (!input.embedding.length) return;

    const hasVector = await this.hasVectorExtension();
    if (hasVector) {
      await pool.query(
        `
        INSERT INTO candidate_embeddings (candidate_id, embedding, source_hash, model_name, updated_at)
        VALUES ($1, $2::vector, $3, $4, NOW())
        ON CONFLICT (candidate_id)
        DO UPDATE SET
          embedding = EXCLUDED.embedding,
          source_hash = EXCLUDED.source_hash,
          model_name = EXCLUDED.model_name,
          updated_at = NOW()
      `,
        [input.candidateId, toVectorLiteral(input.embedding), input.sourceHash, input.modelName],
      );
      return;
    }

    await pool.query(
      `
      INSERT INTO candidate_embeddings (candidate_id, embedding, source_hash, model_name, updated_at)
      VALUES ($1, $2::double precision[], $3, $4, NOW())
      ON CONFLICT (candidate_id)
      DO UPDATE SET
        embedding = EXCLUDED.embedding,
        source_hash = EXCLUDED.source_hash,
        model_name = EXCLUDED.model_name,
        updated_at = NOW()
    `,
      [input.candidateId, input.embedding, input.sourceHash, input.modelName],
    );
  }

  async upsertJobOfferEmbedding(input: {
    jobOfferId: string;
    embedding: number[];
    sourceHash: string;
    modelName: string;
  }) {
    if (!input.embedding.length) return;

    const hasVector = await this.hasVectorExtension();
    if (hasVector) {
      await pool.query(
        `
        INSERT INTO job_offer_embeddings (job_offer_id, embedding, source_hash, model_name, updated_at)
        VALUES ($1, $2::vector, $3, $4, NOW())
        ON CONFLICT (job_offer_id)
        DO UPDATE SET
          embedding = EXCLUDED.embedding,
          source_hash = EXCLUDED.source_hash,
          model_name = EXCLUDED.model_name,
          updated_at = NOW()
      `,
        [input.jobOfferId, toVectorLiteral(input.embedding), input.sourceHash, input.modelName],
      );
      return;
    }

    await pool.query(
      `
      INSERT INTO job_offer_embeddings (job_offer_id, embedding, source_hash, model_name, updated_at)
      VALUES ($1, $2::double precision[], $3, $4, NOW())
      ON CONFLICT (job_offer_id)
      DO UPDATE SET
        embedding = EXCLUDED.embedding,
        source_hash = EXCLUDED.source_hash,
        model_name = EXCLUDED.model_name,
        updated_at = NOW()
    `,
      [input.jobOfferId, input.embedding, input.sourceHash, input.modelName],
    );
  }

  async getJobOfferEmbedding(jobOfferId: string) {
    const result = await pool.query(
      `SELECT embedding::text AS embedding_text FROM job_offer_embeddings WHERE job_offer_id = $1 LIMIT 1`,
      [jobOfferId],
    );
    const row = result.rows[0];
    if (!row?.embedding_text) return null;
    return parseEmbeddingText(row.embedding_text);
  }

  async getCandidateEmbeddings(candidateIds: string[]) {
    if (!candidateIds.length) return new Map<string, number[]>();

    const result = await pool.query(
      `
      SELECT candidate_id, embedding::text AS embedding_text
      FROM candidate_embeddings
      WHERE candidate_id = ANY($1::uuid[])
    `,
      [candidateIds],
    );

    const map = new Map<string, number[]>();
    for (const row of result.rows) {
      if (row?.candidate_id && row?.embedding_text) {
        map.set(row.candidate_id, parseEmbeddingText(row.embedding_text));
      }
    }
    return map;
  }

  cosineSimilarity(left: number[], right: number[]) {
    if (!left.length || !right.length || left.length !== right.length) return 0;

    let dot = 0;
    let normL = 0;
    let normR = 0;

    for (let i = 0; i < left.length; i += 1) {
      const a = left[i] || 0;
      const b = right[i] || 0;
      dot += a * b;
      normL += a * a;
      normR += b * b;
    }

    const denom = Math.sqrt(normL) * Math.sqrt(normR);
    if (!denom) return 0;
    const score = dot / denom;
    if (!Number.isFinite(score)) return 0;
    return Math.max(0, Math.min(1, score));
  }
}

export type { EmbeddingRow };
