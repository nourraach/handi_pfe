/**
 * Script de diagnostic pour le problème d'activation des comptes entreprise
 * 
 * PROBLÈME: Même après approbation par l'admin, les comptes entreprise
 * ne peuvent toujours pas se connecter et affichent le message
 * "Veuillez activer votre compte via le lien envoyé par email."
 * 
 * Usage:
 * 1. Ouvrir la console du navigateur (F12)
 * 2. Copier-coller ce script
 * 3. Exécuter les fonctions de diagnostic
 */

// Configuration
const API_BASE_URL = 'http://localhost:4000';

// Fonction utilitaire pour construire les URLs
function construireUrlApi(endpoint) {
  return `${API_BASE_URL}${endpoint}`;
}

// Fonction pour récupérer le token d'authentification admin
function obtenirTokenAdmin() {
  const token = localStorage.getItem("token_auth");
  if (!token) {
    console.error("❌ Aucun token d'authentification trouvé");
    console.log("💡 Connectez-vous d'abord en tant qu'admin");
    return null;
  }
  console.log("✅ Token admin trouvé:", token.substring(0, 20) + "...");
  return token;
}

// Test 1: Créer un compte entreprise de test
async function creerCompteEntrepriseTest() {
  console.log("\n🔍 === TEST 1: Création compte entreprise ===");
  
  const donneesEntreprise = {
    nom: "Entreprise Test Activation",
    email: "entreprise.test@activation.com",
    mot_de_passe: "EntrepriseTest123!",
    role: "entreprise",
    statut: "en_attente", // Statut initial
    telephone: "0123456789",
    addresse: "123 Rue de l'Entreprise, 75001 Paris"
  };

  try {
    const response = await fetch(construireUrlApi("/api/auth/inscription"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(donneesEntreprise)
    });

    console.log("📡 Status inscription:", response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log("✅ Compte entreprise créé:", data);
      console.log("📧 Email:", donneesEntreprise.email);
      console.log("🔑 Mot de passe:", donneesEntreprise.mot_de_passe);
      console.log("📊 Statut initial:", donneesEntreprise.statut);
      return data;
    } else {
      const errorText = await response.text();
      console.error("❌ Erreur création compte:", response.status, errorText);
    }
  } catch (error) {
    console.error("❌ Erreur connexion:", error);
  }
}

// Test 2: Lister les utilisateurs en attente
async function listerUtilisateursEnAttente() {
  console.log("\n🔍 === TEST 2: Utilisateurs en attente ===");
  
  const token = obtenirTokenAdmin();
  if (!token) return;

  try {
    const response = await fetch(construireUrlApi("/api/admin/utilisateurs?statut=en_attente"), {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });

    console.log("📡 Status:", response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log("✅ Utilisateurs en attente:", data);
      
      if (data.donnees && data.donnees.utilisateurs) {
        console.log("📊 Nombre d'utilisateurs en attente:", data.donnees.utilisateurs.length);
        
        data.donnees.utilisateurs.forEach((user, index) => {
          console.log(`👤 Utilisateur ${index + 1}:`, {
            id: user.id_utilisateur,
            nom: user.nom,
            email: user.email,
            role: user.role,
            statut: user.statut
          });
        });
        
        return data.donnees.utilisateurs;
      }
    } else {
      const errorText = await response.text();
      console.error("❌ Erreur liste utilisateurs:", response.status, errorText);
    }
  } catch (error) {
    console.error("❌ Erreur connexion:", error);
  }
}

// Test 3: Approuver un compte entreprise
async function approuverCompteEntreprise(idUtilisateur) {
  console.log(`\n🔍 === TEST 3: Approbation compte ${idUtilisateur} ===`);
  
  const token = obtenirTokenAdmin();
  if (!token) return;

  try {
    const response = await fetch(construireUrlApi(`/api/admin/utilisateurs/${idUtilisateur}/statut`), {
      method: "PATCH",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ statut: "actif" })
    });

    console.log("📡 Status approbation:", response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log("✅ Compte approuvé:", data);
      return data;
    } else {
      const errorText = await response.text();
      console.error("❌ Erreur approbation:", response.status, errorText);
    }
  } catch (error) {
    console.error("❌ Erreur connexion:", error);
  }
}

// Test 4: Vérifier le statut après approbation
async function verifierStatutApresApprobation(idUtilisateur) {
  console.log(`\n🔍 === TEST 4: Vérification statut ${idUtilisateur} ===`);
  
  const token = obtenirTokenAdmin();
  if (!token) return;

  try {
    const response = await fetch(construireUrlApi(`/api/admin/utilisateurs/${idUtilisateur}`), {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });

    console.log("📡 Status:", response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log("✅ Détails utilisateur:", data);
      
      if (data.donnees) {
        console.log("📊 Statut actuel:", data.donnees.statut);
        console.log("🔑 Peut se connecter:", data.donnees.statut === 'actif');
        return data.donnees;
      }
    } else {
      const errorText = await response.text();
      console.error("❌ Erreur vérification:", response.status, errorText);
    }
  } catch (error) {
    console.error("❌ Erreur connexion:", error);
  }
}

