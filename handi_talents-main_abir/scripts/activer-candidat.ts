import "dotenv/config";
import { db } from "../src/db";
import { utilisateurTable } from "../src/db/schema";
import { StatutUtilisateur } from "../src/types/enums";
import { eq } from "drizzle-orm";

async function activerCandidat() {
  try {
    console.log("🔄 Activation du compte candidat...");

    const candidatEmail = "candidat@handitalents.com";

    // Mettre à jour le statut du candidat à ACTIF
    const [utilisateurMisAJour] = await db
      .update(utilisateurTable)
      .set({
        statut: StatutUtilisateur.ACTIF,
        token_activation: null,
        updated_at: new Date(),
      })
      .where(eq(utilisateurTable.email, candidatEmail))
      .returning();

    if (utilisateurMisAJour) {
      console.log("✅ Compte candidat activé avec succès!");
      console.log("📧 Email:", candidatEmail);
      console.log("📊 Nouveau statut:", utilisateurMisAJour.statut);
      console.log("\n🎉 Le candidat peut maintenant se connecter sans problème!");
    } else {
      console.log("❌ Aucun utilisateur trouvé avec cet email");
    }

    process.exit(0);
  } catch (erreur: any) {
    console.error("❌ Erreur lors de l'activation:", erreur.message);
    process.exit(1);
  }
}

activerCandidat();