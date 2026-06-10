// Script de diagnostic pour vérifier l'authentification
// À exécuter dans la console du navigateur (F12) sur la page /entreprise/offres

function diagnosticAuthentification() {
  console.log('🔍 DIAGNOSTIC AUTHENTIFICATION\n');
  console.log('=' .repeat(50));
  
  // 1. Vérifier les données localStorage
  console.log('1️⃣ Vérification localStorage...');
  
  const token = localStorage.getItem('token_auth');
  const utilisateur = localStorage.getItem('utilisateur_connecte');
  
  console.log('🔑 Token présent:', !!token);
  console.log('🔑 Token valeur:', token ? `${token.substring(0, 30)}...` : 'AUCUN');
  console.log('👤 Utilisateur présent:', !!utilisateur);
  
  if (utilisateur) {
    try {
      const userData = JSON.parse(utilisateur);
      console.log('👤 Données utilisateur:', {
        nom: userData.nom,
        email: userData.email,
        role: userData.role,
        id: userData.id_utilisateur
      });
      
      if (userData.role !== 'entreprise') {
        console.error('❌ PROBLÈME: L\'utilisateur n\'est pas une entreprise!');
        console.log('💡 Solution: Connectez-vous avec un compte entreprise');
        return;
      }
    } catch (e) {
      console.error('❌ PROBLÈME: Données utilisateur corrompues');
      console.log('💡 Solution: Supprimez localStorage et reconnectez-vous');
      return;
    }
  } else {
    console.error('❌ PROBLÈME: Aucun utilisateur connecté');
    console.log('💡 Solution: Connectez-vous d\'abord');
    return;
  }
  
  // 2. Tester l'API avec le token
  console.log('\n2️⃣ Test API avec authentification...');
  
  if (!token || token === 'null') {
    console.error('❌ PROBLÈME: Token manquant ou invalide');
    console.log('💡 Solution: Reconnectez-vous pour obtenir un nouveau token');
    return;
  }
  
  // Test de l'API
  fetch('http://localhost:4000/api/entreprise/offres', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  })
  .then(response => {
    console.log('📊 Status de la réponse:', response.status);
    console.log('📊 Headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.status === 200) {
      console.log('✅ AUTHENTIFICATION RÉUSSIE');
      return response.json();
    } else if (response.status === 401) {
      console.error('❌ PROBLÈME: Token invalide ou expiré (401)');
      console.log('💡 Solution: Reconnectez-vous pour obtenir un nouveau token');
      throw new Error('Token invalide');
    } else if (response.status === 403) {
      console.error('❌ PROBLÈME: Accès interdit (403)');
      console.log('💡 Solution: Vérifiez que vous êtes connecté en tant qu\'entreprise');
      throw new Error('Accès interdit');
    } else {
      console.error('❌ PROBLÈME: Erreur serveur', response.status);
      throw new Error(`Erreur ${response.status}`);
    }
  })
  .then(data => {
    if (data) {
      console.log('📦 Données reçues:', data);
      console.log('📋 Nombre d\'offres:', data.donnees?.offres?.length || 0);
      
      if (data.donnees?.offres?.length > 0) {
        console.log('✅ TOUT FONCTIONNE CORRECTEMENT');
        console.log('📝 Première offre:', data.donnees.offres[0]);
      } else {
        console.log('⚠️ Aucune offre trouvée (normal si vous n\'en avez pas créé)');
      }
    }
  })
  .catch(error => {
    console.error('💥 Erreur de connexion:', error.message);
  });
  
  // 3. Vérifier l'expiration du token
  console.log('\n3️⃣ Vérification expiration token...');
  
  if (token && token !== 'null') {
    try {
      // Décoder le JWT (partie payload)
      const payload = JSON.parse(atob(token.split('.')[1]));
      console.log('🔍 Payload du token:', payload);
      
      const now = Math.floor(Date.now() / 1000);
      const exp = payload.exp;
      
      if (exp) {
        const timeLeft = exp - now;
        console.log('⏰ Token expire dans:', timeLeft > 0 ? `${Math.floor(timeLeft / 60)} minutes` : 'EXPIRÉ');
        
        if (timeLeft <= 0) {
          console.error('❌ PROBLÈME: Token expiré');
          console.log('💡 Solution: Reconnectez-vous');
        } else if (timeLeft < 300) { // moins de 5 minutes
          console.warn('⚠️ ATTENTION: Token expire bientôt');
        }
      }
    } catch (e) {
      console.error('❌ PROBLÈME: Token malformé');
      console.log('💡 Solution: Supprimez le token et reconnectez-vous');
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('🎯 RÉSUMÉ DU DIAGNOSTIC');
  console.log('');
  console.log('Si tout est vert ci-dessus, l\'authentification fonctionne.');
  console.log('Si vous voyez des erreurs rouges, suivez les solutions proposées.');
}

// Fonction pour nettoyer l'authentification
function nettoyerAuthentification() {
  console.log('🧹 Nettoyage de l\'authentification...');
  
  localStorage.removeItem('token_auth');
  localStorage.removeItem('utilisateur_connecte');
  
  console.log('✅ Données d\'authentification supprimées');
  console.log('🔄 Rechargez la page et reconnectez-vous');
}

// Fonction pour forcer la reconnexion
function forcerReconnexion() {
  console.log('🔄 Redirection vers la page de connexion...');
  
  nettoyerAuthentification();
  window.location.href = '/connexion';
}

// Instructions
console.log('📋 COMMANDES DISPONIBLES:');
console.log('1. diagnosticAuthentification() - Diagnostic complet');
console.log('2. nettoyerAuthentification() - Nettoyer les données');
console.log('3. forcerReconnexion() - Forcer la reconnexion');

// Auto-exécution du diagnostic
if (typeof window !== 'undefined') {
  console.log('🚀 Lancement du diagnostic automatique...');
  diagnosticAuthentification();
}