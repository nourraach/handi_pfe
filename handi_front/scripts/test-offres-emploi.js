/**
 * Script de test pour les APIs d'offres d'emploi
 * 
 * Usage:
 * 1. Connectez-vous en tant qu'entreprise
 * 2. Ouvrir la console du navigateur (F12)
 * 3. Copier-coller ce script
 * 4. Exécuter les fonctions de test
 */

// Configuration
const API_BASE_URL = 'http://localhost:4000';

// Fonction pour récupérer le token d'authentification
function obtenirToken() {
  const token = localStorage.getItem("token_auth");
  if (!token) {
    console.error("❌ Aucun token d'authentification trouvé");
    console.log("💡 Connectez-vous d'abord en tant qu'entreprise");
    return null;
  }
  console.log("✅ Token trouvé:", token.substring(0, 20) + "...");
  return token;
}

// Test 1: Lister les offres d'emploi
async function testerListeOffres() {
  console.log("\n🔍 === TEST 1: Liste des offres ===");
  
  const token = obtenirToken();
  if (!token) return;

  try {
    const response = await fetch(`${API_BASE_URL}/api/entreprise/offres`, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });

    console.log("📡 Status:", response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log("✅ Offres récupérées:", data);
      console.log("📊 Nombre d'offres:", data.donnees?.offres?.length || 0);
      return data.donnees?.offres || [];
    } else {
      const errorText = await response.text();
      console.error("❌ Erreur liste offres:", response.status, errorText);
    }
  } catch (error) {
    console.error("❌ Erreur connexion:", error);
  }
}

// Test 2: Créer une offre de test
async function testerCreationOffre() {
  console.log("\n🔍 === TEST 2: Création d'offre ===");
  
  const token = obtenirToken();
  if (!token) return;

  const offreTest = {
    titre: "Développeur Test API",
    description: "Ceci est une offre de test créée via l'API pour vérifier le bon fonctionnement du système. Cette description contient plus de 50 caractères comme requis par la validation.",
    localisation: "Paris",
    type_poste: "CDI",
    salaire_min: 40000,
    salaire_max: 50000,
    date_limite: "2024-06-30",
    competences_requises: "JavaScript, React, Node.js",
    experience_requise: "2-3 ans",
    niveau_etude: "Bac+3"
  };

  try {
    const response = await fetch(`${API_BASE_URL}/api/entreprise/offres`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(offreTest)
    });

    console.log("📡 Status:", response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log("✅ Offre créée:", data);
      return data.donnees;
    } else {
      const errorData = await response.json();
      console.error("❌ Erreur création:", response.status, errorData);
    }
  } catch (error) {
    console.error("❌ Erreur connexion:", error);
  }
}

// Test 3: Modifier le statut d'une offre
async function testerChangementStatut(idOffre, nouveauStatut = 'inactive') {
  console.log(`\n🔍 === TEST 3: Changement statut offre ${idOffre} ===`);
  
  const token = obtenirToken();
  if (!token) return;

  try {
    const response = await fetch(`${API_BASE_URL}/api/entreprise/offres/${idOffre}/statut`, {
      method: "PATCH",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ statut: nouveauStatut })
    });

    console.log("📡 Status:", response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log("✅ Statut modifié:", data);
      return data;
    } else {
      const errorData = await response.json();
      console.error("❌ Erreur changement statut:", response.status, errorData);
    }
  } catch (error) {
    console.error("❌ Erreur connexion:", error);
  }
}

