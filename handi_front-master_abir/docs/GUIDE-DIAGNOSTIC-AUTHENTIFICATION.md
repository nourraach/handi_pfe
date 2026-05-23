# Guide de Diagnostic - Problèmes d'Authentification

## 🎯 **OBJECTIF**
Diagnostiquer et résoudre les problèmes d'authentification sur la page des offres entreprise.

---

## 🔍 **DIAGNOSTIC ÉTAPE PAR ÉTAPE**

### **ÉTAPE 1 : Vérification Rapide (2 min)**

1. **Ouvrez votre navigateur** sur `http://localhost:3000/entreprise/offres`
2. **Appuyez sur F12** pour ouvrir les outils de développement
3. **Allez dans l'onglet Console**
4. **Recherchez les messages d'erreur** en rouge

#### **Messages d'erreur courants :**
- `❌ [OFFRES] Aucun token trouvé` → Pas connecté
- `🔐 [OFFRES] Erreur 401` → Token invalide/expiré
- `❌ PROBLÈME: L'utilisateur n'est pas une entreprise` → Mauvais rôle

### **ÉTAPE 2 : Diagnostic Automatique (3 min)**

1. **Dans la console**, copiez-collez ce code :

```javascript
// Diagnostic automatique complet
function diagnosticRapide() {
  console.log('🔍 DIAGNOSTIC AUTHENTIFICATION');
  
  // Vérifier localStorage
  const token = localStorage.getItem('token_auth');
  const utilisateur = localStorage.getItem('utilisateur_connecte');
  
  console.log('🔑 Token:', token ? 'PRÉSENT' : 'MANQUANT');
  console.log('👤 Utilisateur:', utilisateur ? 'PRÉSENT' : 'MANQUANT');
  
  if (utilisateur) {
    const userData = JSON.parse(utilisateur);
    console.log('👤 Rôle:', userData.role);
    console.log('👤 Nom:', userData.nom);
    
    if (userData.role !== 'entreprise') {
      console.error('❌ PROBLÈME: Rôle incorrect');
      return 'ROLE_INCORRECT';
    }
  }
  
  if (!token || token === 'null') {
    console.error('❌ PROBLÈME: Token manquant');
    return 'TOKEN_MANQUANT';
  }
  
  // Tester l'API
  return fetch('http://localhost:4000/api/entreprise/offres', {
    headers: {
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'application/json'
    }
  })
  .then(res => {
    console.log('📊 Status API:', res.status);
    
    if (res.status === 200) {
      console.log('✅ AUTHENTIFICATION OK');
      return 'OK';
    } else if (res.status === 401) {
      console.error('❌ PROBLÈME: Token invalide');
      return 'TOKEN_INVALIDE';
    } else {
      console.error('❌ PROBLÈME: Erreur serveur');
      return 'ERREUR_SERVEUR';
    }
  })
  .catch(err => {
    console.error('❌ PROBLÈME: Serveur inaccessible');
    return 'SERVEUR_INACCESSIBLE';
  });
}

// Exécuter le diagnostic
diagnosticRapide().then(resultat => {
  console.log('🎯 RÉSULTAT:', resultat);
});
```

2. **Appuyez sur Entrée** et attendez le résultat

### **ÉTAPE 3 : Solutions selon le Problème**

#### **🔴 PROBLÈME : TOKEN_MANQUANT**
**Solution :**
1. Allez sur `/connexion`
2. Connectez-vous avec un compte entreprise
3. Retournez sur `/entreprise/offres`

#### **🔴 PROBLÈME : ROLE_INCORRECT**
**Solution :**
1. Déconnectez-vous (bouton déconnexion)
2. Connectez-vous avec un compte **entreprise** (pas candidat/admin)
3. Retournez sur `/entreprise/offres`

#### **🔴 PROBLÈME : TOKEN_INVALIDE**
**Solution :**
```javascript
// Dans la console, exécutez :
localStorage.removeItem('token_auth');
localStorage.removeItem('utilisateur_connecte');
window.location.href = '/connexion';
```

#### **🔴 PROBLÈME : SERVEUR_INACCESSIBLE**
**Solution :**
1. Vérifiez que votre serveur backend est démarré
2. Vérifiez l'URL : `http://localhost:4000`
3. Redémarrez le serveur si nécessaire

---

## 🛠️ **SOLUTIONS AVANCÉES**

### **Solution 1 : Nettoyage Complet**
```javascript
// Nettoyer toutes les données d'authentification
localStorage.clear();
sessionStorage.clear();
window.location.href = '/connexion';
```

### **Solution 2 : Vérification Token Détaillée**
```javascript
// Analyser le token JWT
const token = localStorage.getItem('token_auth');
if (token && token !== 'null') {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    console.log('Token payload:', payload);
    console.log('Expire le:', new Date(payload.exp * 1000));
    console.log('Temps restant:', Math.floor((payload.exp * 1000 - Date.now()) / 1000 / 60), 'minutes');
  } catch (e) {
    console.error('Token malformé');
  }
}
```

### **Solution 3 : Test API Manuel**
```javascript
// Tester l'API manuellement
const token = localStorage.getItem('token_auth');
fetch('http://localhost:4000/api/entreprise/offres', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  }
})
.then(res => {
  console.log('Status:', res.status);
  return res.json();
})
.then(data => {
  console.log('Données:', data);
})
.catch(err => {
  console.error('Erreur:', err);
});
```

---

## 📋 **CHECKLIST DE VÉRIFICATION**

### **Avant de commencer :**
- [ ] Serveur backend démarré sur localhost:4000
- [ ] Frontend démarré sur localhost:3000
- [ ] Navigateur ouvert sur `/entreprise/offres`
- [ ] Console développeur ouverte (F12)

### **Vérifications de base :**
- [ ] Token présent dans localStorage
- [ ] Utilisateur connecté avec rôle "entreprise"
- [ ] Pas d'erreurs JavaScript dans la console
- [ ] API backend accessible (status 200 ou 401, pas d'erreur réseau)

### **Tests fonctionnels :**
- [ ] Page se charge sans erreur
- [ ] Bouton "Créer une offre" visible
- [ ] Pas de message d'erreur rouge
- [ ] Données d'offres affichées (ou message "Aucune offre")

---

## 🎯 **RÉSULTATS ATTENDUS**

### **✅ Authentification Réussie :**
- Console affiche : `✅ [OFFRES] Offres chargées avec succès depuis l'API`
- Page affiche les offres ou "Aucune offre créée"
- Bouton "Créer une offre" fonctionnel
- Aucun message d'erreur

### **❌ Problème d'Authentification :**
- Console affiche des erreurs 401 ou token manquant
- Page affiche "Session expirée" ou erreurs similaires
- Redirection automatique vers `/connexion` (optionnel)

---

## 🚨 **AIDE D'URGENCE**

Si rien ne fonctionne, exécutez cette **réinitialisation complète** :

```javascript
// RÉINITIALISATION COMPLÈTE
console.log('🚨 RÉINITIALISATION COMPLÈTE');

// 1. Nettoyer le stockage
localStorage.clear();
sessionStorage.clear();
console.log('✅ Stockage nettoyé');

// 2. Recharger la page
window.location.reload();
```

Puis :
1. Allez sur `/connexion`
2. Connectez-vous avec un compte entreprise
3. Retournez sur `/entreprise/offres`

**Cette solution fonctionne dans 95% des cas !** 🚀