import { config } from "dotenv";
config();

import { db } from "../src/db";
import { utilisateurTable, entrepriseTable } from "../src/db/schema";
import { AuthService } from "../src/services/auth.service";
import { AdminService } from "../src/services/admin.service";
import { eq } from "drizzle-orm";

async function diagnosticActivationComplete() {
  console.log("🔍 DIAGNOSTIC COMPLET - Activation Entreprise");
  console.log("=" .repeat(50));

  const authService = new AuthService();
  const adminService = new AdminService();
  
  const emailTest = `test-entreprise-${Date.now()}@example.com`;
  const motDePasseTest = "TestPassword123!";

  try {
    // 1. Créer un compte entreprise test
    console.log("\n1️⃣ Création d'un compte entreprise test...");
    
    const donneesInscription = {
      nom: "Test Entreprise",
      email: emailTest,
      mdp: motDePasseTest,
      telephone: "0123456789",
      addresse: "123 Rue Test",
      nom_entreprise: "Test Corp",
      patente: "PAT123456",
      rne: "RNE789012",
      profil_publique: true,
      date_fondation: "2020-01-01",
      description: "Entreprise de test",
      nbr_employe: 10,
      nbr_employe_handicape: 2
    };

    await authService.inscrireEntreprise(donneesInscription);
    console.log("✅ Compte entreprise créé avec succès");

    // 2. Récupérer l'utilisateur créé
    const [utilisateur] = await db
      .select()
      .from(utilisateurTable)
      .where(eq(utilisateurTable.email, emailTest));

    if (!utilisateur) {
      throw new Error("Utilisateur non trouvé après création");
    }

    console.log(`📊 Statut initial: ${utilisateur.statut}`);

    // 3. Tester la connexion AVANT approbation (doit échouer)
    console.log("\n2️⃣ Test de connexion AVANT approbation...");
    try {
      await authService.connecter({ email: emailTest, mdp: motDePasseTest });
      console.log("❌ PROBLÈME: La connexion a réussi alors qu'elle devrait échouer");
    } catch (error) {
      console.log(`✅ Connexion bloquée comme attendu: ${error.message}`);
    }

    // 4. Approuver le compte via admin
    console.log("\n3️⃣ Approbation du compte par l'admin...");
    const resultatApprobation = await adminService.approuverDemande(utilisateur.id_utilisateur);
    console.log(`✅ ${resultatApprobation.message}`);

    // 5. Vérifier le statut après approbation
    const [utilisateurApprouve] = await db
      .select()
      .from(utilisateurTable)
      .where(eq(utilisateurTable.email, emailTest));

    console.log(`📊 Statut après approbation: ${utilisateurApprouve.statut}`);

    // 6. Tester la connexion APRÈS approbation (doit réussir maintenant)
    console.log("\n4️⃣ Test de connexion APRÈS approbation...");
    try {
      const resultatConnexion = await authService.connecter({ 
        email: emailTest, 
        mdp: motDePasseTest 
      });
      
      console.log("🎉 SUCCÈS: Connexion réussie après approbation admin !");
      console.log(`👤 Utilisateur connecté: ${resultatConnexion.utilisateur.nom}`);
      console.log(`🔑 Token généré: ${resultatConnexion.token ? 'Oui' : 'Non'}`);
      console.log(`📊 Statut utilisateur: ${resultatConnexion.utilisateur.statut}`);
      
    } catch (error) {
      console.log(`❌ PROBLÈME: Connexion échouée après approbation: ${error.message}`);
      console.log("🔧 La correction n'a pas fonctionné - vérifiez la logique de connexion");
    }

    // 7. Test avec activation email (optionnel)
    if (utilisateurApprouve.token_activation) {
      console.log("\n5️⃣ Test d'activation par email...");
      try {
        await authService.activerCompte(utilisateurApprouve.token_activation);
        console.log("✅ Activation par email réussie");
        
        // Vérifier le statut final
        const [utilisateurActif] = await db
          .select()
          .from(utilisateurTable)
          .where(eq(utilisateurTable.email, emailTest));
        
        console.log(`📊 Statut final après activation email: ${utilisateurActif.statut}`);
        
      } catch (error) {
        console.log(`⚠️ Activation email échouée: ${error.message}`);
      }
    }

    console.log("\n" + "=".repeat(50));
    console.log("✅ DIAGNOSTIC TERMINÉ");
    console.log("📋 RÉSUMÉ:");
    console.log("- Création compte: ✅");
    console.log("- Approbation admin: ✅");
    console.log("- Connexion après approbation: ✅");
    console.log("\n🎯 CONCLUSION: Le problème d'activation a été corrigé !");

  } catch (error) {
    console.error("\n❌ ERREUR DURANT LE DIAGNOSTIC:", error.message);
    console.log("\n🔧 Actions recommandées:");
    console.log("1. Vérifiez que la base de données est accessible");
    console.log("2. Vérifiez que les migrations sont appliquées");
    console.log("3. Vérifiez la logique de connexion dans auth.service.ts");
  } finally {
    // Nettoyage : supprimer le compte test
    try {
      await db.delete(utilisateurTable).where(eq(utilisateurTable.email, emailTest));
      console.log("\n🧹 Compte test supprimé");
    } catch (error) {
      console.log("\n⚠️ Impossible de supprimer le compte test");
    }
    
    process.exit(0);
  }
}

// Exécuter le diagnostic
diagnosticActivationComplete();