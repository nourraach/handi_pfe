import "dotenv/config";

const BASE_URL = "http://localhost:4000/api";

async function creerTestExemple() {
  try {
    // Connexion admin
    const adminLogin = await fetch(`${BASE_URL}/auth/connexion`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "admin@handitalents.com",
        mdp: "Admin123!"
      })
    });

    const adminData = await adminLogin.json();
    const adminToken = adminData.donnees.token;
    const adminHeaders = {
      "Authorization": `Bearer ${adminToken}`,
      "Content-Type": "application/json"
    };

    console.log("✅ Admin connecté");

    // Créer un test simple
    const nouveauTest = {
      titre: "Test de Communication",
      description: "Évaluation des compétences en communication",
      type_test: "soft_skills",
      duree_minutes: 20,
      date_debut_validite: new Date().toISOString(),
      date_fin_validite: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      instructions: "Répondez honnêtement à toutes les questions.",
      questions: [
        {
          contenu_question: "Comment préférez-vous communiquer en équipe ?",
          type_question: "choix_multiple",
          score_question: 10,
          ordre: 1,
          obligatoire: true,
          options: [
            {
              texte_option: "Par email uniquement",
              est_correcte: false,
              score_option: 3,
              ordre: 1
            },
            {
              texte_option: "En face à face et par email",
              est_correcte: true,
              score_option: 10,
              ordre: 2
            },
            {
              texte_option: "Par téléphone seulement",
              est_correcte: false,
              score_option: 5,
              ordre: 3
            }
          ]
        },
        {
          contenu_question: "Êtes-vous à l'aise pour présenter devant un groupe ?",
          type_question: "vrai_faux",
          score_question: 5,
          ordre: 2,
          obligatoire: true,
          options: [
            {
              texte_option: "Vrai",
              est_correcte: true,
              score_option: 5,
              ordre: 1
            },
            {
              texte_option: "Faux",
              est_correcte: false,
              score_option: 0,
              ordre: 2
            }
          ]
        }
      ]
    };

    const response = await fetch(`${BASE_URL}/tests-psychologiques/admin/tests`, {
      method: "POST",
      headers: adminHeaders,
      body: JSON.stringify(nouveauTest)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`HTTP ${response.status}: ${errorData.message}`);
    }

    const testCree = await response.json();
    console.log("✅ Test créé avec succès!");
    console.log(`   ID: ${testCree.donnees.id_test}`);
    console.log(`   Score total: ${testCree.donnees.score_total}`);
    console.log(`   Questions: ${testCree.donnees.nombre_questions}`);

    return testCree.donnees.id_test;

  } catch (error) {
    console.error("❌ Erreur:", error);
    throw error;
  }
}

if (require.main === module) {
  creerTestExemple().catch(console.error);
}