const { db } = require("../dist/db");
const { utilisateurTable } = require("../dist/db/schema");
const { inArray } = require("drizzle-orm");

const emails = ["cand.test@handitalents.com", "ent.test@handitalents.com"];

(async () => {
  await db
    .update(utilisateurTable)
    .set({ statut: "actif", token_activation: null })
    .where(inArray(utilisateurTable.email, emails));
  console.log("Comptes tests activés :", emails.join(", "));
  process.exit(0);
})().catch((err) => {
  console.error("Erreur activation comptes tests:", err);
  process.exit(1);
});
