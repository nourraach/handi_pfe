// Script pour tester et diagnostiquer les APIs de profil candidat
const API_BASE_URL = 'http://localhost:4000';

async function testerProfilCandidat() {
  console.log('🧪 Test complet du profil candidat\n');

  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZF91dGlsaXNhdGV1ciI6ImFkbWluXzEiLCJlbWFpbCI6ImFkbWluQGV4YW1wbGUuY29tIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzM3NTU5MzI4LCJleHAiOjE3Mzc1NjI5Mjh9.example';
  const userId = 'test_candidat_123'; // ID d'exemple

  // 1. Tester le chargement du profil
  console.log('1️⃣ Test de chargement du profil...');
  await testerChargementProfil(userId, token);

  // 2. Tester la sauvegarde du profil
  console.log('\n2️⃣ Test de sauvegarde du profil...');
  await testerSauvegardeProfil(token);

  // 3. Analyser les données utilisateur actuelles
  console.log('\n3️⃣ Analyse des données utilisateur locales...');
  analyserDonneesLocales();
}

async function testerChargementProfil(userId, token) {
  try {
    const url = `${API_BASE_URL}/api/candidats/profil/${userId}`;
    console.log('📡 Tentative de chargement:', url);
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('📊 Status:', response.status);
    console.log('📊 Headers:', Object.fromEntries(response.headers.entries()));

    if (response.ok) {
      const data = await response.json();
      console.log('📦 Données profil reçues:', JSON.stringify(data, null, 2));
    } else {
      const errorText = await response.text();
      console.log('❌ Erreur de chargement:', errorText);
      
      if (response.status === 404) {
        console.log('💡 L\'endpoint de profil candidat n\'existe pas côté backend');
      }
    }
  } catch (error) {
    console.log('💥 Erreur de connexion:', error.message);
  }
}

async function testerSauvegardeProfil(token) {
  const profilTest = {
    nom: 'Jean Dupont Test',
    email: 'jean.test@example.com',
    telephone: '0123456789',
    addresse: '123 Rue de Test, Paris',
    competences: ['JavaScript', 'React', 'Node.js'],
    experience: 'Développeur frontend avec 3 ans d\'expérience',
    formation: 'Master en Informatique',
    handicap: 'Mobilité réduite',
    disponibilite: 'Immédiate',
    salaire_souhaite: '35000€ annuel'
  };

  try {
    const url = `${API_BASE_URL}/api/candidats/profil`;
    console.log('📡 Tentative de sauvegarde:', url);
    console.log('📦 Données à sauvegarder:', JSON.stringify(profilTest, null, 2));
    
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(profilTest)
    });

    console.log('📊 Status:', response.status);

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Sauvegarde réussie:', result);
    } else {
      const errorText = await response.text();
      console.log('❌ Erreur de sauvegarde:', errorText);
      
      if (response.status === 404) {
        console.log('💡 L\'endpoint de sauvegarde profil candidat n\'existe pas côté backend');
      }
    }
  } catch (error) {
    console.log('💥 Erreur de connexion:', error.message);
  }
}

