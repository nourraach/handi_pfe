/**
 * Script de test pour les APIs admin de gestion des demandes
 * 
 * Usage:
 * 1. Connectez-vous en tant qu'admin
 * 2. Ouvrir la console du navigateur (F12)
 * 3. Copier-coller ce script
 * 4. Exécuter les fonctions de test
 */

// Configuration
const API_BASE_URL = 'http://localhost:4000';

// Fonction pour récupérer le token d'authentification
function obtenirTokenAdmin() {
  const token = localStorage.getItem("token_auth");
  const utilisateur = localStorage.getItem("utilisateur_connecte");
  
  if (!token) {
    console.error("❌ Aucun token d'authentification trouvé");
    console.log("💡 Connectez-vous d'abord en tant qu'admin");
    return null;
  }
  
  if (utilisateur) {
    try {
      const userData = JSON.parse(utilisateur);
      if (userData.role !== 'admin') {
        console.error("❌ Vous n'êtes pas connecté en tant qu'admin");
        console.log("💡 Rôle actuel:", userData.role);
        return null;
      }
      console.log("✅ Admin connecté:", userData.nom);
    } catch (error) {
      console.error("❌ Erreur parsing utilisateur:", error);
      return null;
    }
  }
  
  console.log("✅ Token admin trouvé:", token.substring(0, 20) + "...");
  return token;
}

// Test 1: Lister les demandes en attente
async function testerListeDemandes() {
  console.log("\n🔍 === TEST 1: Liste des demandes en attente ===");
  
  const token = obtenirTokenAdmin();
  if (!token) return;

  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/demandes-en-attente`, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });

    console.log("📡 Status:", response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log("✅ Demandes récupérées:", data);
      console.log("📊 Nombre de demandes:", data.donnees?.length || 0);
      
      if (data.donnees && data.donnees.length > 0) {
        console.log("👥 Détails des demandes:");
        data.donnees.forEach((demande, index) => {
          console.log(`   ${index + 1}. ${demande.nom} (${demande.email}) - ${demande.role} - ${demande.statut}`);
        });
      }
      
      return data.donnees || [];
    } else if (response.status === 404) {
      console.log("❌ Endpoint non implémenté (404)");
      console.log("💡 L'API GET /api/admin/demandes-en-attente n'existe pas côté backend");
    } else {
      const errorText = await response.text();
      console.error("❌ Erreur liste demandes:", response.status, errorText);
    }
  } catch (error) {
    console.error("❌ Erreur connexion:", error);
  }
}

// Test 2: Approuver une demande
async function testerApprobation(idUtilisateur) {
  console.log(`\n🔍 === TEST 2: Approbation utilisateur ${idUtilisateur} ===`);
  
  const token = obtenirTokenAdmin();
  if (!token) return;

  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/approuver/${idUtilisateur}`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });

    console.log("📡 Status approbation:", response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log("✅ Approbation réussie:", data);
      return data;
    } else if (response.status === 404) {
      console.log("❌ Endpoint d'approbation non implémenté (404)");
      console.log("💡 L'API POST /api/admin/approuver/:id n'existe pas côté backend");
    } else {
      const errorData = await response.json().catch(() => ({ message: "Erreur inconnue" }));
      console.error("❌ Erreur approbation:", response.status, errorData);
    }
  } catch (error) {
    console.error("❌ Erreur connexion:", error);
  }
}

// Test 3: Refuser une demande
async function testerRefus(idUtilisateur, motif = "Test de refus") {
  console.log(`\n🔍 === TEST 3: Refus utilisateur ${idUtilisateur} ===`);
  
  const token = obtenirTokenAdmin();
  if (!token) return;

  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/refuser/${idUtilisateur}`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        motif: motif,
        commentaire: "Test automatique de refus"
      })
    });

    console.log("📡 Status refus:", response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log("✅ Refus réussi:", data);
      return data;
    } else if (response.status === 404) {
      console.log("❌ Endpoint de refus non implémenté (404)");
      console.log("💡 L'API POST /api/admin/refuser/:id n'existe pas côté backend");
    } else {
      const errorData = await response.json().catch(() => ({ message: "Erreur inconnue" }));
      console.error("❌ Erreur refus:", response.status, errorData);
    }
  } catch (error) {
    console.error("❌ Erreur connexion:", error);
  }
}

// Test 4: Créer une demande de test (pour avoir des données à tester)
async function creerDemandeTest() {
  console.log("\n🔍 === TEST 4: Création demande de test ===");
  
  const demandeTest = {
    nom: `Test User ${Date.now()}`,
    email: `test${Date.now()}@example.com`,
    mot_de_passe: "TestPassword123!",
    role: "candidat",
    telephone: "0123456789",
    addresse: "123 Rue de Test, Paris"
  };

  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/inscription`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(demandeTest)
    });

    console.log("📡 Status création:", response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log("✅ Demande de test créée:", data);
      console.log("📧 Email:", demandeTest.email);
      console.log("💡 Cette demande devrait apparaître dans la liste des demandes en attente");
      return data;
    } else {
      const errorData = await response.json().catch(() => ({ message: "Erreur inconnue" }));
      console.error("❌ Erreur création demande:", response.status, errorData);
    }
  } catch (error) {
    console.error("❌ Erreur connexion:", error);
  }
}

