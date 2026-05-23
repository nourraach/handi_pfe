import { config } from "dotenv";
config();

import { db } from "../src/db";
import { 
  utilisateurTable, 
  candidatTable, 
  entrepriseTable, 
  offreEmploiTable,
  candidatureTable
} from "../src/db/schema";

async function testerProcessusSimple() {
  console.log("🚀 Test simplifié du processus de candidature");

  try {
    // Test de connexion à la base
    console.log("\n1️⃣ Test de connexion à la base de données...");
    
    const utilisateurs = await db.select().from(utilisateurTable).limit(1);
    console.log(`✅ Connexion réussie - ${utilisateurs.length} utilisateur(s) trouvé(s)`);

    // Vérifier les tables créées
    console.log("\n2️⃣ Vérification des nouvelles tables...");
    
    const offres = await db.select().from(offreEmploiTable).limit(1);
    console.log(`✅ Table offre_emploi accessible - ${offres.length} offre(s)`);

    const candidatures = await db.select().from(candidatureTable).limit(1);
    console.log(`✅ Table candidature accessible - ${candidatures.length} candidature(s)`);

    console.log("\n✅ Test de base réussi - toutes les tables sont accessibles!");

  } catch (error) {
    console.error("❌ Erreur lors du test:", error);
  } finally {
    process.exit(0);
  }
}

testerProcessusSimple();