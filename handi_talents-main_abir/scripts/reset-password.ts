import "dotenv/config";
import bcrypt from "bcrypt";
import { Client } from "pg";

async function main() {
  const email = process.argv[2];
  const password = process.argv[3];

  if (!email || !password) {
    console.error("Usage: ts-node scripts/reset-password.ts <email> <password>");
    process.exit(1);
  }

  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  const hash = await bcrypt.hash(password, 10);
  await client.query(
    "update utilisateur set mdp = $1, statut = 'actif', updated_at = now() where email = $2",
    [hash, email],
  );

  console.log(`Password reset pour ${email}`);
  await client.end();
}

main().catch((error) => {
  console.error("Echec reset password:", error);
  process.exit(1);
});
