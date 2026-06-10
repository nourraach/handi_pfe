/**
 * Script de diagnostic pour vérifier l'état du backend
 * 
 * Usage:
 * 1. Ouvrir la console du navigateur (F12)
 * 2. Copier-coller ce script
 * 3. Exécuter diagnosticBackend()
 */

// Configuration
const API_BASE_URL = 'http://localhost:4000';

// Test de connectivité de base
async function testerConnectiviteBackend() {
  console.log("\n🔍 === TEST CONNECTIVITÉ BACKEND ===");
  
  try {
    // Test simple de ping
    const response = await fetch(`${API_BASE_URL}/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log("📡 Status ping:", response.status);
    
    if (response.ok) {
      console.log("✅ Serveur backend accessible");
      return true;
    } else {
      console.log("⚠️ Serveur répond mais avec erreur:", response.status);
      return false;
    }
  } catch (error) {
    console.error("❌ Serveur backend inaccessible:", error.message);
    return false;
  }
}

// Test des endpoints d'authentification
async function testerEndpointsAuth() {
  console.log("\n🔍 === TEST ENDPOINTS AUTHENTIFICATION ===");
  
  const endpoints = [
    '/api/auth/connexion',
    '/api/auth/inscription',
    '/api/auth/profil'
  ];
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`📡 ${endpoint}: ${response.status}`);
      
      if (response.status === 401 || response.status === 403) {
        console.log(`✅ ${endpoint} existe (authentification requise)`);
      } else if (response.status === 404) {
        console.log(`❌ ${endpoint} non trouvé`);
      } else {
        console.log(`✅ ${endpoint} accessible`);
      }
    } catch (error) {
      console.log(`❌ ${endpoint} erreur:`, error.message);
    }
  }
}

// Test des endpoints d'offres d'emploi
async function testerEndpointsOffres() {
  console.log("\n🔍 === TEST ENDPOINTS OFFRES D'EMPLOI ===");
  
  const token = localStorage.getItem("token_auth");
  if (!token) {
    console.log("⚠️ Aucun token trouvé - connexion requise pour tester les endpoints protégés");
    return;
  }
  
  const endpoints = [
    { method: 'GET', path: '/api/entreprise/offres' },
    { method: 'POST', path: '/api/entreprise/offres' },
  ];
  
  for (const endpoint of endpoints) {
    try {
      const options = {
        method: endpoint.method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };
      
      if (endpoint.method === 'POST') {
        options.body = JSON.stringify({
          titre: "Test",
          description: "Test de diagnostic - cette offre peut être ignorée",
          localisation: "Test"
        });
      }
      
      const response = await fetch(`${API_BASE_URL}${endpoint.path}`, options);
      
      console.log(`📡 ${endpoint.method} ${endpoint.path}: ${response.status}`);
      
      if (response.status === 200 || response.status === 201) {
        console.log(`✅ ${endpoint.path} fonctionne`);
      } else if (response.status === 404) {
        console.log(`❌ ${endpoint.path} non implémenté`);
      } else if (response.status === 401 || response.status === 403) {
        console.log(`⚠️ ${endpoint.path} problème d'authentification`);
      } else {
        console.log(`⚠️ ${endpoint.path} erreur ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ ${endpoint.method} ${endpoint.path} erreur:`, error.message);
    }
  }
}

// Test de l'utilisateur connecté
async function testerUtilisateurConnecte() {
  console.log("\n🔍 === TEST UTILISATEUR CONNECTÉ ===");
  
  const token = localStorage.getItem("token_auth");
  const utilisateur = localStorage.getItem("utilisateur_connecte");
  
  if (!token) {
    console.log("❌ Aucun token d'authentification trouvé");
    console.log("💡 Vous devez vous connecter d'abord");
    return false;
  }
  
  if (!utilisateur) {
    console.log("❌ Aucune donnée utilisateur trouvée");
    return false;
  }
  
  try {
    const userData = JSON.parse(utilisateur);
    console.log("✅ Utilisateur connecté:", {
      nom: userData.nom,
      email: userData.email,
      role: userData.role
    });
    
    if (userData.role !== 'entreprise') {
      console.log("⚠️ Attention: Vous n'êtes pas connecté en tant qu'entreprise");
      console.log("💡 Les endpoints d'offres d'emploi nécessitent le rôle 'entreprise'");
      return false;
    }
    
    return true;
  } catch (error) {
    console.log("❌ Erreur lors du parsing des données utilisateur:", error);
    return false;
  }
}

// Diagnostic complet
async function diagnosticBackend() {
  console.log("🚀 === DIAGNOSTIC COMPLET BACKEND ===");
  
  // 1. Test de connectivité
  const backendAccessible = await testerConnectiviteBackend();
  
  if (!backendAccessible) {
    console.log("\n❌ === DIAGNOSTIC TERMINÉ - BACKEND INACCESSIBLE ===");
    console.log("🔧 Solutions possibles:");
    console.log("   1. Vérifiez que le serveur backend est démarré");
    console.log("   2. Vérifiez qu'il écoute sur le port 4000");
    console.log("   3. Vérifiez les paramètres CORS");
    console.log("   4. Vérifiez votre pare-feu/antivirus");
    return;
  }
  
  // 2. Test utilisateur connecté
  const utilisateurValide = await testerUtilisateurConnecte();
  
  // 3. Test endpoints d'authentification
  await testerEndpointsAuth();
  
  // 4. Test endpoints d'offres (si utilisateur valide)
  if (utilisateurValide) {
    await testerEndpointsOffres();
  }
  
  console.log("\n📊 === RÉSUMÉ DU DIAGNOSTIC ===");
  
  if (backendAccessible && utilisateurValide) {
    console.log("✅ Backend accessible");
    console.log("✅ Utilisateur connecté correctement");
    console.log("💡 Si les endpoints d'offres retournent 404, ils ne sont pas encore implémentés");
    console.log("🔧 Le frontend fonctionne en mode local en attendant l'implémentation backend");
  } else if (backendAccessible && !utilisateurValide) {
    console.log("✅ Backend accessible");
    console.log("❌ Problème d'authentification");
    console.log("💡 Connectez-vous avec un compte entreprise");
  } else {
    console.log("❌ Backend inaccessible");
    console.log("💡 Le frontend fonctionne en mode hors ligne");
  }
}

// Test rapide
async function testRapide() {
  console.log("⚡ === TEST RAPIDE ===");
  
  const backendOk = await testerConnectiviteBackend();
  const userOk = await testerUtilisateurConnecte();
  
  if (backendOk && userOk) {
    console.log("✅ Tout semble OK - Testez les endpoints d'offres");
  } else if (backendOk) {
    console.log("⚠️ Backend OK mais problème d'authentification");
  } else {
    console.log("❌ Backend inaccessible - Mode hors ligne activé");
  }
}

// Instructions
console.log(`
🔧 === SCRIPT DE DIAGNOSTIC BACKEND ===

Fonctions disponibles:
- diagnosticBackend()     : Diagnostic complet
- testRapide()           : Test rapide de connectivité
- testerConnectiviteBackend() : Test de base du serveur
- testerUtilisateurConnecte() : Vérifier l'authentification
- testerEndpointsOffres() : Tester les APIs d'offres

Usage:
1. Exécutez: diagnosticBackend() pour un diagnostic complet
2. Ou: testRapide() pour un test rapide

Ce script vous aidera à identifier si le problème vient du:
- Serveur backend non démarré
- Endpoints non implémentés  
- Problème d'authentification
- Problème de CORS
`);