// Test 4: Supprimer une offre
async function testerSuppressionOffre(idOffre) {
  console.log(`\n🔍 === TEST 4: Suppression offre ${idOffre} ===`);
  
  const token = obtenirToken();
  if (!token) return;

  try {
    const response = await fetch(`${API_BASE_URL}/api/entreprise/offres/${idOffre}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });

    console.log("📡 Status:", response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log("✅ Offre supprimée:", data);
      return data;
    } else {
      const errorData = await response.json();
      console.error("❌ Erreur suppression:", response.status, errorData);
    }
  } catch (error) {
    console.error("❌ Erreur connexion:", error);
  }
}

// Test 5: Modifier une offre
async function testerModificationOffre(idOffre) {
  console.log(`\n🔍 === TEST 5: Modification offre ${idOffre} ===`);
  
  const token = obtenirToken();
  if (!token) return;

  const offreModifiee = {
    titre: "Développeur Test API - Modifié",
    description: "Description modifiée via l'API de test. Cette description a été mise à jour pour vérifier le bon fonctionnement de l'endpoint de modification.",
    localisation: "Paris / Télétravail",
    type_poste: "CDI",
    salaire_min: 45000,
    salaire_max: 55000,
    competences_requises: "JavaScript, React, Node.js, TypeScript",
    experience_requise: "3-5 ans",
    niveau_etude: "Bac+3/5"
  };

  try {
    const response = await fetch(`${API_BASE_URL}/api/entreprise/offres/${idOffre}`, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(offreModifiee)
    });

    console.log("📡 Status:", response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log("✅ Offre modifiée:", data);
      return data;
    } else {
      const errorData = await response.json();
      console.error("❌ Erreur modification:", response.status, errorData);
    }
  } catch (error) {
    console.error("❌ Erreur connexion:", error);
  }
}

// Test complet de toutes les APIs
async function testCompletAPIs() {
  console.log("🚀 === TEST COMPLET DES APIs OFFRES D'EMPLOI ===");
  
  // 1. Lister les offres existantes
  console.log("\n📋 Étape 1: Liste initiale des offres");
  const offresInitiales = await testerListeOffres();
  
  // 2. Créer une nouvelle offre
  console.log("\n➕ Étape 2: Création d'une nouvelle offre");
  const nouvelleOffre = await testerCreationOffre();
  
  if (!nouvelleOffre || !nouvelleOffre.id_offre) {
    console.log("❌ Impossible de continuer - échec création offre");
    return;
  }
  
  const idOffre = nouvelleOffre.id_offre;
  console.log(`🆔 ID de l'offre créée: ${idOffre}`);
  
  // 3. Vérifier que l'offre apparaît dans la liste
  console.log("\n📋 Étape 3: Vérification dans la liste");
  const offresApresCreation = await testerListeOffres();
  const offreTrouvee = offresApresCreation?.find(o => o.id_offre === idOffre);
  
  if (offreTrouvee) {
    console.log("✅ Offre trouvée dans la liste après création");
  } else {
    console.log("❌ Offre non trouvée dans la liste");
  }
  
  // 4. Modifier l'offre
  console.log("\n✏️ Étape 4: Modification de l'offre");
  await testerModificationOffre(idOffre);
  
  // 5. Changer le statut
  console.log("\n🔄 Étape 5: Changement de statut");
  await testerChangementStatut(idOffre, 'inactive');
  
  // 6. Réactiver l'offre
  console.log("\n🔄 Étape 6: Réactivation");
  await testerChangementStatut(idOffre, 'active');
  
  // 7. Supprimer l'offre
  console.log("\n🗑️ Étape 7: Suppression de l'offre");
  await testerSuppressionOffre(idOffre);
  
  // 8. Vérifier que l'offre a été supprimée
  console.log("\n📋 Étape 8: Vérification suppression");
  const offresFinales = await testerListeOffres();
  const offreSupprimeeTrouvee = offresFinales?.find(o => o.id_offre === idOffre);
  
  if (!offreSupprimeeTrouvee) {
    console.log("✅ Offre correctement supprimée de la liste");
  } else {
    console.log("❌ Offre encore présente dans la liste");
  }
  
  console.log("\n🎉 === TEST COMPLET TERMINÉ ===");
}

// Test rapide de connectivité
async function testRapideConnectivite() {
  console.log("⚡ === TEST RAPIDE CONNECTIVITÉ ===");
  
  const offres = await testerListeOffres();
  
  if (offres !== undefined) {
    console.log("✅ Backend accessible et fonctionnel");
    console.log(`📊 ${offres.length} offre(s) trouvée(s)`);
  } else {
    console.log("❌ Problème de connectivité avec le backend");
    console.log("🔧 Vérifiez que:");
    console.log("   1. Le serveur backend est démarré sur le port 4000");
    console.log("   2. Vous êtes connecté en tant qu'entreprise");
    console.log("   3. Votre token d'authentification est valide");
  }
}

// Instructions d'utilisation
console.log(`
🔧 === SCRIPT DE TEST APIs OFFRES D'EMPLOI ===

Fonctions disponibles:
- testCompletAPIs()          : Test complet de toutes les APIs
- testRapideConnectivite()   : Test rapide de connectivité
- testerListeOffres()        : Lister les offres
- testerCreationOffre()      : Créer une offre de test
- testerChangementStatut(id, statut) : Changer le statut d'une offre
- testerSuppressionOffre(id) : Supprimer une offre
- testerModificationOffre(id): Modifier une offre

Usage:
1. Connectez-vous en tant qu'entreprise
2. Copiez ce script dans la console
3. Exécutez: testCompletAPIs() pour un test complet
4. Ou: testRapideConnectivite() pour un test rapide

IMPORTANT: Vous devez être connecté avec un compte entreprise !
`);