import "dotenv/config";
import { db } from "../src/db";
import { adminTable, candidatTable, entrepriseTable, utilisateurTable } from "../src/db/schema";
import { RoleUtilisateur } from "../src/types/enums";
import { eq } from "drizzle-orm";

async function initialiserProfils() {
  try {
    console.log("🚀 Initialisation des profils étendus...\n");

    // Initialiser le profil admin
    const adminEmail = "admin@handitalents.com";
    const [adminUtilisateur] = await db
      .select()
      .from(utilisateurTable)
      .where(eq(utilisateurTable.email, adminEmail));

    if (adminUtilisateur) {
      // Vérifier si le profil admin existe déjà
      const [adminExistant] = await db
        .select()
        .from(adminTable)
        .where(eq(adminTable.id_utilisateur, adminUtilisateur.id_utilisateur));

      if (!adminExistant) {
        await db.insert(adminTable).values({
          id_utilisateur: adminUtilisateur.id_utilisateur,
          poste: "Administrateur Système",
          departement: "Informatique / IT",
          date_embauche: "2023-01-15",
          permissions: [
            "Gestion des utilisateurs",
            "Validation des comptes",
            "Accès aux statistiques",
            "Configuration système"
          ],
          notifications_email: true,
          notifications_sms: false,
        });
        console.log("✅ Profil admin initialisé");
      } else {
        console.log("⚠️  Profil admin existe déjà");
      }
    }

    // Mettre à jour le profil candidat avec les nouveaux champs
    const candidatEmail = "candidat@handitalents.com";
    const [candidatUtilisateur] = await db
      .select()
      .from(utilisateurTable)
      .where(eq(utilisateurTable.email, candidatEmail));

    if (candidatUtilisateur) {
      await db
        .update(candidatTable)
        .set({
          competences: ["JavaScript", "React", "Node.js", "TypeScript"],
          experience: "3 ans d'expérience en développement web avec une spécialisation en applications React et Node.js. Expérience en travail d'équipe et méthodologies agiles.",
          formation: "Licence en Informatique - Université de Sfax",
          handicap: "Handicap moteur",
          disponibilite: "Immédiate",
          salaire_souhaite: "35000€ annuel",
          updated_at: new Date(),
        })
        .where(eq(candidatTable.id_utilisateur, candidatUtilisateur.id_utilisateur));
      
      console.log("✅ Profil candidat mis à jour avec les nouveaux champs");
    }

    console.log("\n" + "=".repeat(50));
    console.log("🎉 Profils initialisés avec succès!");
    console.log("=".repeat(50));
    
    process.exit(0);
  } catch (erreur: any) {
    console.error("❌ Erreur lors de l'initialisation des profils:", erreur.message);
    console.error(erreur);
    process.exit(1);
  }
}

initialiserProfils();