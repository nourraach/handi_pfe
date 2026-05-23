// Script pour modifier le statut des utilisateurs en "en_attente"
const API_BASE_URL = 'http://localhost:4000';

async function modifierStatutUtilisateurs() {
  console.log('🔧 Modification du statut des utilisateurs en "en_attente"\n');

  // 1. D'abord, vérifier les utilisateurs actuels
  console.log('1️⃣ Vérification des utilisateurs actuels...');
  await verifierUtilisateursActuels();

  console.log('\n📋 INSTRUCTIONS POUR MODIFIER LES DONNÉES:\n');
  
  console.log('🔧 Exécutez cette requête SQL dans votre base de données:');
  console.log('┌─────────────────────────────────────────────────────────────┐');
  console.log('│                    REQUÊTE SQL À EXÉCUTER                   │');
  console.log('├─────────────────────────────────────────────────────────────┤');
  console.log('│ UPDATE utilisateurs                                         │');
  console.log('│ SET statut = "en_attente"                                   │');
  console.log('│ WHERE role IN ("candidat", "entreprise")                    │');
  console.log('│ AND statut = "actif"                                        │');
  console.log('│ LIMIT 3;                                                    │');
  console.log('└─────────────────────────────────────────────────────────────┘');

  console.log('\n🔍 Pour vérifier le résultat:');
  console.log('┌─────────────────────────────────────────────────────────────┐');
  console.log('│ SELECT nom, email, role, statut                             │');
  console.log('│ FROM utilisateurs                                           │');
  console.log('│ WHERE statut = "en_attente";                                │');
  console.log('└─────────────────────────────────────────────────────────────┘');

  console.log('\n📝 Ou utilisez le fichier SQL créé:');
  console.log('   📄 scripts/modifier-statut-en-attente.sql');

  console.log('\n⏱️ Après avoir exécuté la requête:');
  console.log('   1. Actualisez la page admin: /admin/demandes-en-attente');
  console.log('   2. Les demandes devraient apparaître dans le tableau');
  console.log('   3. Testez les boutons Approuver/Refuser');

  // 2. Tester après modification (simulation)
  console.log('\n2️⃣ Test de vérification (à exécuter après la modification SQL)...');
  setTimeout(async () => {
    await testerApresModification();
  }, 2000);
}

async function verifierUtilisateursActuels() {
  try {
    // Simuler une vérification via l'API admin si elle existe
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZF91dGlsaXNhdGV1ciI6ImFkbWluXzEiLCJlbWFpbCI6ImFkbWluQGV4YW1wbGUuY29tIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzM3NTU5MzI4LCJleHAiOjE3Mzc1NjI5Mjh9.example';
    
    const response = await fetch(`${API_BASE_URL}/api/admin/demandes-en-attente`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`📊 Demandes actuelles: ${data.donnees.demandes.length}`);
      
      if (data.donnees.demandes.length === 0) {
        console.log('⚠️ Aucune demande en attente trouvée - modification nécessaire');
      } else {
        console.log('✅ Demandes trouvées:');
        data.donnees.demandes.forEach((demande, i) => {
          console.log(`   ${i+1}. ${demande.nom} (${demande.role})`);
        });
      }
    } else {
      console.log('❌ Impossible de vérifier via l\'API');
    }
  } catch (error) {
    console.log('💥 Erreur de vérification:', error.message);
  }
}

async function testerApresModification() {
  console.log('🔄 Test après modification...');
  
  try {
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZF91dGlsaXNhdGV1ciI6ImFkbWluXzEiLCJlbWFpbCI6ImFkbWluQGV4YW1wbGUuY29tIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzM3NTU5MzI4LCJleHAiOjE3Mzc1NjI5Mjh9.example';
    
    const response = await fetch(`${API_BASE_URL}/api/admin/demandes-en-attente`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`📊 Demandes après modification: ${data.donnees.demandes.length}`);
      
      if (data.donnees.demandes.length > 0) {
        console.log('🎉 SUCCÈS! Demandes trouvées:');
        data.donnees.demandes.forEach((demande, i) => {
          console.log(`   ${i+1}. ${demande.nom} (${demande.email}) - ${demande.role}`);
        });
        console.log('\n✅ L\'interface admin devrait maintenant afficher ces demandes!');
      } else {
        console.log('⚠️ Toujours aucune demande - vérifiez que la requête SQL a été exécutée');
      }
    }
  } catch (error) {
    console.log('💥 Erreur de test:', error.message);
  }
}

// Fonction pour créer un script de test rapide
function creerScriptTestRapide() {
  console.log('\n🚀 SCRIPT DE TEST RAPIDE:');
  console.log('Copiez-collez ceci dans la console de votre navigateur après la modification SQL:\n');
  
  const scriptTest = `
// Test rapide des demandes admin
fetch('http://localhost:4000/api/admin/demandes-en-attente', {
  headers: {
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZF91dGlsaXNhdGV1ciI6ImFkbWluXzEiLCJlbWFpbCI6ImFkbWluQGV4YW1wbGUuY29tIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzM3NTU5MzI4LCJleHAiOjE3Mzc1NjI5Mjh9.example'
  }
})
.then(res => res.json())
.then(data => {
  console.log('🎯 Résultat:', data);
  console.log('📊 Nombre de demandes:', data.donnees.demandes.length);
  if (data.donnees.demandes.length > 0) {
    console.log('✅ SUCCÈS! Demandes trouvées');
    data.donnees.demandes.forEach((d, i) => console.log(\`\${i+1}. \${d.nom} (\${d.role})\`));
  } else {
    console.log('❌ Aucune demande - vérifiez la requête SQL');
  }
});
`;
  
  console.log(scriptTest);
}

// Exécution
modifierStatutUtilisateurs().then(() => {
  creerScriptTestRapide();
}).catch(error => {
  console.error('💥 Erreur:', error);
});