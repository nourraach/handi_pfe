// Script de test pour diagnostiquer le problème d'affichage des offres entreprise
// À exécuter avec: node scripts/test-affichage-offres-entreprise.js

const fetch = require('node-fetch');

async function testerAPIOffresEntreprise() {
  console.log('🔍 TEST API OFFRES ENTREPRISE\n');
  
  try {
    // Token d'exemple (remplacer par un vrai token d'entreprise)
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZF91dGlsaXNhdGV1ciI6ImVudHJlcHJpc2VfMSIsImVtYWlsIjoiZW50cmVwcmlzZUBleGFtcGxlLmNvbSIsInJvbGUiOiJlbnRyZXByaXNlIiwiaWF0IjoxNzM3NTU5MzI4LCJleHAiOjE3Mzc1NjI5Mjh9.example';
    
    console.log('📡 Test de l\'API avec token entreprise...');
    console.log('🔑 Token utilisé:', token.substring(0, 30) + '...');
    
    const response = await fetch('http://localhost:4000/api/entreprise/offres', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📊 Status de la réponse:', response.status);
    console.log('📊 Headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Réponse OK');
      console.log('📦 Structure de la réponse:', {
        message: data.message,
        donnees_present: !!data.donnees,
        offres_present: !!data.donnees?.offres,
        nombre_offres: data.donnees?.offres?.length || 0
      });
      
      if (data.donnees?.offres?.length > 0) {
        console.log('\n📋 Détails des offres:');
        data.donnees.offres.forEach((offre, index) => {
          console.log(`  ${index + 1}. ${offre.titre} (${offre.statut})`);
          console.log(`     📍 ${offre.localisation} • 💼 ${offre.type_poste}`);
          console.log(`     💰 ${offre.salaire_min} - ${offre.salaire_max} €`);
          console.log(`     📅 Créée: ${offre.created_at}`);
          console.log(`     👥 ${offre.candidatures_count} candidatures • 👁️ ${offre.vues_count} vues`);
          console.log('');
        });
      } else {
        console.log('⚠️ Aucune offre trouvée dans la réponse');
      }
      
    } else {
      console.error('❌ Erreur HTTP:', response.status);
      const errorText = await response.text();
      console.log('📄 Détails de l\'erreur:', errorText.substring(0, 200));
    }
    
  } catch (error) {
    console.error('💥 Erreur de connexion:', error.message);
    console.log('⚠️ Vérifiez que le serveur backend est démarré sur localhost:4000');
  }
}

async function testerAPISansToken() {
  console.log('\n🔍 TEST API SANS TOKEN (mode public)\n');
  
  try {
    console.log('📡 Test de l\'API sans authentification...');
    
    const response = await fetch('http://localhost:4000/api/entreprise/offres', {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📊 Status de la réponse:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Réponse OK (mode public)');
      console.log('📦 Nombre d\'offres publiques:', data.donnees?.offres?.length || 0);
      
      if (data.donnees?.offres?.length > 0) {
        console.log('\n📋 Offres publiques:');
        data.donnees.offres.forEach((offre, index) => {
          console.log(`  ${index + 1}. ${offre.titre} (${offre.statut})`);
          console.log(`     🏢 ${offre.nom_entreprise || 'Entreprise'}`);
          console.log(`     📍 ${offre.localisation}`);
        });
      }
      
    } else {
      console.log('⚠️ API ne supporte pas encore le mode public');
    }
    
  } catch (error) {
    console.error('💥 Erreur:', error.message);
  }
}

async function testerAPIOffresPubliques() {
  console.log('\n🔍 TEST API OFFRES PUBLIQUES\n');
  
  try {
    console.log('📡 Test de l\'API offres publiques...');
    
    const response = await fetch('http://localhost:4000/api/offres/publiques', {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📊 Status de la réponse:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API offres publiques implémentée');
      console.log('📦 Nombre d\'offres:', data.donnees?.offres?.length || 0);
    } else if (response.status === 404) {
      console.log('⚠️ API offres publiques non implémentée (404)');
    } else {
      console.log('❌ Erreur API offres publiques:', response.status);
    }
    
  } catch (error) {
    console.error('💥 Erreur:', error.message);
  }
}

// Fonction principale
async function main() {
  console.log('🚀 DIAGNOSTIC COMPLET DES APIS OFFRES\n');
  console.log('=' .repeat(50));
  
  await testerAPIOffresEntreprise();
  await testerAPISansToken();
  await testerAPIOffresPubliques();
  
  console.log('\n' + '='.repeat(50));
  console.log('🎯 RÉSUMÉ DU DIAGNOSTIC');
  console.log('');
  console.log('Si l\'API entreprise retourne des données mais que la page');
  console.log('ne les affiche pas, le problème est côté frontend React.');
  console.log('');
  console.log('📋 Actions recommandées:');
  console.log('1. Vérifier la console du navigateur sur /entreprise/offres');
  console.log('2. Inspecter l\'état React avec les DevTools');
  console.log('3. Vérifier les conditions de rendu dans le composant');
  console.log('4. Tester avec un utilisateur entreprise connecté');
}

// Exécution
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testerAPIOffresEntreprise, testerAPISansToken, testerAPIOffresPubliques };