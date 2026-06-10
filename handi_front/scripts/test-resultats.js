/**
 * Script de test pour diagnostiquer les problèmes de résultats de tests psychologiques
 * 
 * Usage:
 * 1. Ouvrir la console du navigateur (F12)
 * 2. Copier-coller ce script
 * 3. Exécuter les fonctions de test
 */

// Configuration
const API_BASE_URL = 'http://localhost:4000';

// Fonction utilitaire pour construire les URLs
function construireUrlApi(endpoint) {
  return `${API_BASE_URL}${endpoint}`;
}

// Fonction pour récupérer le token d'authentification
function obtenirToken() {
  const token = localStorage.getItem("token_auth");
  if (!token) {
    console.error("❌ Aucun token d'authentification trouvé");
    console.log("💡 Connectez-vous d'abord à l'application");
    return null;
  }
  console.log("✅ Token trouvé:", token.substring(0, 20) + "...");
  return token;
}

// Test 1: Vérifier l'utilisateur connecté
async function verifierUtilisateur() {
  console.log("\n🔍 === TEST 1: Vérification utilisateur ===");
  
  const token = obtenirToken();
  if (!token) return;

  try {
    const response = await fetch(construireUrlApi("/api/auth/profil"), {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log("✅ Utilisateur connecté:", data);
      return data;
    } else {
      console.error("❌ Erreur profil:", response.status, await response.text());
    }
  } catch (error) {
    console.error("❌ Erreur connexion:", error);
  }
}

// Test 2: Tester l'API des tests disponibles (candidat)
async function testerTestsDisponibles() {
  console.log("\n🔍 === TEST 2: Tests disponibles (candidat) ===");
  
  const token = obtenirToken();
  if (!token) return;

  try {
    const response = await fetch(construireUrlApi("/api/tests-psychologiques/candidat/tests-disponibles"), {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });

    console.log("📡 Status:", response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log("✅ Tests disponibles:", data);
      return data;
    } else {
      const errorText = await response.text();
      console.error("❌ Erreur tests disponibles:", response.status, errorText);
    }
  } catch (error) {
    console.error("❌ Erreur connexion:", error);
  }
}

// Test 3: Tester l'API des résultats (candidat)
async function testerResultatsNavigateur() {
  console.log("\n🔍 === TEST 3: Mes résultats (candidat) ===");
  
  const token = obtenirToken();
  if (!token) return;

  try {
    const response = await fetch(construireUrlApi("/api/tests-psychologiques/candidat/mes-resultats"), {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });

    console.log("📡 Status:", response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log("✅ Résultats reçus:", data);
      
      if (data.donnees && data.donnees.resultats) {
        console.log("📊 Nombre de résultats:", data.donnees.resultats.length);
        
        // Analyser les types de données
        data.donnees.resultats.forEach((resultat, index) => {
          console.log(`📋 Résultat ${index + 1}:`, {
            pourcentage: {
              valeur: resultat.pourcentage,
              type: typeof resultat.pourcentage,
              estNombre: !isNaN(parseFloat(resultat.pourcentage))
            },
            score_obtenu: {
              valeur: resultat.score_obtenu,
              type: typeof resultat.score_obtenu,
              estNombre: !isNaN(parseInt(resultat.score_obtenu))
            },
            temps_passe_minutes: {
              valeur: resultat.temps_passe_minutes,
              type: typeof resultat.temps_passe_minutes,
              estNombre: !isNaN(parseInt(resultat.temps_passe_minutes))
            }
          });
        });
      }
      
      return data;
    } else {
      const errorText = await response.text();
      console.error("❌ Erreur résultats:", response.status, errorText);
    }
  } catch (error) {
    console.error("❌ Erreur connexion:", error);
  }
}

// Test 4: Tester l'API des tests admin
async function testerTestsAdmin() {
  console.log("\n🔍 === TEST 4: Tests admin ===");
  
  const token = obtenirToken();
  if (!token) return;

  try {
    const response = await fetch(construireUrlApi("/api/tests-psychologiques/admin/tests"), {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });

    console.log("📡 Status:", response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log("✅ Tests admin:", data);
      return data;
    } else {
      const errorText = await response.text();
      console.error("❌ Erreur tests admin:", response.status, errorText);
    }
  } catch (error) {
    console.error("❌ Erreur connexion:", error);
  }
}

// Test 5: Simuler la soumission d'un test
async function simulerSoumissionTest(idTest = "test-exemple") {
  console.log("\n🔍 === TEST 5: Simulation soumission test ===");
  
  const token = obtenirToken();
  if (!token) return;

  const donneesTest = {
    reponses: [
      {
        id_question: "q1",
        id_option: "opt1"
      }
    ],
    temps_passe_minutes: 5
  };

  try {
    const response = await fetch(construireUrlApi(`/api/tests-psychologiques/candidat/tests/${idTest}/soumettre`), {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(donneesTest)
    });

    console.log("📡 Status:", response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log("✅ Soumission réussie:", data);
      return data;
    } else {
      const errorText = await response.text();
      console.error("❌ Erreur soumission:", response.status, errorText);
    }
  } catch (error) {
    console.error("❌ Erreur connexion:", error);
  }
}

// Fonction principale de diagnostic
async function diagnosticComplet() {
  console.log("🚀 === DIAGNOSTIC COMPLET DES TESTS PSYCHOLOGIQUES ===");
  
  await verifierUtilisateur();
  await testerTestsDisponibles();
  await testerResultatsNavigateur();
  await testerTestsAdmin();
  
  console.log("\n✅ === DIAGNOSTIC TERMINÉ ===");
  console.log("💡 Consultez les logs ci-dessus pour identifier les problèmes");
}

// Fonction de test rapide pour les résultats
async function testRapideResultats() {
  console.log("⚡ === TEST RAPIDE RÉSULTATS ===");
  const resultats = await testerResultatsNavigateur();
  
  if (resultats && resultats.donnees && resultats.donnees.resultats) {
    console.log("✅ API des résultats fonctionne");
    console.log(`📊 ${resultats.donnees.resultats.length} résultat(s) trouvé(s)`);
  } else {
    console.log("❌ Problème avec l'API des résultats");
  }
}

// Instructions d'utilisation
console.log(`
🔧 === SCRIPT DE DIAGNOSTIC TESTS PSYCHOLOGIQUES ===

Fonctions disponibles:
- diagnosticComplet()     : Test complet de tous les endpoints
- testRapideResultats()   : Test rapide des résultats uniquement
- verifierUtilisateur()   : Vérifier l'utilisateur connecté
- testerTestsDisponibles(): Tester l'API des tests disponibles
- testerResultatsNavigateur(): Tester l'API des résultats
- testerTestsAdmin()      : Tester l'API admin des tests

Usage:
1. Copiez ce script dans la console
2. Exécutez: diagnosticComplet()
3. Analysez les résultats

Pour un test rapide: testRapideResultats()
`);