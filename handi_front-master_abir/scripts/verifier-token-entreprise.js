// Script pour vérifier le token et l'utilisateur entreprise
const API_BASE_URL = 'http://localhost:4000';

async function verifierTokenEntreprise() {
  console.log('🔍 VÉRIFICATION TOKEN ENTREPRISE\n');
  
  // 1. Tester avec différents types de tokens
  const tokens = {
    admin: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZF91dGlsaXNhdGV1ciI6ImFkbWluXzEiLCJlbWFpbCI6ImFkbWluQGV4YW1wbGUuY29tIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzM3NTU5MzI4LCJleHAiOjE3Mzc1NjI5Mjh9.example',
    entreprise: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZF91dGlsaXNhdGV1ciI6ImVudHJlcHJpc2VfMSIsImVtYWlsIjoiZW50cmVwcmlzZUBleGFtcGxlLmNvbSIsInJvbGUiOiJlbnRyZXByaXNlIiwiaWF0IjoxNzM3NTU5MzI4LCJleHAiOjE3Mzc1NjI5Mjh9.example',
    candidat: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZF91dGlsaXNhdGV1ciI6ImNhbmRpZGF0XzEiLCJlbWFpbCI6ImNhbmRpZGF0QGV4YW1wbGUuY29tIiwicm9sZSI6ImNhbmRpZGF0IiwiaWF0IjoxNzM3NTU5MzI4LCJleHAiOjE3Mzc1NjI5Mjh9.example'
  };
  
  for (const [role, token] of Object.entries(tokens)) {
    console.log(`🧪 Test avec token ${role}...`);
    await testerAPIAvecToken(token, role);
    console.log('');
  }
  
  // 2. Analyser la différence de comportement
  console.log('📊 ANALYSE DES RÉSULTATS:');
  console.log('Si l\'API retourne des offres différentes selon le rôle,');
  console.log('cela signifie que le backend filtre les offres par entreprise.');
  console.log('Dans ce cas, l\'utilisateur connecté doit être une entreprise');
  console.log('qui a créé des offres pour les voir.');
}

async function testerAPIAvecToken(token, role) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/entreprise/offres`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`📊 Status pour ${role}:`, response.status);
    
    if (response.ok) {
      const data = await response.json();
      const nombreOffres = data.donnees?.offres?.length || 0;
      console.log(`📋 Nombre d'offres pour ${role}:`, nombreOffres);
      
      if (nombreOffres > 0) {
        console.log(`📝 Première offre:`, data.donnees.offres[0].titre);
      }
    } else {
      const errorText = await response.text();
      console.log(`❌ Erreur pour ${role}:`, response.status, errorText.substring(0, 100));
    }
  } catch (error) {
    console.log(`💥 Erreur de connexion pour ${role}:`, error.message);
  }
}

async function creerUtilisateurEntrepriseTest() {
  console.log('🏗️ Création d\'un utilisateur entreprise de test...');
  
  const entrepriseTest = {
    nom: 'Entreprise Test Diagnostic',
    email: 'entreprise.test@diagnostic.com',
    mot_de_passe: 'TestDiagnostic123!',
    role: 'entreprise',
    statut: 'actif',
    telephone: '0123456789',
    addresse: '123 Rue du Test, Paris'
  };
  
  try {
    // Tenter de créer l'utilisateur (si l'endpoint existe)
    const response = await fetch(`${API_BASE_URL}/auth/inscription`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(entrepriseTest)
    });
    
    console.log('📊 Status création entreprise:', response.status);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Entreprise créée:', result);
      
      // Tenter de se connecter
      const loginResponse = await fetch(`${API_BASE_URL}/auth/connexion`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: entrepriseTest.email,
          mot_de_passe: entrepriseTest.mot_de_passe
        })
      });
      
      if (loginResponse.ok) {
        const loginResult = await loginResponse.json();
        console.log('✅ Connexion réussie, token:', loginResult.token?.substring(0, 30) + '...');
        
        // Tester les offres avec ce nouveau token
        await testerAPIAvecToken(loginResult.token, 'nouvelle_entreprise');
      }
    } else {
      const errorText = await response.text();
      console.log('❌ Erreur création entreprise:', errorText);
    }
  } catch (error) {
    console.log('💥 Erreur:', error.message);
  }
}

function genererSolutionsRecommandees() {
  console.log('\n💡 SOLUTIONS RECOMMANDÉES:\n');
  
  console.log('🔧 1. Vérifier le rôle de l\'utilisateur connecté:');
  console.log('   - Connectez-vous avec un compte entreprise');
  console.log('   - Vérifiez que le statut est "actif"');
  
  console.log('\n🔧 2. Si le backend filtre par entreprise:');
  console.log('   - L\'entreprise connectée doit avoir créé des offres');
  console.log('   - Créez une offre de test pour vérifier');
  
  console.log('\n🔧 3. Vérifier la base de données:');
  console.log('   SELECT * FROM offres_emploi WHERE id_entreprise = \'[ID_ENTREPRISE]\';');
  
  console.log('\n🔧 4. Script de test dans la console du navigateur:');
  console.log(`
// Copiez-collez ceci dans la console sur la page des offres:
const token = localStorage.getItem('token_auth');
fetch('http://localhost:4000/api/entreprise/offres', {
  headers: { 'Authorization': 'Bearer ' + token }
}).then(res => res.json()).then(data => {
  console.log('Offres:', data);
  console.log('Nombre:', data.donnees?.offres?.length || 0);
});
  `);
}

// Exécution
verifierTokenEntreprise().then(() => {
  genererSolutionsRecommandees();
}).catch(error => {
  console.error('💥 Erreur générale:', error);
});