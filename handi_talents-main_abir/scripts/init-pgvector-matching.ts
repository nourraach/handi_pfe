import "dotenv/config";
import fs from "fs";
import path from "path";
import { Client } from "pg";

const VECTOR_SQL_FILE = path.join(__dirname, "..", "sql", "2026-05-08_pgvector_matching_v2.sql");

const FALLBACK_SQL = [
  `
  CREATE TABLE IF NOT EXISTS candidate_embeddings (
    candidate_id UUID PRIMARY KEY REFERENCES candidat(id) ON DELETE CASCADE,
    embedding double precision[] NOT NULL,
    source_hash TEXT NOT NULL,
    model_name TEXT NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
  );
`,
  `
  CREATE TABLE IF NOT EXISTS job_offer_embeddings (
    job_offer_id UUID PRIMARY KEY REFERENCES offre_emploi(id) ON DELETE CASCADE,
    embedding double precision[] NOT NULL,
    source_hash TEXT NOT NULL,
    model_name TEXT NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
  );
`,
  `CREATE INDEX IF NOT EXISTS candidate_embeddings_updated_idx ON candidate_embeddings(updated_at);`,
  `CREATE INDEX IF NOT EXISTS job_offer_embeddings_updated_idx ON job_offer_embeddings(updated_at);`,
];

function splitStatements(sqlContent: string) {
  return sqlContent
    .split("--> statement-breakpoint")
    .map((chunk) => chunk.trim())
    .filter((chunk) => chunk.length > 0);
}

async function runStatements(client: Client, statements: string[]) {
  let executed = 0;
  for (let i = 0; i < statements.length; i += 1) {
    const statement = statements[i];
    try {
      await client.query(statement);
      executed += 1;
      console.log(`OK statement ${i + 1}/${statements.length}`);
    } catch (error: any) {
      const message = String(error?.message || "");
      if (
        message.includes("already exists") ||
        message.includes("duplicate key value") ||
        message.includes("multiple primary keys")
      ) {
        console.log(`SKIP statement ${i + 1}/${statements.length}: ${message.split("\n")[0]}`);
        continue;
      }
      throw error;
    }
  }
  return executed;
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL manquant dans .env");
  }

  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  try {
    let mode: "pgvector" | "fallback-array" = "pgvector";
    let statements: string[] = [];

    const vectorSql = fs.readFileSync(VECTOR_SQL_FILE, "utf8");
    statements = splitStatements(vectorSql);

    try {
      await client.query(`CREATE EXTENSION IF NOT EXISTS vector;`);
      console.log("Extension vector disponible.");
    } catch (error: any) {
      const message = String(error?.message || "");
      if (message.includes('extension "vector" is not available')) {
        mode = "fallback-array";
        console.log("Extension vector indisponible: bascule en fallback tableau double precision[].");
        statements = FALLBACK_SQL;
      } else {
        throw error;
      }
    }

    const executed = await runStatements(client, statements);

    const checks = await client.query(`
      SELECT
        EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector') AS has_vector_extension,
        EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'candidate_embeddings') AS has_candidate_embeddings,
        EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'job_offer_embeddings') AS has_job_offer_embeddings
    `);

    console.log(
      JSON.stringify(
        {
          success: true,
          mode,
          statements: statements.length,
          executed,
          checks: checks.rows[0],
        },
        null,
        2,
      ),
    );
  } finally {
    await client.end();
  }
}

main().catch((error: any) => {
  console.error("Echec initialisation vector:", error?.message || error);
  process.exit(1);
});
