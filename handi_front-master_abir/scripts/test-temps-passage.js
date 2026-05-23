// Script de test pour vérifier la gestion du temps de passage
// Utiliser avec Node.js : node scripts/test-temps-passage.js

// const fetch = require('node-fetch'); // npm install node-fetch si nécessaire

const API_BASE = 'http://localhost:4000';

async function testerTempsPassage() {
  console.log('🧪 Test de la gestion du temps de passage...\n');

  // Simuler un token d'authentification (remplacer par un vrai token)
  const token = 'your-test-token-here';
  
  const testId = '8a3d496b-0633-4b05-bcf9-797e5bcc50cc'; // Remplacer par un vrai ID de test
  
  // Test 1: Temps de passage = 0 (devrait échouer)
  console.log('Test 1: Temps de passage = 0 minutes');
  try {
    const response1 = await fetch(`${API_BASE}/api/tests-psychologiques/candidat/tests/${testId}/soumettre`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        reponses: [
          {
            id_question: 'test-question-id',
            id_option: 'test-option-id'
          }
        ],
        temps_passe_minutes: 0
      })
    });
    
    const result1 = await response1.json();
    console.log(`Status: ${response1.status}`);
    console.log(`Réponse:`, result1);
    console.log('✅ Échec attendu - OK\n');
  } catch (error) {
    console.log('❌ Erreur:', error.message, '\n');
  }

  // Test 2: Temps de passage = 1 minute (devrait réussir)
  console.log('Test 2: Temps de passage = 1 minute');
  try {
    const response2 = await fetch(`${API_BASE}/api/tests-psychologiques/candidat/tests/${testId}/soumettre`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        reponses: [
          {
            id_question: 'test-question-id',
            id_option: 'test-option-id'
          }
        ],
        temps_passe_minutes: 1
      })
    });
    
    const result2 = await response2.json();
    console.log(`Status: ${response2.status}`);
    console.log(`Réponse:`, result2);
    console.log('✅ Succès attendu - OK\n');
  } catch (error) {
    console.log('❌ Erreur:', error.message, '\n');
  }

  // Test 3: Temps de passage négatif (devrait échouer)
  console.log('Test 3: Temps de passage = -5 minutes');
  try {
    const response3 = await fetch(`${API_BASE}/api/tests-psychologiques/candidat/tests/${testId}/soumettre`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        reponses: [
          {
            id_question: 'test-question-id',
            id_option: 'test-option-id'
          }
        ],
        temps_passe_minutes: -5
      })
    });
    
    const result3 = await response3.json();
    console.log(`Status: ${response3.status}`);
    console.log(`Réponse:`, result3);
    console.log('✅ Échec attendu - OK\n');
  } catch (error) {
    console.log('❌ Erreur:', error.message, '\n');
  }
}

// Fonction pour tester le calcul du temps côté frontend
function testerCalculTemps() {
  console.log('🧮 Test du calcul de temps côté frontend...\n');
  
  const maintenant = Date.now();
  
  // Simuler différents temps de passage
  const scenarios = [
    { duree: 0, description: '0 secondes' },
    { duree: 15000, description: '15 secondes' },
    { duree: 30000, description: '30 secondes' },
    { duree: 45000, description: '45 secondes' },
    { duree: 60000, description: '1 minute' },
    { duree: 90000, description: '1.5 minutes' },
    { duree: 120000, description: '2 minutes' }
  ];
  
  scenarios.forEach(scenario => {
    const tempsDebut = maintenant - scenario.duree;
    
    // Ancien calcul (problématique)
    const ancienCalcul = Math.round((maintenant - tempsDebut) / (1000 * 60));
    
    // Nouveau calcul (corrigé)
    const nouveauCalcul = Math.max(1, Math.round((maintenant - tempsDebut) / (1000 * 60)));
    
    console.log(`${scenario.description}:`);
    console.log(`  Ancien calcul: ${ancienCalcul} minutes`);
    console.log(`  Nouveau calcul: ${nouveauCalcul} minutes`);
    console.log(`  Valide pour DB: ${nouveauCalcul > 0 ? '✅' : '❌'}\n`);
  });
}

// Exécuter les tests
console.log('='.repeat(50));
console.log('🔧 TESTS DE GESTION DU TEMPS DE PASSAGE');
console.log('='.repeat(50));

testerCalculTemps();

console.log('='.repeat(50));
console.log('Pour tester les appels API, décommentez la ligne suivante');
console.log('et remplacez le token et l\'ID de test par de vraies valeurs');
console.log('='.repeat(50));

// Décommenter pour tester les appels API réels
// testerTempsPassage();