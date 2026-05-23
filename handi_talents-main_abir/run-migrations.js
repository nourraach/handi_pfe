// Simple migration runner using pg and the drizzle SQL files
const fs = require("fs");
const path = require("path");
const { Client } = require("pg");
require("dotenv").config();

async function main() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error("DATABASE_URL manquant dans .env");
    process.exit(1);
  }

  const drizzleDir = path.join(__dirname, "drizzle");
  const files = fs
    .readdirSync(drizzleDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  const client = new Client({ connectionString: dbUrl });
  await client.connect();
  try {
    for (const file of files) {
      const sql = fs.readFileSync(path.join(drizzleDir, file), "utf8");
      console.log(`➡️  Migration ${file}...`);
      try {
        await client.query(sql);
        console.log(`✅ ${file}`);
      } catch (err) {
        const msg = err.message || "";
        // Ignorer si déjà appliqué
        if (msg.includes("already exists") || msg.includes("duplicate key value")) {
          console.log(`ℹ️  ${file} déjà appliquée (message: ${msg.split("\n")[0]})`);
          continue;
        }
        throw err;
      }
    }
    console.log("Toutes les migrations ont été appliquées.");
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("Erreur migration:", err.message);
  process.exit(1);
});
