import "dotenv/config";

const BASE_URL = "http://localhost:4000/api";

interface TestResult {
  endpoint: string;
  method: string;
  status: "SUCCESS" | "ERROR";
  message: string;
  data?: any;
}

async function makeRequest(url: string, options: RequestInit): Promise<any> {
  const response = await fetch(url, options);
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${data.message || 'Erreur inconnue'}`);
  }
  
  return data;
}

async function testerAPIProfils() {
  const results: TestResult[] = [];
  
  console.log("🚀 Test des API de profils HandiTalents\n");
  console.log("=" .repeat(60));

  try {
    // 1. Connexion candidat
    console.log("\n1️⃣  Test de connexion candidat...");
    const candidatLogin = await makeRequest(`${BASE_URL}/auth/connexion`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "candidat@handitalents.com",
        mdp: "Candidat123!"
      })
    });

    const candidatToken = candidatLogin.donnees.token;
    const candidatUserId = candidatLogin.donnees.utilisateur.id_utilisateur;
    
    results.push({
      endpoint: "/auth/connexion",
      method: "POST",
      status: "SUCCESS",
      message: "Connexion candidat réussie"
    });

    // 2. Récupération profil candidat
    console.log("2️⃣  Test récupération profil candidat...");
    const profilCandidat = await makeRequest(`${BASE_URL}/candidats/profil/${candidatUserId}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${candidatToken}`,
        "Content-Type": "application/json"
      }
    });

    results.push({
      endpoint: `/candidats/profil/${candidatUserId}`,
      method: "GET",
      status: "SUCCESS",
      message: "Profil candidat récupéré",
      data: profilCandidat.donnees
    });

    // 3. Mise à jour profil candidat
    console.log("3️⃣  Test mise à jour profil candidat...");
    const updateCandidat = await makeRequest(`${BASE_URL}/candidats/profil`, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${candidatToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        nom: "Ahmed Ben Ali",
        telephone: "98765432",
        addresse: "Rue de la République, Sfax",
        competences: ["JavaScript", "React", "Node.js", "TypeScript", "Python"],
        experience: "4 ans d'expérience en développement web full-stack",
        formation: "Master en Informatique - Université de Sfax",
        disponibilite: "Dans 2 semaines",
        salaire_souhaite: "40000€ annuel"
      })
    });

    results.push({
      endpoint: "/candidats/profil",
      method: "PUT",
      status: "SUCCESS",
      message: "Profil candidat mis à jour"
    });

    // 4. Connexion admin
    console.log("4️⃣  Test de connexion admin...");
    const adminLogin = await makeRequest(`${BASE_URL}/auth/connexion`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "admin@handitalents.com",
        mdp: "Admin123!"
      })
    });

    const adminToken = adminLogin.donnees.token;
    const adminUserId = adminLogin.donnees.utilisateur.id_utilisateur;

    results.push({
      endpoint: "/auth/connexion",
      method: "POST",
      status: "SUCCESS",
      message: "Connexion admin réussie"
    });

    // 5. Récupération profil admin
    console.log("5️⃣  Test récupération profil admin...");
    const profilAdmin = await makeRequest(`${BASE_URL}/admin/profil/${adminUserId}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${adminToken}`,
        "Content-Type": "application/json"
      }
    });

    results.push({
      endpoint: `/admin/profil/${adminUserId}`,
      method: "GET",
      status: "SUCCESS",
      message: "Profil admin récupéré",
      data: profilAdmin.donnees
    });

    // 6. Mise à jour profil admin
    console.log("6️⃣  Test mise à jour profil admin...");
    const updateAdmin = await makeRequest(`${BASE_URL}/admin/profil`, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${adminToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        nom: "Administrateur Principal",
        telephone: "71234567",
        addresse: "Avenue Habib Bourguiba, Tunis",
        poste: "Administrateur Système Senior",
        departement: "Informatique / IT",
        permissions: ["Gestion des utilisateurs", "Validation des comptes", "Accès aux statistiques", "Configuration système", "Audit"],
        notifications_email: true,
        notifications_sms: true
      })
    });

    results.push({
      endpoint: "/admin/profil",
      method: "PUT",
      status: "SUCCESS",
      message: "Profil admin mis à jour"
    });

  } catch (error: any) {
    results.push({
      endpoint: "N/A",
      method: "N/A",
      status: "ERROR",
      message: error.message
    });
  }

  // Affichage des résultats
  console.log("\n" + "=" .repeat(60));
  console.log("📊 RÉSULTATS DES TESTS");
  console.log("=" .repeat(60));

  results.forEach((result, index) => {
    const status = result.status === "SUCCESS" ? "✅" : "❌";
    console.log(`${status} ${index + 1}. ${result.method} ${result.endpoint}`);
    console.log(`   ${result.message}`);
    if (result.data) {
      console.log(`   Données: ${Object.keys(result.data).join(", ")}`);
    }
    console.log("");
  });

  const successCount = results.filter(r => r.status === "SUCCESS").length;
  const totalCount = results.length;

  console.log("=" .repeat(60));
  console.log(`🎯 RÉSUMÉ: ${successCount}/${totalCount} tests réussis`);
  console.log("=" .repeat(60));

  if (successCount === totalCount) {
    console.log("🎉 Toutes les API de profils fonctionnent correctement !");
  } else {
    console.log("⚠️  Certains tests ont échoué. Vérifiez les erreurs ci-dessus.");
  }
}

// Exécuter les tests seulement si ce fichier est exécuté directement
if (require.main === module) {
  testerAPIProfils().catch(console.error);
}