// Test 5: Tenter une connexion avec le compte entreprise
async function tenterConnexionEntreprise(email, motDePasse) {
  console.log(`\n🔍 === TEST 5: Tentative connexion ${email} ===`);
  
  try {
    const response = await fetch(construireUrlApi("/api/auth/connexion"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ 
        email: email, 
        mdp: motDePasse 
      })
    });

    console.log("📡 Status connexion:", response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log("✅ Connexion réussie:", data);
      
      if (data.donnees && data.donnees.utilisateur) {
        console.log("👤 Utilisateur connecté:", {
          nom: data.donnees.utilisateur.nom,
          email: data.donnees.utilisateur.email,
          role: data.donnees.utilisateur.role,
          statut: data.donnees.utilisateur.statut
        });
      }
      
      return data;
    } else {
      const errorData = await response.json();
      console.error("❌ Erreur connexion:", response.status, errorData);
      console.log("💡 Message d'erreur:", errorData.message);
      
      // Analyser le type d'erreur
      if (errorData.message && errorData.message.includes("activer")) {
        console.log("🔍 PROBLÈME IDENTIFIÉ: Le compte n'est pas considéré comme activé côté backend");
        console.log("🔧 SOLUTION: Vérifier la logique d'activation dans l'API de connexion");
      }
      
      return errorData;
    }
  } catch (error) {
    console.error("❌ Erreur connexion:", error);
  }
}

// Test 6: Diagnostic complet du processus d'activation
async function diagnosticActivationComplete() {
  console.log("🚀 === DIAGNOSTIC COMPLET ACTIVATION ENTREPRISE ===");
  
  // Étape 1: Créer un compte entreprise
  console.log("\n📝 Étape 1: Création du compte entreprise...");
  const compteCreé = await creerCompteEntrepriseTest();
  
  if (!compteCreé || !compteCreé.donnees) {
    console.log("❌ Impossible de continuer - échec création compte");
    return;
  }
  
  const idUtilisateur = compteCreé.donnees.id_utilisateur;
  const email = "entreprise.test@activation.com";
  const motDePasse = "EntrepriseTest123!";
  
  // Étape 2: Vérifier que le compte est en attente
  console.log("\n📋 Étape 2: Vérification statut initial...");
  await verifierStatutApresApprobation(idUtilisateur);
  
  // Étape 3: Tenter une connexion (devrait échouer)
  console.log("\n🚫 Étape 3: Tentative connexion avant approbation...");
  await tenterConnexionEntreprise(email, motDePasse);
  
  // Étape 4: Approuver le compte
  console.log("\n✅ Étape 4: Approbation par l'admin...");
  await approuverCompteEntreprise(idUtilisateur);
  
  // Étape 5: Vérifier le nouveau statut
  console.log("\n🔍 Étape 5: Vérification après approbation...");
  const utilisateurApprouve = await verifierStatutApresApprobation(idUtilisateur);
  
  // Étape 6: Tenter une connexion (devrait réussir)
  console.log("\n🎯 Étape 6: Tentative connexion après approbation...");
  const resultatConnexion = await tenterConnexionEntreprise(email, motDePasse);
  
  // Analyse finale
  console.log("\n📊 === ANALYSE FINALE ===");
  
  if (utilisateurApprouve && utilisateurApprouve.statut === 'actif') {
    console.log("✅ Le statut a bien été changé à 'actif' côté admin");
  } else {
    console.log("❌ Le statut n'a pas été changé correctement");
  }
  
  if (resultatConnexion && resultatConnexion.donnees) {
    console.log("✅ La connexion fonctionne après approbation");
    console.log("🎉 PROBLÈME RÉSOLU: Le processus d'activation fonctionne correctement");
  } else {
    console.log("❌ La connexion échoue même après approbation");
    console.log("🔧 PROBLÈME BACKEND: Vérifier la logique d'activation dans l'API de connexion");
    console.log("💡 Points à vérifier:");
    console.log("   1. L'API de connexion vérifie-t-elle le bon champ de statut?");
    console.log("   2. Y a-t-il une différence entre 'actif' et 'activé'?");
    console.log("   3. L'API de connexion a-t-elle une logique d'activation par email séparée?");
    console.log("   4. Le changement de statut par l'admin met-il à jour tous les champs nécessaires?");
  }
}

// Test rapide avec un compte existant
async function testRapideCompteExistant(email, motDePasse) {
  console.log("⚡ === TEST RAPIDE COMPTE EXISTANT ===");
  console.log(`📧 Email: ${email}`);
  
  // Tenter la connexion
  const resultat = await tenterConnexionEntreprise(email, motDePasse);
  
  if (resultat && resultat.message && resultat.message.includes("activer")) {
    console.log("\n🔍 DIAGNOSTIC:");
    console.log("❌ Le compte existe mais n'est pas considéré comme activé");
    console.log("🔧 SOLUTIONS POSSIBLES:");
    console.log("   1. Vérifier le statut du compte dans la base de données");
    console.log("   2. Vérifier si l'API de connexion utilise le bon champ pour l'activation");
    console.log("   3. Vérifier s'il y a un champ 'email_verifie' ou 'compte_active' séparé");
    console.log("   4. Vérifier la logique d'activation par email vs approbation admin");
  }
}

// Instructions d'utilisation
console.log(`
🔧 === SCRIPT DE DIAGNOSTIC ACTIVATION ENTREPRISE ===

PROBLÈME: Les comptes entreprise ne peuvent pas se connecter même après approbation admin

Fonctions disponibles:
- diagnosticActivationComplete()  : Test complet du processus d'activation
- testRapideCompteExistant(email, mdp) : Test rapide avec un compte existant
- listerUtilisateursEnAttente()   : Voir les comptes en attente
- approuverCompteEntreprise(id)   : Approuver un compte spécifique
- tenterConnexionEntreprise(email, mdp) : Tester une connexion

Usage pour diagnostic complet:
1. Connectez-vous en tant qu'admin
2. Exécutez: diagnosticActivationComplete()
3. Analysez les résultats

Usage pour test rapide:
1. Exécutez: testRapideCompteExistant("entreprise@gmail.com", "motdepasse")
2. Regardez le diagnostic

Le script identifiera si le problème vient du frontend ou du backend.
`);