function analyserDonneesLocales() {
  console.log('🔍 Analyse des données localStorage...\n');
  
  // Vérifier les données utilisateur connecté
  const utilisateurData = localStorage.getItem('utilisateur_connecte');
  if (utilisateurData) {
    const utilisateur = JSON.parse(utilisateurData);
    console.log('👤 Utilisateur connecté:');
    console.log('   ID:', utilisateur.id_utilisateur);
    console.log('   Nom:', utilisateur.nom || 'NON RENSEIGNÉ');
    console.log('   Email:', utilisateur.email || 'NON RENSEIGNÉ');
    console.log('   Téléphone:', utilisateur.telephone || 'NON RENSEIGNÉ');
    console.log('   Adresse:', utilisateur.addresse || 'NON RENSEIGNÉ');
    console.log('   Rôle:', utilisateur.role);
    console.log('   Statut:', utilisateur.statut);
    
    // Vérifier s'il y a un profil candidat sauvegardé
    const profilKey = `profil_candidat_${utilisateur.id_utilisateur}`;
    const profilData = localStorage.getItem(profilKey);
    
    if (profilData) {
      const profil = JSON.parse(profilData);
      console.log('\n📋 Profil candidat sauvegardé:');
      console.log('   Compétences:', profil.competences?.length || 0, 'compétences');
      console.log('   Expérience:', profil.experience ? 'Renseignée' : 'NON RENSEIGNÉE');
      console.log('   Formation:', profil.formation ? 'Renseignée' : 'NON RENSEIGNÉE');
      console.log('   Handicap:', profil.handicap ? 'Renseigné' : 'NON RENSEIGNÉ');
      console.log('   Disponibilité:', profil.disponibilite || 'NON RENSEIGNÉE');
      console.log('   Salaire souhaité:', profil.salaire_souhaite || 'NON RENSEIGNÉ');
    } else {
      console.log('\n⚠️ Aucun profil candidat sauvegardé localement');
    }
  } else {
    console.log('❌ Aucun utilisateur connecté trouvé');
  }
}

function genererSolutionsRecommandees() {
  console.log('\n💡 SOLUTIONS RECOMMANDÉES:\n');
  
  console.log('🔧 1. Pour corriger les données manquantes:');
  console.log('   - Connectez-vous et allez sur la page Profil');
  console.log('   - Cliquez sur "Modifier" et remplissez vos informations');
  console.log('   - Les données seront sauvegardées localement');
  
  console.log('\n🔧 2. Pour implémenter les APIs backend:');
  console.log('   GET /api/candidats/profil/:id - Récupérer le profil');
  console.log('   PUT /api/candidats/profil - Mettre à jour le profil');
  
  console.log('\n🔧 3. Structure de données recommandée:');
  console.log(`   {
     "nom": "string",
     "email": "string", 
     "telephone": "string",
     "addresse": "string",
     "competences": ["string"],
     "experience": "string",
     "formation": "string", 
     "handicap": "string",
     "disponibilite": "string",
     "salaire_souhaite": "string"
   }`);
  
  console.log('\n🔧 4. Test rapide dans la console:');
  console.log('   - Allez sur la page Profil');
  console.log('   - Ouvrez la console (F12)');
  console.log('   - Regardez les logs détaillés du chargement/sauvegarde');
}

// Script pour la console du navigateur
function genererScriptConsole() {
  console.log('\n🚀 SCRIPT POUR LA CONSOLE DU NAVIGATEUR:');
  console.log('Copiez-collez ceci dans la console sur la page profil:\n');
  
  const script = `
// Test rapide du profil candidat
function testProfilLocal() {
  const utilisateur = JSON.parse(localStorage.getItem('utilisateur_connecte') || '{}');
  console.log('👤 Utilisateur:', utilisateur);
  
  const profilKey = 'profil_candidat_' + utilisateur.id_utilisateur;
  const profil = JSON.parse(localStorage.getItem(profilKey) || '{}');
  console.log('📋 Profil:', profil);
  
  // Créer un profil de test
  const profilTest = {
    nom: utilisateur.nom || 'Nom Test',
    email: utilisateur.email || 'test@example.com',
    telephone: '0123456789',
    addresse: '123 Rue de Test, Paris',
    competences: ['JavaScript', 'React'],
    experience: 'Développeur avec expérience',
    formation: 'Formation en informatique',
    handicap: 'Information sur le handicap',
    disponibilite: 'Immédiate',
    salaire_souhaite: '35000€'
  };
  
  localStorage.setItem(profilKey, JSON.stringify(profilTest));
  console.log('✅ Profil de test créé - Actualisez la page');
}

testProfilLocal();
`;
  
  console.log(script);
}

// Exécution
testerProfilCandidat().then(() => {
  genererSolutionsRecommandees();
  genererScriptConsole();
}).catch(error => {
  console.error('💥 Erreur générale:', error);
});