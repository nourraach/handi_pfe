import { config } from "dotenv";
config();

import { AuthService } from "../src/services/auth.service";

async function testConnexionSimple() {
  console.log("🔍 Test simple de connexion");
  
  const authService = new AuthService();
  
  // Remplacez par un email d'entreprise existant dans votre base
  const emailTest = "test@entreprise.com";
  const motDePasseTest = "password123";

  try {
    console.log("Tentative de connexion...");
    const resultat = await authService.connecter({ 
      email: emailTest, 
      mdp: motDePasseTest 
    });
    
    console.log("✅ SUCCÈS: Connexion réussie !");
    console.log(`Utilisateur: ${resultat.utilisateur?.nom}`);
    console.log(`Statut: ${resultat.utilisateur?.statut}`);
    
  } catch (error: any) {
    console.log(`❌ Connexion échouée: ${error.message}`);
  }
  
  process.exit(0);
}

testConnexionSimple();