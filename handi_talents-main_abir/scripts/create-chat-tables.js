/**
 * Script rapide pour créer les tables de messagerie (conversation, conversation_participant, message)
 * Utilise la connexion existante (db) et crée les tables si elles n'existent pas.
 */
require("dotenv/config");
const { db } = require("../dist/db");
const { sql } = require("drizzle-orm");

async function main() {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS conversation (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS conversation_participant (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      conversation_id uuid NOT NULL REFERENCES conversation(id) ON DELETE CASCADE,
      id_utilisateur uuid NOT NULL REFERENCES utilisateur(id_utilisateur) ON DELETE CASCADE,
      role TEXT NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS message (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      conversation_id uuid NOT NULL REFERENCES conversation(id) ON DELETE CASCADE,
      id_utilisateur uuid NOT NULL REFERENCES utilisateur(id_utilisateur) ON DELETE CASCADE,
      role TEXT NOT NULL,
      contenu TEXT NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);

  console.log("Tables chat créées / déjà présentes.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Erreur création tables chat:", err);
  process.exit(1);
});