// Test complet du workflow admin
async function testWorkflowComplet() {
  console.log("🚀 === TEST COMPLET WORKFLOW ADMIN ===");
  
  // 1. Vérifier l'authentification admin
  const token = obtenirTokenAdmin();
  if (!token) {
    console.log("\n❌ === TEST ARRÊTÉ - PROBLÈME D'AUTHENTIFICATION ===");
    return;
  }

  // 2. Lister les demandes initiales
  console.log("\n📋 Étape 1: Liste initiale des demandes");
  const demandesInitiales = await testerListeDemandes();
  
  // 3. Créer une demande de test
  console.log("\n➕ Étape 2: Création d'une demande de test");
  const nouvelledemande = await creerDemandeTest();
  
  // 4. Attendre un peu
  console.log("\n⏳ Étape 3: Attente de 2 secondes...");
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // 5. Vérifier que la demande apparaît
  console.log("\n📋 Étape 4: Vérification nouvelle demande");
  const demandesApresCreation = await testerListeDemandes();
  
  if (demandesApresCreation && demandesInitiales) {
    const nouvelles = demandesApresCreation.length - demandesInitiales.length;
    console.log(`📊 Différence: ${nouvelles} nouvelle(s) demande(s)`);
  }
  
  // 6. Tester l'approbation si on a des demandes
  if (demandesApresCreation && demandesApresCreation.length > 0) {
    const premiereDemande = demandesApresCreation[0];
    console.log(`\n✅ Étape 5: Test d'approbation de ${premiereDemande.nom}`);
    await testerApprobation(premiereDemande.id_utilisateur);
  }
  
  console.log("\n📊 === RÉSUMÉ DU TEST ===");
  console.log("✅ Authentification admin vérifiée");
  console.log("🧪 Workflow de gestion des demandes testé");
  console.log("💡 Consultez les logs ci-dessus pour identifier les endpoints manquants");
}

// Test rapide de connectivité
async function testRapideAdmin() {
  console.log("⚡ === TEST RAPIDE ADMIN ===");
  
  const token = obtenirTokenAdmin();
  if (!token) return;
  
  const demandes = await testerListeDemandes();
  
  if (demandes !== undefined) {
    console.log("✅ API admin accessible");
    console.log(`📊 ${demandes.length} demande(s) en attente`);
  } else {
    console.log("❌ Problème avec l'API admin");
    console.log("🔧 Vérifiez que:");
    console.log("   1. Le serveur backend est démarré sur le port 4000");
    console.log("   2. Vous êtes connecté en tant qu'admin");
    console.log("   3. Les endpoints admin sont implémentés");
  }
}

// Instructions d'utilisation
console.log(`
🔧 === SCRIPT DE TEST APIs ADMIN DEMANDES ===

Fonctions disponibles:
- testWorkflowComplet()     : Test complet du workflow admin
- testRapideAdmin()         : Test rapide de connectivité
- testerListeDemandes()     : Lister les demandes en attente
- testerApprobation(id)     : Approuver une demande
- testerRefus(id, motif)    : Refuser une demande
- creerDemandeTest()        : Créer une demande de test

Usage:
1. Connectez-vous en tant qu'admin
2. Copiez ce script dans la console
3. Exécutez: testWorkflowComplet() pour un test complet
4. Ou: testRapideAdmin() pour un test rapide

IMPORTANT: Vous devez être connecté avec un compte admin !

Ce script vous aidera à identifier quels endpoints admin sont manquants :
- GET /api/admin/demandes-en-attente
- POST /api/admin/approuver/:id  
- POST /api/admin/refuser/:id
`);