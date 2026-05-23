/**
 * Script de diagnostic pour vérifier l'état de la base de données
 * 
 * Usage:
 * 1. Ouvrir la console du navigateur (F12)
 * 2. Copier-coller ce script
 * 3. Exécuter diagnosticBaseDonnees()
 */

// Configuration
const API_BASE_URL = 'http://localhost:4000';

// Test de création d'offre avec suivi détaillé
async function testerCreationOffreAvecSuivi() {
  console.log("\n🔍 === TEST CRÉATION OFFRE AVEC SUIVI BD ===");
  
  const token = localStorage.getItem("token_auth");
  if (!token) {
    console.error("❌ Aucun token d'authentification trouvé");
    return;
  }

  // 1. Lister les offres avant création
  console.log("\n📋 Étape 1: Liste des offres AVANT création");
  const offresAvant = await listerOffresAvecDetails();
  
  // 2. Créer une offre de test
  console.log("\n➕ Étape 2: Création d'une offre de test");
  const offreTest = {
    titre: `Test BD ${Date.now()}`,
    description: "Offre de test pour vérifier l'insertion en base de données. Cette description contient plus de 50 caractères comme requis.",
    localisation: "Test City",
    type_poste: "CDI",
    salaire_min: 35000,
    salaire_max: 45000,
    date_limite: "2024-06-30",
    competences_requises: "Test, Debug, SQL",
    experience_requise: "Test",
    niveau_etude: "Test"
  };

  console.log("📦 Données à envoyer:", offreTest);

  try {
    const response = await fetch(`${API_BASE_URL}/api/entreprise/offres`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(offreTest)
    });

    console.log("📡 Status de création:", response.status);
    console.log("📡 Headers de réponse:", Object.fromEntries(response.headers.entries()));

    if (response.ok) {
      const data = await response.json();
      console.log("✅ Offre créée avec succès:", data);
      
      const idOffreCreee = data.donnees?.id_offre;
      console.log("🆔 ID de l'offre créée:", idOffreCreee);

      // 3. Vérifier que l'offre apparaît dans la liste
      console.log("\n📋 Étape 3: Vérification dans la liste APRÈS création");
      const offresApres = await listerOffresAvecDetails();
      
      if (offresApres && offresAvant) {
        const nouvellesOffres = offresApres.length - offresAvant.length;
        console.log(`📊 Différence: ${nouvellesOffres} nouvelle(s) offre(s)`);
        
        if (idOffreCreee) {
          const offreTrouvee = offresApres.find(o => o.id_offre === idOffreCreee);
          if (offreTrouvee) {
            console.log("✅ Offre trouvée dans la liste:", offreTrouvee);
          } else {
            console.log("❌ Offre NON trouvée dans la liste malgré la création réussie");
            console.log("🔍 Cela indique un problème de synchronisation entre création et lecture");
          }
        }
      }

      // 4. Nettoyer - supprimer l'offre de test
      if (idOffreCreee) {
        console.log("\n🧹 Étape 4: Nettoyage - Suppression de l'offre de test");
        await supprimerOffreTest(idOffreCreee);
      }

    } else if (response.status === 404) {
      console.log("❌ Endpoint de création non implémenté (404)");
      console.log("💡 L'API POST /api/entreprise/offres n'existe pas côté backend");
      
    } else {
      console.error("❌ Erreur lors de la création:", response.status);
      try {
        const errorData = await response.json();
        console.log("📄 Détails de l'erreur:", errorData);
      } catch (e) {
        const textResponse = await response.text();
        console.log("📄 Réponse brute:", textResponse.substring(0, 300));
      }
    }

  } catch (error) {
    console.error("💥 Erreur de connexion:", error);
    console.log("❌ Le serveur backend n'est pas accessible");
  }
}

