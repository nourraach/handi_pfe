import "dotenv/config";
import { Client } from "pg";

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  const query = `
    SELECT table_name, column_name, udt_name
    FROM information_schema.columns
    WHERE table_name IN ('candidate_embeddings', 'job_offer_embeddings')
      AND column_name = 'embedding'
    ORDER BY table_name
  `;
  const result = await client.query(query);
  console.log(JSON.stringify(result.rows, null, 2));
  await client.end();
}

main().catch((error) => {
  console.error("Echec check embedding storage:", error);
  process.exit(1);
});
