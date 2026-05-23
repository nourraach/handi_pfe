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

async function testerGestionUtilisateurs() {
  const results: TestResult[] = [];
  
  console.log("🚀 Test des API de gestion des utilisateurs (Admin)\n");
  console.log("=" .repeat(70));

  try {
    // 1. Connexion admin
    console.log("\n1️⃣  Connexion admin...");
    const adminLogin = await makeRequest(`${BASE_URL}/auth/connexion`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "admin@handitalents.com",
        mdp: "Admin123!"
      })
    });

    const adminToken = adminLogin.donnees.token;
    const adminHeaders = {
      "Authorization": `Bearer ${adminToken}`,
      "Content-Type": "application/json"
    };
    
    results.push({
      endpoint: "/auth/connexion",
      method: "POST",
      status: "SUCCESS",
      message: "Connexion admin réussie"
    });

    // 2. Lister les utilisateurs
    console.log("2️⃣  Test liste des utilisateurs...");
    const listeUtilisateurs = await makeRequest(`${BASE_URL}/admin/utilisateurs?page=1&limit=5`, {
      method: "GET",
      headers: adminHeaders
    });

    results.push({
      endpoint: "/admin/utilisateurs",
      method: "GET",
      status: "SUCCESS",
      message: `${listeUtilisateurs.donnees.utilisateurs.length} utilisateurs récupérés`,
      data: { total: listeUtilisateurs.donnees.statistiques.total }
    });

    // 3. Créer un nouvel utilisateur
    console.log("3️⃣  Test création d'utilisateur...");
    const nouvelUtilisateur = await makeRequest(`${BASE_URL}/admin/utilisateurs`, {
      method: "POST",
      headers: adminHeaders,
      body: JSON.stringify({
        nom: "Test Utilisateur",
        email: "test.utilisateur@handitalents.com",
        mot_de_passe: "TestPassword123!",
        role: "candidat",
        statut: "actif",
        telephone: "12345678",
        addresse: "123 Rue Test, Tunis"
      })
    });

    const nouvelUserId = nouvelUtilisateur.donnees.id_utilisateur;

    results.push({
      endpoint: "/admin/utilisateurs",
      method: "POST",
      status: "SUCCESS",
      message: "Utilisateur créé avec succès",
      data: { id: nouvelUserId }
    });

    // 4. Récupérer l'utilisateur créé
    console.log("4️⃣  Test récupération utilisateur spécifique...");
    const utilisateurDetail = await makeRequest(`${BASE_URL}/admin/utilisateurs/${nouvelUserId}`, {
      method: "GET",
      headers: adminHeaders
    });

    results.push({
      endpoint: `/admin/utilisateurs/${nouvelUserId}`,
      method: "GET",
      status: "SUCCESS",
      message: "Utilisateur récupéré avec succès",
      data: { nom: utilisateurDetail.donnees.nom }
    });

    // 5. Modifier l'utilisateur
    console.log("5️⃣  Test modification d'utilisateur...");
    const utilisateurModifie = await makeRequest(`${BASE_URL}/admin/utilisateurs/${nouvelUserId}`, {
      method: "PUT",
      headers: adminHeaders,
      body: JSON.stringify({
        nom: "Test Utilisateur Modifié",
        telephone: "87654321"
      })
    });

    results.push({
      endpoint: `/admin/utilisateurs/${nouvelUserId}`,
      method: "PUT",
      status: "SUCCESS",
      message: "Utilisateur modifié avec succès"
    });

    // 6. Changer le statut
    console.log("6️⃣  Test changement de statut...");
    const statutChange = await makeRequest(`${BASE_URL}/admin/utilisateurs/${nouvelUserId}/statut`, {
      method: "PATCH",
      headers: adminHeaders,
      body: JSON.stringify({
        statut: "suspendu"
      })
    });

    results.push({
      endpoint: `/admin/utilisateurs/${nouvelUserId}/statut`,
      method: "PATCH",
      status: "SUCCESS",
      message: "Statut modifié avec succès",
      data: { 
        ancien: statutChange.donnees.ancien_statut,
        nouveau: statutChange.donnees.nouveau_statut
      }
    });

    // 7. Réinitialiser le mot de passe
    console.log("7️⃣  Test réinitialisation mot de passe...");
    const resetPassword = await makeRequest(`${BASE_URL}/admin/utilisateurs/${nouvelUserId}/reset-password`, {
      method: "POST",
      headers: adminHeaders
    });

    results.push({
      endpoint: `/admin/utilisateurs/${nouvelUserId}/reset-password`,
      method: "POST",
      status: "SUCCESS",
      message: "Mot de passe réinitialisé",
      data: { nouveauMdp: resetPassword.donnees.nouveauMotDePasse }
    });

    // 8. Obtenir les statistiques
    console.log("8️⃣  Test statistiques...");
    const statistiques = await makeRequest(`${BASE_URL}/admin/utilisateurs/statistiques`, {
      method: "GET",
      headers: adminHeaders
    });

    results.push({
      endpoint: "/admin/utilisateurs/statistiques",
      method: "GET",
      status: "SUCCESS",
      message: "Statistiques récupérées",
      data: { total: statistiques.donnees.total_utilisateurs }
    });

    // 9. Recherche avancée
    console.log("9️⃣  Test recherche avancée...");
    const rechercheAvancee = await makeRequest(`${BASE_URL}/admin/utilisateurs/recherche`, {
      method: "POST",
      headers: adminHeaders,
      body: JSON.stringify({
        criteres: {
          role: ["candidat"],
          statut: ["actif", "suspendu"]
        },
        tri: {
          champ: "created_at",
          ordre: "desc"
        },
        pagination: {
          page: 1,
          limit: 10
        }
      })
    });

    results.push({
      endpoint: "/admin/utilisateurs/recherche",
      method: "POST",
      status: "SUCCESS",
      message: "Recherche avancée effectuée",
      data: { resultats: rechercheAvancee.donnees.utilisateurs.length }
    });

    // 10. Historique des actions
    console.log("🔟 Test historique des actions...");
    const historique = await makeRequest(`${BASE_URL}/admin/utilisateurs/${nouvelUserId}/historique`, {
      method: "GET",
      headers: adminHeaders
    });

    results.push({
      endpoint: `/admin/utilisateurs/${nouvelUserId}/historique`,
      method: "GET",
      status: "SUCCESS",
      message: "Historique récupéré",
      data: { actions: historique.donnees.actions.length }
    });

    // 11. Export CSV (test de l'endpoint)
    console.log("1️⃣1️⃣ Test export CSV...");
    const exportResponse = await fetch(`${BASE_URL}/admin/utilisateurs/export?format=csv&role=candidat`, {
      method: "GET",
      headers: adminHeaders
    });

    if (exportResponse.ok) {
      const csvContent = await exportResponse.text();
      results.push({
        endpoint: "/admin/utilisateurs/export",
        method: "GET",
        status: "SUCCESS",
        message: "Export CSV généré",
        data: { lignes: csvContent.split('\n').length }
      });
    }

    // 12. Supprimer l'utilisateur de test
    console.log("1️⃣2️⃣ Test suppression d'utilisateur...");
    const suppressionUtilisateur = await makeRequest(`${BASE_URL}/admin/utilisateurs/${nouvelUserId}`, {
      method: "DELETE",
      headers: adminHeaders
    });

    results.push({
      endpoint: `/admin/utilisateurs/${nouvelUserId}`,
      method: "DELETE",
      status: "SUCCESS",
      message: "Utilisateur supprimé avec succès"
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
  console.log("\n" + "=" .repeat(70));
  console.log("📊 RÉSULTATS DES TESTS - GESTION UTILISATEURS");
  console.log("=" .repeat(70));

  results.forEach((result, index) => {
    const status = result.status === "SUCCESS" ? "✅" : "❌";
    console.log(`${status} ${index + 1}. ${result.method} ${result.endpoint}`);
    console.log(`   ${result.message}`);
    if (result.data) {
      console.log(`   Données: ${JSON.stringify(result.data)}`);
    }
    console.log("");
  });

  const successCount = results.filter(r => r.status === "SUCCESS").length;
  const totalCount = results.length;

  console.log("=" .repeat(70));
  console.log(`🎯 RÉSUMÉ: ${successCount}/${totalCount} tests réussis`);
  console.log("=" .repeat(70));

  if (successCount === totalCount) {
    console.log("🎉 Toutes les API de gestion des utilisateurs fonctionnent correctement !");
  } else {
    console.log("⚠️  Certains tests ont échoué. Vérifiez les erreurs ci-dessus.");
  }
}

// Exécuter les tests seulement si ce fichier est exécuté directement
if (require.main === module) {
  testerGestionUtilisateurs().catch(console.error);
}