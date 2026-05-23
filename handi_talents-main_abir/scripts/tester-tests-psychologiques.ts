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
    throw new Error(`HTTP ${response.status}: ${(data as any).message || 'Erreur inconnue'}`);
  }
  
  return data;
}

async function testerTestsPsychologiques() {
  const results: TestResult[] = [];
  
  console.log("🧠 Test des API de tests psychologiques\n");
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

    // 2. Créer un test psychologique
    console.log("2️⃣  Test création d'un test psychologique...");
    const nouveauTest = {
      titre: "Test de Soft Skills - Communication",
      description: "Évaluation des compétences en communication et travail d'équipe",
      type_test: "soft_skills",
      duree_minutes: 30,
      date_debut_validite: new Date().toISOString(),
      date_fin_validite: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 jours
      instructions: "Répondez honnêtement à toutes les questions. Il n'y a pas de bonnes ou mauvaises réponses.",
      questions: [
        {
          contenu_question: "Comment réagissez-vous face à un conflit dans votre équipe ?",
          type_question: "choix_multiple",
          score_question: 10,
          ordre: 1,
          obligatoire: true,
          options: [
            {
              texte_option: "J'évite le conflit et j'attends qu'il se résolve",
              est_correcte: false,
              score_option: 2,
              ordre: 1
            },
            {
              texte_option: "J'organise une réunion pour discuter du problème",
              est_correcte: true,
              score_option: 10,
              ordre: 2
            },
            {
              texte_option: "Je prends parti pour l'une des parties",
              est_correcte: false,
              score_option: 1,
              ordre: 3
            },
            {
              texte_option: "J'écoute toutes les parties et propose une solution",
              est_correcte: true,
              score_option: 8,
              ordre: 4
            }
          ]
        },
        {
          contenu_question: "Êtes-vous à l'aise pour parler en public ?",
          type_question: "echelle_likert",
          score_question: 5,
          ordre: 2,
          obligatoire: true,
          options: [
            { texte_option: "Pas du tout", est_correcte: false, score_option: 1, ordre: 1 },
            { texte_option: "Peu", est_correcte: false, score_option: 2, ordre: 2 },
            { texte_option: "Moyennement", est_correcte: false, score_option: 3, ordre: 3 },
            { texte_option: "Assez", est_correcte: false, score_option: 4, ordre: 4 },
            { texte_option: "Très à l'aise", est_correcte: false, score_option: 5, ordre: 5 }
          ]
        },
        {
          contenu_question: "Décrivez une situation où vous avez dû faire preuve de leadership",
          type_question: "texte_libre",
          score_question: 15,
          ordre: 3,
          obligatoire: false
        }
      ]
    };

    const testCree = await makeRequest(`${BASE_URL}/tests-psychologiques/admin/tests`, {
      method: "POST",
      headers: adminHeaders,
      body: JSON.stringify(nouveauTest)
    });

    const idTest = testCree.donnees.id_test;

    results.push({
      endpoint: "/tests-psychologiques/admin/tests",
      method: "POST",
      status: "SUCCESS",
      message: "Test psychologique créé",
      data: { id: idTest, score_total: testCree.donnees.score_total }
    });

    // 3. Lister les tests
    console.log("3️⃣  Test liste des tests...");
    const listeTests = await makeRequest(`${BASE_URL}/tests-psychologiques/admin/tests?page=1&limit=5`, {
      method: "GET",
      headers: adminHeaders
    });

    results.push({
      endpoint: "/tests-psychologiques/admin/tests",
      method: "GET",
      status: "SUCCESS",
      message: `${listeTests.donnees.tests.length} tests récupérés`
    });

    // 4. Obtenir le test complet
    console.log("4️⃣  Test récupération test complet...");
    const testComplet = await makeRequest(`${BASE_URL}/tests-psychologiques/admin/tests/${idTest}`, {
      method: "GET",
      headers: adminHeaders
    });

    results.push({
      endpoint: `/tests-psychologiques/admin/tests/${idTest}`,
      method: "GET",
      status: "SUCCESS",
      message: "Test complet récupéré",
      data: { questions: testComplet.donnees.questions.length }
    });

    // 5. Connexion candidat
    console.log("5️⃣  Connexion candidat...");
    const candidatLogin = await makeRequest(`${BASE_URL}/auth/connexion`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "candidat@handitalents.com",
        mdp: "Candidat123!"
      })
    });

    const candidatToken = candidatLogin.donnees.token;
    const candidatHeaders = {
      "Authorization": `Bearer ${candidatToken}`,
      "Content-Type": "application/json"
    };

    results.push({
      endpoint: "/auth/connexion",
      method: "POST",
      status: "SUCCESS",
      message: "Connexion candidat réussie"
    });

    // 6. Obtenir les tests disponibles pour le candidat
    console.log("6️⃣  Test récupération tests disponibles...");
    const testsDisponibles = await makeRequest(`${BASE_URL}/tests-psychologiques/candidat/tests-disponibles`, {
      method: "GET",
      headers: candidatHeaders
    });

    results.push({
      endpoint: "/tests-psychologiques/candidat/tests-disponibles",
      method: "GET",
      status: "SUCCESS",
      message: `${testsDisponibles.donnees.tests.length} tests disponibles`,
      data: { peut_passer: testsDisponibles.donnees.tests[0]?.peut_passer }
    });

    // 7. Commencer le test
    console.log("7️⃣  Test commencement du test...");
    const testCommence = await makeRequest(`${BASE_URL}/tests-psychologiques/candidat/tests/${idTest}/commencer`, {
      method: "GET",
      headers: candidatHeaders
    });

    results.push({
      endpoint: `/tests-psychologiques/candidat/tests/${idTest}/commencer`,
      method: "GET",
      status: "SUCCESS",
      message: "Test commencé",
      data: { questions: testCommence.donnees.questions.length }
    });

    // 8. Soumettre les réponses
    console.log("8️⃣  Test soumission des réponses...");
    const reponses = {
      reponses: [
        {
          id_question: testCommence.donnees.questions[0].id_question,
          id_option: testCommence.donnees.questions[0].options[1].id_option // Deuxième option
        },
        {
          id_question: testCommence.donnees.questions[1].id_question,
          id_option: testCommence.donnees.questions[1].options[3].id_option // Quatrième option (Assez)
        },
        {
          id_question: testCommence.donnees.questions[2].id_question,
          reponse_texte: "J'ai dirigé une équipe de 5 personnes lors d'un projet universitaire. J'ai organisé les tâches, motivé l'équipe et nous avons livré le projet en avance."
        }
      ],
      temps_passe_minutes: 25
    };

    const resultatTest = await makeRequest(`${BASE_URL}/tests-psychologiques/candidat/tests/${idTest}/soumettre`, {
      method: "POST",
      headers: candidatHeaders,
      body: JSON.stringify(reponses)
    });

    results.push({
      endpoint: `/tests-psychologiques/candidat/tests/${idTest}/soumettre`,
      method: "POST",
      status: "SUCCESS",
      message: "Test soumis avec succès",
      data: { 
        score: resultatTest.donnees.score_obtenu,
        pourcentage: resultatTest.donnees.pourcentage
      }
    });

    // 9. Obtenir les résultats du candidat
    console.log("9️⃣  Test récupération résultats candidat...");
    const mesResultats = await makeRequest(`${BASE_URL}/tests-psychologiques/candidat/mes-resultats`, {
      method: "GET",
      headers: candidatHeaders
    });

    const idResultat = mesResultats.donnees.resultats[0]?.id_resultat;

    results.push({
      endpoint: "/tests-psychologiques/candidat/mes-resultats",
      method: "GET",
      status: "SUCCESS",
      message: "Résultats candidat récupérés",
      data: { resultats: mesResultats.donnees.resultats.length }
    });

    // 10. Modifier la visibilité du résultat
    console.log("🔟 Test modification visibilité résultat...");
    const visibilite = await makeRequest(`${BASE_URL}/tests-psychologiques/candidat/resultats/${idResultat}/visibilite`, {
      method: "PATCH",
      headers: candidatHeaders,
      body: JSON.stringify({ est_visible: false })
    });

    results.push({
      endpoint: `/tests-psychologiques/candidat/resultats/${idResultat}/visibilite`,
      method: "PATCH",
      status: "SUCCESS",
      message: "Visibilité modifiée",
      data: { visible: visibilite.donnees.est_visible }
    });

    // 11. Obtenir les statistiques du test (admin)
    console.log("1️⃣1️⃣ Test statistiques du test...");
    const statistiques = await makeRequest(`${BASE_URL}/tests-psychologiques/admin/tests/${idTest}/statistiques`, {
      method: "GET",
      headers: adminHeaders
    });

    results.push({
      endpoint: `/tests-psychologiques/admin/tests/${idTest}/statistiques`,
      method: "GET",
      status: "SUCCESS",
      message: "Statistiques récupérées",
      data: { participants: statistiques.donnees.statistiques.nombre_participants }
    });

    // 12. Obtenir tous les résultats du test (admin)
    console.log("1️⃣2️⃣ Test résultats du test (admin)...");
    const resultatsTest = await makeRequest(`${BASE_URL}/tests-psychologiques/admin/tests/${idTest}/resultats`, {
      method: "GET",
      headers: adminHeaders
    });

    results.push({
      endpoint: `/tests-psychologiques/admin/tests/${idTest}/resultats`,
      method: "GET",
      status: "SUCCESS",
      message: "Résultats du test récupérés",
      data: { resultats: resultatsTest.donnees.resultats.length }
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
  console.log("📊 RÉSULTATS DES TESTS - TESTS PSYCHOLOGIQUES");
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
    console.log("🎉 Toutes les API de tests psychologiques fonctionnent correctement !");
    console.log("\n🧠 Fonctionnalités testées :");
    console.log("   • Création de tests par l'admin");
    console.log("   • Gestion des questions et options");
    console.log("   • Passage de tests par les candidats");
    console.log("   • Calcul automatique des scores");
    console.log("   • Gestion de la visibilité des résultats");
    console.log("   • Statistiques pour les admins");
    console.log("   • Contrôle d'accès par rôle");
  } else {
    console.log("⚠️  Certains tests ont échoué. Vérifiez les erreurs ci-dessus.");
  }
}

// Exécuter les tests seulement si ce fichier est exécuté directement
if (require.main === module) {
  testerTestsPsychologiques().catch(console.error);
}