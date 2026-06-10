// Script de diagnostic pour les offres d'emploi côté frontend
// À exécuter dans la console du navigateur (F12) sur la page /entreprise/offres

async function diagnosticOffres() {
  console.log('🔍 DIAGNOSTIC OFFRES D\'EMPLOI FRONTEND\n');
  
  // 1. Vérifier l'utilisateur connecté
  console.log('1️⃣ Vérification de l\'utilisateur connecté...');
  const utilisateurData = localStorage.getItem('utilisateur_connecte');
  const token = localStorage.getItem('token_auth');
  
  if (!utilisateurData) {
    console.error('❌ Aucun utilisateur connecté trouvé');
    return;
  }
  
  if (!token) {
    console.error('❌ Aucun token d\'authentification trouvé');
    return;
  }
  
  const utilisateur = JSON.parse(utilisateurData);
  console.log('👤 Utilisateur:', utilisateur.nom, '(' + utilisateur.role + ')');
  console.log('🔑 Token:', token.substring(0, 30) + '...');
  
  if (utilisateur.role !== 'entreprise') {
    console.warn('⚠️ L\'utilisateur n\'est pas une entreprise, cela peut expliquer pourquoi les offres ne s\'affichent pas');
  }
  
  // 2. Tester l'API directement
  console.log('\n2️⃣ Test direct de l\'API...');
  try {
    const response = await fetch('http://localhost:4000/api/entreprise/offres', {
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📊 Status de la réponse:', response.status);
    console.log('📊 Headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      const data = await response.json();
      console.log('📦 Données reçues:', data);
      
      if (data.donnees && data.donnees.offres) {
        console.log('✅ API fonctionne - Nombre d\'offres:', data.donnees.offres.length);
        console.log('📋 Offres:');
        data.donnees.offres.forEach((offre, i) => {
          console.log('   ' + (i+1) + '. ' + offre.titre + ' (' + offre.localisation + ')');
        });
      } else {
        console.log('⚠️ Structure de données inattendue');
      }
    } else {
      const errorText = await response.text();
      console.error('❌ Erreur API:', response.status, errorText);
    }
  } catch (error) {
    console.error('💥 Erreur de connexion:', error);
  }
  
  // 3. Vérifier les données localStorage
  console.log('\n3️⃣ Vérification des données localStorage...');
  const offresTest = localStorage.getItem('offres_test');
  if (offresTest) {
    const offres = JSON.parse(offresTest);
    console.log('💾 Offres de test dans localStorage:', offres.length, 'offres');
  } else {
    console.log('💾 Aucune offre de test dans localStorage');
  }
  
  // 4. Vérifier l'état de la page
  console.log('\n4️⃣ Vérification de l\'état de la page...');
  
  // Vérifier si on est sur la bonne page
  if (window.location.pathname.includes('/entreprise/offres')) {
    console.log('✅ Sur la page des offres d\'entreprise');
  } else {
    console.log('⚠️ Pas sur la page des offres d\'entreprise:', window.location.pathname);
  }
  
  // Vérifier les éléments DOM
  const tableauOffres = document.querySelector('table');
  if (tableauOffres) {
    const lignes = tableauOffres.querySelectorAll('tbody tr');
    console.log('📋 Nombre de lignes dans le tableau:', lignes.length);
    
    if (lignes.length === 1) {
      const texte = lignes[0].textContent;
      if (texte.includes('Aucune offre')) {
        console.log('⚠️ Le tableau affiche "Aucune offre trouvée"');
      }
    }
  } else {
    console.log('❌ Aucun tableau d\'offres trouvé sur la page');
  }
  
  // 5. Suggestions de solutions
  console.log('\n💡 SUGGESTIONS DE SOLUTIONS:');
  
  if (utilisateur.role !== 'entreprise') {
    console.log('🔧 1. Connectez-vous avec un compte entreprise');
  }
  
  console.log('🔧 2. Actualisez la page (F5)');
  console.log('🔧 3. Ouvrez les outils de développement (F12) et regardez l\'onglet Network');
  console.log('🔧 4. Vérifiez les logs de la console lors du chargement de la page');
  
  // 6. Test de création d'offre
  console.log('\n6️⃣ Test de création d\'offre (optionnel)...');
  console.log('Pour tester la création, exécutez: testCreationOffre()');
}

async function testCreationOffre() {
  console.log('🧪 Test de création d\'offre...');
  
  const token = localStorage.getItem('token_auth');
  const offreTest = {
    titre: 'Test Diagnostic Frontend',
    description: 'Offre créée par le script de diagnostic pour tester la fonctionnalité de création depuis le frontend',
    localisation: 'Test City',
    type_poste: 'CDI',
    salaire_min: '35000',
    salaire_max: '45000',
    competences_requises: 'JavaScript, React',
    experience_requise: '2-3 ans',
    niveau_etude: 'Bac+3'
  };
  
  try {
    const response = await fetch('http://localhost:4000/api/entreprise/offres', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(offreTest)
    });
    
    console.log('📊 Status création:', response.status);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Offre créée avec succès:', result);
      console.log('🔄 Rechargez la page pour voir la nouvelle offre');
    } else {
      const errorText = await response.text();
      console.error('❌ Erreur de création:', errorText);
    }
  } catch (error) {
    console.error('💥 Erreur de connexion:', error);
  }
}

function nettoyerDonneesTest() {
  localStorage.removeItem('offres_test');
  console.log('🧹 Données de test supprimées');
}

// Instructions
console.log('📋 INSTRUCTIONS:');
console.log('1. Allez sur la page /entreprise/offres');
console.log('2. Ouvrez la console (F12)');
console.log('3. Exécutez: diagnosticOffres()');
console.log('4. Optionnel: testCreationOffre()');
console.log('5. Optionnel: nettoyerDonneesTest()');

// Auto-exécution si dans le navigateur
if (typeof window !== 'undefined') {
  console.log('🚀 Exécution automatique du diagnostic...');
  diagnosticOffres();
}