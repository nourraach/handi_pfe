// Script de debug pour identifier pourquoi les offres ne s'affichent pas
// À exécuter dans la console du navigateur (F12) sur la page /entreprise/offres

function debugAffichageOffres() {
  console.log('🔍 DEBUG AFFICHAGE OFFRES\n');
  
  // 1. Vérifier l'état de la page
  console.log('1️⃣ État de la page...');
  console.log('URL actuelle:', window.location.href);
  console.log('Path:', window.location.pathname);
  
  // 2. Vérifier l'utilisateur connecté
  console.log('\n2️⃣ Utilisateur connecté...');
  const utilisateur = JSON.parse(localStorage.getItem('utilisateur_connecte') || '{}');
  const token = localStorage.getItem('token_auth');
  
  console.log('👤 Utilisateur:', utilisateur);
  console.log('🔑 Token présent:', !!token);
  console.log('🔑 Token (début):', token?.substring(0, 30) + '...');
  
  if (utilisateur.role !== 'entreprise') {
    console.warn('⚠️ PROBLÈME: L\'utilisateur n\'est pas une entreprise!');
    console.log('💡 Solution: Connectez-vous avec un compte entreprise');
  }
  
  // 3. Tester l'API directement
  console.log('\n3️⃣ Test API direct...');
  
  fetch('http://localhost:4000/api/entreprise/offres', {
    headers: {
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'application/json'
    }
  })
  .then(response => {
    console.log('📊 Status API:', response.status);
    return response.json();
  })
  .then(data => {
    console.log('📦 Données API:', data);
    
    if (data.donnees && data.donnees.offres) {
      console.log('📋 Nombre d\'offres API:', data.donnees.offres.length);
      console.log('📝 Offres API:', data.donnees.offres);
      
      // 4. Comparer avec ce qui est affiché sur la page
      console.log('\n4️⃣ Comparaison avec l\'affichage...');
      
      const cartes = document.querySelectorAll('[class*="bg-white rounded-lg shadow-md"]');
      console.log('🎴 Nombre de cartes d\'offres affichées:', cartes.length);
      
      const titres = Array.from(document.querySelectorAll('h3')).map(h3 => h3.textContent);
      console.log('📝 Titres affichés:', titres);
      
      // Vérifier si les données API correspondent à l'affichage
      const titresAPI = data.donnees.offres.map(offre => offre.titre);
      console.log('📝 Titres de l\'API:', titresAPI);
      
      const manquants = titresAPI.filter(titre => !titres.includes(titre));
      if (manquants.length > 0) {
        console.error('❌ PROBLÈME: Ces offres de l\'API ne sont pas affichées:', manquants);
      } else {
        console.log('✅ Toutes les offres de l\'API sont affichées');
      }
      
    } else {
      console.error('❌ PROBLÈME: Structure de données API incorrecte');
    }
  })
  .catch(error => {
    console.error('💥 Erreur API:', error);
  });
  
  // 5. Vérifier les données localStorage
  console.log('\n5️⃣ Données localStorage...');
  const offresTest = localStorage.getItem('offres_test');
  if (offresTest) {
    const offres = JSON.parse(offresTest);
    console.log('💾 Offres de test localStorage:', offres.length, 'offres');
    console.log('💾 Détails:', offres);
  } else {
    console.log('💾 Aucune offre de test dans localStorage');
  }
  
  // 6. Vérifier les erreurs JavaScript
  console.log('\n6️⃣ Vérification des erreurs...');
  
  // Écouter les erreurs
  window.addEventListener('error', function(e) {
    console.error('🚨 Erreur JavaScript détectée:', e.error);
  });
  
  // 7. Forcer le rechargement des données
  console.log('\n7️⃣ Test de rechargement forcé...');
  
  // Simuler un clic sur le bouton actualiser s'il existe
  const boutonActualiser = Array.from(document.querySelectorAll('button')).find(btn => 
    btn.textContent?.includes('Actualiser') || btn.textContent?.includes('Recharger')
  );
  
  if (boutonActualiser) {
    console.log('🔄 Bouton actualiser trouvé, simulation du clic...');
    boutonActualiser.click();
  } else {
    console.log('🔄 Aucun bouton actualiser trouvé');
  }
}

// Fonction pour nettoyer le cache et forcer le rechargement
function nettoyerCacheOffres() {
  console.log('🧹 Nettoyage du cache des offres...');
  
  // Supprimer les données de test
  localStorage.removeItem('offres_test');
  console.log('✅ Données de test supprimées');
  
  // Recharger la page
  console.log('🔄 Rechargement de la page...');
  window.location.reload();
}

// Fonction pour créer des données de test
function creerDonneesTestOffres() {
  console.log('🏗️ Création de données de test...');
  
  const donneesTest = [
    {
      id_offre: 'test_1',
      titre: 'Développeur Frontend Test',
      description: 'Poste de développeur frontend pour tester l\'affichage des offres',
      localisation: 'Paris Test',
      type_poste: 'CDI',
      salaire_min: '40000',
      salaire_max: '50000',
      statut: 'active',
      date_limite: '2024-12-31',
      created_at: '2024-03-01',
      candidatures_count: 5,
      vues_count: 25
    },
    {
      id_offre: 'test_2',
      titre: 'Designer UX Test',
      description: 'Poste de designer UX pour tester l\'affichage des offres',
      localisation: 'Lyon Test',
      type_poste: 'CDI',
      salaire_min: '35000',
      salaire_max: '45000',
      statut: 'inactive',
      date_limite: '2024-11-30',
      created_at: '2024-02-15',
      candidatures_count: 3,
      vues_count: 15
    }
  ];
  
  localStorage.setItem('offres_test', JSON.stringify(donneesTest));
  console.log('✅ Données de test créées:', donneesTest.length, 'offres');
  console.log('🔄 Rechargez la page pour voir les données de test');
}

// Instructions
console.log('📋 INSTRUCTIONS DE DEBUG:');
console.log('1. debugAffichageOffres() - Diagnostic complet');
console.log('2. nettoyerCacheOffres() - Nettoyer le cache et recharger');
console.log('3. creerDonneesTestOffres() - Créer des données de test');

// Auto-exécution
if (typeof window !== 'undefined') {
  console.log('🚀 Lancement du diagnostic automatique...');
  debugAffichageOffres();
}