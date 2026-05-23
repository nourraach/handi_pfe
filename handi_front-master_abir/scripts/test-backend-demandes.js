// Script pour tester et diagnostiquer le backend des demandes admin
const API_BASE_URL = 'http://localhost:4000';

async function testerBackendDemandes() {
  console.log('🔍 Test complet du backend demandes admin\n');
  
  // 1. Tester l'authentification admin
  console.log('1️⃣ Test de l\'authentification admin...');
  try {
    const loginResponse = await fetch(`${API_BASE_URL}/auth/connexion`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@test.com',
        mot_de_passe: 'AdminTest123!'
      })
    });

    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      console.log('✅ Connexion admin réussie');
      console.log('🔑 Token reçu:', loginData.token ? 'Oui' : 'Non');
      
      if (loginData.token) {
        // 2. Tester l'API des demandes avec le vrai token
        console.log('\n2️⃣ Test de l\'API demandes avec token valide...');
        await testerAPIDemandes(loginData.token);
      }
    } else {
      console.log('❌ Échec de la connexion admin:', await loginResponse.text());
    }
  } catch (error) {
    console.log('💥 Erreur de connexion admin:', error.message);
  }

  // 3. Tester avec le token du localStorage (celui utilisé par le frontend)
  console.log('\n3️⃣ Test avec le token du localStorage...');
  const frontendToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZF91dGlsaXNhdGV1ciI6ImFkbWluXzEiLCJlbWFpbCI6ImFkbWluQGV4YW1wbGUuY29tIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzM3NTU5MzI4LCJleHAiOjE3Mzc1NjI5Mjh9.example';
  await testerAPIDemandes(frontendToken);

  // 4. Tester les endpoints d'approbation/refus
  console.log('\n4️⃣ Test des endpoints d\'action...');
  await testerEndpointsAction(frontendToken);
}

async function testerAPIDemandes(token) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/demandes-en-attente`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('📊 Status:', response.status);
    console.log('📊 Headers:', Object.fromEntries(response.headers.entries()));

    if (response.ok) {
      const data = await response.json();
      console.log('📦 Réponse complète:', JSON.stringify(data, null, 2));
      
      if (data.donnees && data.donnees.demandes) {
        console.log(`📋 Nombre de demandes: ${data.donnees.demandes.length}`);
        
        if (data.donnees.demandes.length === 0) {
          console.log('⚠️ PROBLÈME: Aucune demande trouvée');
          console.log('💡 Solutions possibles:');
          console.log('   - Vérifier la requête SQL côté backend');
          console.log('   - Injecter des données de test avec statut "en_attente"');
          console.log('   - Vérifier la table utilisateurs dans la base de données');
        } else {
          console.log('✅ Demandes trouvées:');
          data.donnees.demandes.forEach((demande, i) => {
            console.log(`   ${i+1}. ${demande.nom} (${demande.email}) - ${demande.statut}`);
          });
        }
      }
    } else {
      const errorText = await response.text();
      console.log('❌ Erreur API:', errorText);
    }
  } catch (error) {
    console.log('💥 Erreur de connexion:', error.message);
  }
}

async function testerEndpointsAction(token) {
  // Test des endpoints d'approbation et de refus
  const testUserId = 'test_user_123';
  
  console.log('🔄 Test endpoint approbation...');
  try {
    const approveResponse = await fetch(`${API_BASE_URL}/api/admin/approuver/${testUserId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📊 Approbation - Status:', approveResponse.status);
    if (!approveResponse.ok) {
      console.log('📄 Approbation - Erreur:', await approveResponse.text());
    }
  } catch (error) {
    console.log('💥 Erreur approbation:', error.message);
  }

  console.log('🔄 Test endpoint refus...');
  try {
    const rejectResponse = await fetch(`${API_BASE_URL}/api/admin/refuser/${testUserId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📊 Refus - Status:', rejectResponse.status);
    if (!rejectResponse.ok) {
      console.log('📄 Refus - Erreur:', await rejectResponse.text());
    }
  } catch (error) {
    console.log('💥 Erreur refus:', error.message);
  }
}

// Fonction pour suggérer des solutions
function suggererSolutions() {
  console.log('\n💡 SOLUTIONS RECOMMANDÉES:\n');
  
  console.log('🔧 1. Vérifier la base de données:');
  console.log('   SELECT * FROM utilisateurs WHERE statut = "en_attente";');
  
  console.log('\n🔧 2. Injecter des données de test:');
  console.log('   - Exécuter le script SQL: scripts/insert-demandes-test.sql');
  console.log('   - Ou modifier des utilisateurs existants pour avoir statut "en_attente"');
  
  console.log('\n🔧 3. Vérifier le backend:');
  console.log('   - Vérifier la requête SQL dans le contrôleur admin');
  console.log('   - Vérifier que la table utilisateurs existe');
  console.log('   - Vérifier les logs du serveur backend');
  
  console.log('\n🔧 4. Tester manuellement:');
  console.log('   UPDATE utilisateurs SET statut = "en_attente" WHERE role IN ("candidat", "entreprise") LIMIT 3;');
}

// Exécution
testerBackendDemandes().then(() => {
  suggererSolutions();
}).catch(error => {
  console.error('💥 Erreur générale:', error);
  suggererSolutions();
});