// Script pour tester les actions d'approbation/refus avec de vrais IDs
const API_BASE_URL = 'http://localhost:4000';

async function testerActionsAPI() {
  console.log('🧪 Test des actions API admin\n');

  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZF91dGlsaXNhdGV1ciI6ImFkbWluXzEiLCJlbWFpbCI6ImFkbWluQGV4YW1wbGUuY29tIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzM3NTU5MzI4LCJleHAiOjE3Mzc1NjI5Mjh9.example';

  // 1. D'abord récupérer les demandes pour avoir de vrais IDs
  console.log('1️⃣ Récupération des demandes pour obtenir les IDs...');
  
  try {
    const demandesResponse = await fetch(`${API_BASE_URL}/api/admin/demandes-en-attente`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (demandesResponse.ok) {
      const demandesData = await demandesResponse.json();
      console.log('📦 Demandes récupérées:', demandesData);
      
      if (demandesData.donnees && demandesData.donnees.demandes && demandesData.donnees.demandes.length > 0) {
        const demandes = demandesData.donnees.demandes;
        console.log(`📋 ${demandes.length} demande(s) trouvée(s):`);
        
        demandes.forEach((demande, i) => {
          console.log(`   ${i+1}. ID: ${demande.id_utilisateur || demande.id} - ${demande.nom} (${demande.role})`);
        });

        // 2. Tester l'approbation avec le premier ID
        if (demandes.length > 0) {
          const premiereDemande = demandes[0];
          const userId = premiereDemande.id_utilisateur || premiereDemande.id;
          
          console.log(`\n2️⃣ Test d'approbation avec ID: ${userId}`);
          await testerApprobation(userId, token);
        }
      } else {
        console.log('⚠️ Aucune demande trouvée pour tester');
        console.log('💡 Exécutez d\'abord la requête SQL pour créer des demandes en attente');
      }
    } else {
      console.log('❌ Erreur lors de la récupération des demandes:', await demandesResponse.text());
    }
  } catch (error) {
    console.log('💥 Erreur:', error.message);
  }
}

async function testerApprobation(userId, token) {
  try {
    console.log(`📡 Envoi de la requête d'approbation pour ${userId}...`);
    
    const response = await fetch(`${API_BASE_URL}/api/admin/approuver/${userId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('📊 Status de la réponse:', response.status);
    console.log('📊 Headers:', Object.fromEntries(response.headers.entries()));

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Approbation réussie:', result);
    } else {
      const errorText = await response.text();
      console.log('❌ Erreur d\'approbation:', errorText);
      
      // Analyser l'erreur
      if (response.status === 404) {
        console.log('💡 L\'utilisateur n\'existe pas ou n\'est plus en attente');
      } else if (response.status === 500) {
        console.log('💡 Erreur serveur - vérifiez les logs du backend');
      }
    }
  } catch (error) {
    console.log('💥 Erreur de connexion:', error.message);
  }
}

// Script de test rapide pour la console du navigateur
function genererScriptConsole() {
  console.log('\n🚀 SCRIPT POUR LA CONSOLE DU NAVIGATEUR:');
  console.log('Copiez-collez ceci dans la console après avoir des demandes:\n');
  
  const script = `
// Test rapide des actions admin
async function testActions() {
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZF91dGlsaXNhdGV1ciI6ImFkbWluXzEiLCJlbWFpbCI6ImFkbWluQGV4YW1wbGUuY29tIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzM3NTU5MzI4LCJleHAiOjE3Mzc1NjI5Mjh9.example';
  
  // 1. Récupérer les demandes
  const demandes = await fetch('http://localhost:4000/api/admin/demandes-en-attente', {
    headers: { 'Authorization': 'Bearer ' + token }
  }).then(res => res.json());
  
  console.log('📋 Demandes:', demandes);
  
  if (demandes.donnees.demandes.length > 0) {
    const userId = demandes.donnees.demandes[0].id_utilisateur || demandes.donnees.demandes[0].id;
    console.log('🎯 Test avec ID:', userId);
    
    // 2. Tester l'approbation
    const result = await fetch('http://localhost:4000/api/admin/approuver/' + userId, {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + token }
    }).then(res => res.json());
    
    console.log('✅ Résultat:', result);
  } else {
    console.log('⚠️ Aucune demande à tester');
  }
}

testActions();
`;
  
  console.log(script);
}

// Exécution
testerActionsAPI().then(() => {
  genererScriptConsole();
}).catch(error => {
  console.error('💥 Erreur générale:', error);
});