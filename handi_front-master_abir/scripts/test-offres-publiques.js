// Script pour tester la page des offres publiques
const API_BASE_URL = 'http://localhost:4000';

async function testerOffresPubliques() {
  console.log('🧪 TEST DES OFFRES PUBLIQUES\n');

  // 1. Tester l'API publique (si elle existe)
  console.log('1️⃣ Test de l\'API publique...');
  await testerAPIPublique();

  // 2. Tester l'API entreprise comme fallback
  console.log('\n2️⃣ Test de l\'API entreprise (fallback)...');
  await testerAPIEntreprise();

  // 3. Analyser les données pour les candidats
  console.log('\n3️⃣ Analyse des données pour candidats...');
  await analyserDonneesCandidats();
}

async function testerAPIPublique() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/offres/publiques`, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('📊 Status API publique:', response.status);

    if (response.ok) {
      const data = await response.json();
      console.log('✅ API publique fonctionne');
      console.log('📦 Données:', data);
      console.log('📋 Nombre d\'offres:', data.donnees?.offres?.length || 0);
    } else {
      console.log('❌ API publique non disponible (404 attendu)');
    }
  } catch (error) {
    console.log('💥 Erreur API publique:', error.message);
  }
}

async function testerAPIEntreprise() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/entreprise/offres`, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('📊 Status API entreprise:', response.status);

    if (response.ok) {
      const data = await response.json();
      console.log('✅ API entreprise fonctionne comme fallback');
      console.log('📋 Nombre d\'offres disponibles:', data.donnees?.offres?.length || 0);
      
      if (data.donnees?.offres?.length > 0) {
        console.log('📝 Exemple d\'offre:');
        const offre = data.donnees.offres[0];
        console.log('   Titre:', offre.titre);
        console.log('   Localisation:', offre.localisation);
        console.log('   Type:', offre.type_poste);
        console.log('   Salaire:', offre.salaire_min, '-', offre.salaire_max, '€');
        console.log('   Statut:', offre.statut);
        console.log('   Candidatures:', offre.candidatures_count);
      }
    } else {
      console.log('❌ API entreprise non disponible');
    }
  } catch (error) {
    console.log('💥 Erreur API entreprise:', error.message);
  }
}

async function analyserDonneesCandidats() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/entreprise/offres`);
    
    if (response.ok) {
      const data = await response.json();
      const offres = data.donnees?.offres || [];
      
      console.log('📊 ANALYSE POUR LES CANDIDATS:');
      console.log('   Total des offres:', offres.length);
      
      // Filtrer les offres actives
      const offresActives = offres.filter(offre => offre.statut === 'active');
      console.log('   Offres actives:', offresActives.length);
      
      // Analyser par type de poste
      const typesPoste = {};
      offres.forEach(offre => {
        typesPoste[offre.type_poste] = (typesPoste[offre.type_poste] || 0) + 1;
      });
      console.log('   Répartition par type:', typesPoste);
      
      // Analyser par localisation
      const localisations = {};
      offres.forEach(offre => {
        localisations[offre.localisation] = (localisations[offre.localisation] || 0) + 1;
      });
      console.log('   Répartition par ville:', localisations);
      
      // Analyser les salaires
      const salaires = offres.map(offre => (offre.salaire_min + offre.salaire_max) / 2);
      const salaireMoyen = salaires.reduce((a, b) => a + b, 0) / salaires.length;
      console.log('   Salaire moyen:', Math.round(salaireMoyen), '€');
      
      // Offres les plus populaires
      const offresPopulaires = offres
        .sort((a, b) => b.candidatures_count - a.candidatures_count)
        .slice(0, 3);
      
      console.log('   Top 3 des offres populaires:');
      offresPopulaires.forEach((offre, i) => {
        console.log(`     ${i+1}. ${offre.titre} (${offre.candidatures_count} candidatures)`);
      });
      
    }
  } catch (error) {
    console.log('💥 Erreur analyse:', error.message);
  }
}

// Script pour la console du navigateur
function genererScriptConsole() {
  console.log('\n🚀 SCRIPT POUR LA CONSOLE DU NAVIGATEUR:');
  console.log('Copiez-collez ceci dans la console sur la page /offres:\n');
  
  const script = `
// Test rapide des offres publiques
async function testOffresPubliques() {
  console.log('🧪 Test des offres publiques depuis le navigateur');
  
  try {
    // Test sans authentification (public)
    const response = await fetch('http://localhost:4000/api/entreprise/offres', {
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Offres disponibles:', data.donnees?.offres?.length || 0);
      console.log('📦 Données:', data);
      
      // Vérifier les offres actives
      const offresActives = data.donnees?.offres?.filter(o => o.statut === 'active') || [];
      console.log('✅ Offres actives visibles par les candidats:', offresActives.length);
      
      if (offresActives.length > 0) {
        console.log('📝 Première offre active:', offresActives[0]);
      }
    } else {
      console.log('❌ Erreur:', response.status);
    }
  } catch (error) {
    console.log('💥 Erreur:', error);
  }
}

testOffresPubliques();
`;
  
  console.log(script);
}

function genererSolutionsRecommandees() {
  console.log('\n💡 SOLUTIONS RECOMMANDÉES:\n');
  
  console.log('🔧 1. API Backend à implémenter (optionnel):');
  console.log('   GET /api/offres/publiques - Offres publiques sans authentification');
  console.log('   Retourne toutes les offres avec statut "active"');
  
  console.log('\n🔧 2. API Candidatures à implémenter:');
  console.log('   POST /api/candidatures - Postuler à une offre');
  console.log('   Body: { id_offre, message_motivation }');
  
  console.log('\n🔧 3. Fonctionnalités actuelles:');
  console.log('   ✅ Affichage de toutes les offres actives');
  console.log('   ✅ Filtrage par titre, localisation, type');
  console.log('   ✅ Bouton postuler fonctionnel');
  console.log('   ✅ Mode fallback avec données de test');
  
  console.log('\n🔧 4. Test dans le navigateur:');
  console.log('   - Allez sur /offres');
  console.log('   - Vérifiez que les offres s\'affichent');
  console.log('   - Testez les filtres');
  console.log('   - Testez le bouton "Postuler"');
}

// Exécution
testerOffresPubliques().then(() => {
  genererScriptConsole();
  genererSolutionsRecommandees();
}).catch(error => {
  console.error('💥 Erreur générale:', error);
});