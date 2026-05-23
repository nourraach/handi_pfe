-- V2 Matching Foundations: pgvector + embedding storage
--> statement-breakpoint
CREATE EXTENSION IF NOT EXISTS vector;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS candidate_embeddings (
  candidate_id UUID PRIMARY KEY REFERENCES candidat(id) ON DELETE CASCADE,
  embedding vector(1536) NOT NULL,
  source_hash TEXT NOT NULL,
  model_name TEXT NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS job_offer_embeddings (
  job_offer_id UUID PRIMARY KEY REFERENCES offre_emploi(id) ON DELETE CASCADE,
  embedding vector(1536) NOT NULL,
  source_hash TEXT NOT NULL,
  model_name TEXT NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS candidate_embeddings_vector_idx
  ON candidate_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS job_offer_embeddings_vector_idx
  ON job_offer_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