// Lister les offres avec détails
async function listerOffresAvecDetails() {
  const token = localStorage.getItem("token_auth");
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/entreprise/offres`, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });

    console.log("📡 Status liste:", response.status);

    if (response.ok) {
      const data = await response.json();
      const offres = data.donnees?.offres || [];
      console.log(`📋 ${offres.length} offre(s) trouvée(s)`);
      
      offres.forEach((offre, index) => {
        console.log(`   ${index + 1}. ${offre.titre} (ID: ${offre.id_offre}) - ${offre.statut}`);
      });
      
      return offres;
    } else if (response.status === 404) {
      console.log("❌ Endpoint de liste non implémenté (404)");
      return null;
    } else {
      console.error("❌ Erreur lors de la récupération:", response.status);
      return null;
    }
  } catch (error) {
    console.error("💥 Erreur de connexion:", error);
    return null;
  }
}

// Supprimer une offre de test
async function supprimerOffreTest(idOffre) {
  const token = localStorage.getItem("token_auth");
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/entreprise/offres/${idOffre}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });

    console.log("📡 Status suppression:", response.status);

    if (response.ok) {
      console.log("✅ Offre de test supprimée avec succès");
    } else if (response.status === 404) {
      console.log("❌ Endpoint de suppression non implémenté (404)");
    } else {
      console.log("⚠️ Erreur lors de la suppression:", response.status);
    }
  } catch (error) {
    console.error("💥 Erreur lors de la suppression:", error);
  }
}

// Test de vérification de la structure de la base de données
async function verifierStructureBaseDonnees() {
  console.log("\n🔍 === VÉRIFICATION STRUCTURE BASE DE DONNÉES ===");
  
  console.log("📋 Structure attendue de la table 'offres_emploi':");
  console.log(`
  CREATE TABLE offres_emploi (
    id_offre INT PRIMARY KEY AUTO_INCREMENT,
    id_entreprise INT NOT NULL,
    titre VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    localisation VARCHAR(255) NOT NULL,
    type_poste ENUM('CDI', 'CDD', 'Stage', 'Freelance', 'Alternance') NOT NULL,
    salaire_min DECIMAL(10,2),
    salaire_max DECIMAL(10,2),
    date_limite DATE,
    competences_requises TEXT,
    experience_requise VARCHAR(255),
    niveau_etude VARCHAR(255),
    statut ENUM('active', 'inactive', 'pourvue', 'expiree') DEFAULT 'active',
    vues_count INT DEFAULT 0,
    candidatures_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (id_entreprise) REFERENCES utilisateurs(id_utilisateur),
    INDEX idx_entreprise (id_entreprise),
    INDEX idx_statut (statut)
  );
  `);

  console.log("🔧 Commandes SQL pour vérifier la structure:");
  console.log("1. DESCRIBE offres_emploi;");
  console.log("2. SELECT COUNT(*) FROM offres_emploi;");
  console.log("3. SELECT * FROM offres_emploi ORDER BY created_at DESC LIMIT 5;");
  console.log("4. SHOW CREATE TABLE offres_emploi;");
}

// Test de l'authentification et des permissions
async function verifierAuthentificationPermissions() {
  console.log("\n🔍 === VÉRIFICATION AUTHENTIFICATION & PERMISSIONS ===");
  
  const token = localStorage.getItem("token_auth");
  const utilisateur = localStorage.getItem("utilisateur_connecte");
  
  if (!token) {
    console.log("❌ Aucun token trouvé");
    return false;
  }
  
  if (!utilisateur) {
    console.log("❌ Aucune donnée utilisateur trouvée");
    return false;
  }

  try {
    const userData = JSON.parse(utilisateur);
    console.log("👤 Utilisateur connecté:");
    console.log("   - Nom:", userData.nom);
    console.log("   - Email:", userData.email);
    console.log("   - Rôle:", userData.role);
    console.log("   - ID:", userData.id_utilisateur);

    if (userData.role !== 'entreprise') {
      console.log("⚠️ ATTENTION: Vous n'êtes pas connecté en tant qu'entreprise");
      console.log("💡 Les endpoints d'offres nécessitent le rôle 'entreprise'");
      return false;
    }

    // Test du token avec l'API profil
    console.log("\n🔐 Test de validité du token...");
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/profil`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      console.log("📡 Status profil:", response.status);

      if (response.ok) {
        const profilData = await response.json();
        console.log("✅ Token valide, profil récupéré:", profilData);
        return true;
      } else {
        console.log("❌ Token invalide ou expiré");
        return false;
      }
    } catch (error) {
      console.log("💥 Erreur lors de la vérification du token:", error);
      return false;
    }

  } catch (error) {
    console.log("❌ Erreur lors du parsing des données utilisateur:", error);
    return false;
  }
}

// Diagnostic complet de la base de données
async function diagnosticBaseDonnees() {
  console.log("🚀 === DIAGNOSTIC COMPLET BASE DE DONNÉES ===");
  
  // 1. Vérifier l'authentification
  console.log("\n🔐 Étape 1: Vérification de l'authentification");
  const authOk = await verifierAuthentificationPermissions();
  
  if (!authOk) {
    console.log("\n❌ === DIAGNOSTIC ARRÊTÉ - PROBLÈME D'AUTHENTIFICATION ===");
    console.log("💡 Connectez-vous avec un compte entreprise valide avant de continuer");
    return;
  }

  // 2. Afficher la structure attendue
  verifierStructureBaseDonnees();

  // 3. Tester la création avec suivi
  await testerCreationOffreAvecSuivi();

  console.log("\n📊 === RÉSUMÉ DU DIAGNOSTIC ===");
  console.log("✅ Authentification vérifiée");
  console.log("📋 Structure de base de données documentée");
  console.log("🧪 Test de création/lecture/suppression effectué");
  console.log("\n💡 Analysez les logs ci-dessus pour identifier:");
  console.log("   - Si les endpoints sont implémentés (404 = non implémenté)");
  console.log("   - Si les données sont bien insérées en base");
  console.log("   - Si la synchronisation création/lecture fonctionne");
  console.log("   - Si les permissions sont correctes");
}

// Instructions
console.log(`
🔧 === SCRIPT DE DIAGNOSTIC BASE DE DONNÉES ===

Fonctions disponibles:
- diagnosticBaseDonnees()           : Diagnostic complet
- testerCreationOffreAvecSuivi()   : Test détaillé de création
- listerOffresAvecDetails()        : Lister les offres avec détails
- verifierStructureBaseDonnees()   : Afficher la structure SQL attendue
- verifierAuthentificationPermissions() : Vérifier l'auth

Usage:
1. Connectez-vous en tant qu'entreprise
2. Exécutez: diagnosticBaseDonnees()
3. Analysez les logs pour identifier le problème

Ce script vous aidera à déterminer si le problème vient de:
- L'implémentation des endpoints backend
- La structure de la base de données
- L'insertion/lecture des données
- Les permissions utilisateur
`);