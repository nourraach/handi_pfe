# Guide d'utilisation des logs de diagnostic

## 🔍 Logs ajoutés pour diagnostiquer les problèmes d'offres d'emploi

J'ai ajouté des **logs détaillés** dans la console pour vous aider à identifier exactement d'où vient le problème avec les offres d'emploi qui ne sont pas sauvegardées en base de données.

## 📊 Types de logs disponibles

### 🔄 [OFFRES] - Chargement des offres
- `🔄 [OFFRES] Début du chargement des offres...`
- `🔑 [OFFRES] Token récupéré: xxx...`
- `📡 [OFFRES] Tentative de connexion à: http://localhost:4000/api/entreprise/offres`
- `📊 [OFFRES] Réponse reçue - Status: 200/404/500`
- `📦 [OFFRES] Données reçues: {...}`

### ➕ [CRÉATION] - Création d'offres
- `➕ [CRÉATION] Début de la création d'offre...`
- `📝 [CRÉATION] Données de l'offre: {...}`
- `📡 [CRÉATION] Envoi POST vers: http://localhost:4000/api/entreprise/offres`
- `📦 [CRÉATION] Body envoyé: {...}`
- `📊 [CRÉATION] Réponse reçue - Status: 201/404/400/500`
- `🆔 [CRÉATION] ID de l'offre créée: 123`

### 🔄 [STATUT] - Changement de statut
- `🔄 [STATUT] Changement de statut pour l'offre 123 vers active`
- `📡 [STATUT] Envoi PATCH vers: http://localhost:4000/api/entreprise/offres/123/statut`

### 🗑️ [SUPPRESSION] - Suppression d'offres
- `🗑️ [SUPPRESSION] Début de la suppression de l'offre 123`
- `📡 [SUPPRESSION] Envoi DELETE vers: http://localhost:4000/api/entreprise/offres/123`

## 🎯 Comment utiliser les logs pour diagnostiquer

### 1. Ouvrir la console du navigateur
1. Appuyez sur **F12** ou clic droit → "Inspecter"
2. Allez dans l'onglet **Console**
3. Effacez la console (bouton 🗑️ ou Ctrl+L)

### 2. Effectuer une action (créer une offre)
1. Cliquez sur "Créer une offre"
2. Remplissez le formulaire
3. Cliquez sur "Créer l'offre"
4. **Regardez immédiatement la console**

### 3. Analyser les logs selon les scénarios

## 📋 Scénarios de diagnostic

### ✅ Scénario 1 : Backend fonctionne correctement
```
➕ [CRÉATION] Début de la création d'offre...
📝 [CRÉATION] Données de l'offre: {titre: "Test", description: "..."}
🔑 [CRÉATION] Token utilisé: eyJhbGciOiJIUzI1NiIs...
📡 [CRÉATION] Envoi POST vers: http://localhost:4000/api/entreprise/offres
📦 [CRÉATION] Body envoyé: {"titre":"Test",...}
📊 [CRÉATION] Réponse reçue - Status: 201
✅ [CRÉATION] Réponse OK - Parsing JSON...
📦 [CRÉATION] Données de réponse: {message: "Offre créée", donnees: {id_offre: 123}}
🆔 [CRÉATION] ID de l'offre créée: 123
🔄 [CRÉATION] Rechargement des offres...
🔄 [OFFRES] Début du chargement des offres...
📊 [OFFRES] Réponse reçue - Status: 200
📦 [OFFRES] Données reçues: {donnees: {offres: [...]}}
📋 [OFFRES] Nombre d'offres: 3
✅ [OFFRES] Offres chargées avec succès depuis l'API
```
**→ Tout fonctionne, l'offre est bien sauvegardée en base**

### ❌ Scénario 2 : Endpoint non implémenté (404)
```
➕ [CRÉATION] Début de la création d'offre...
📡 [CRÉATION] Envoi POST vers: http://localhost:4000/api/entreprise/offres
📊 [CRÉATION] Réponse reçue - Status: 404
⚠️ [CRÉATION] API 404 - Endpoint non trouvé, sauvegarde locale
💾 [CRÉATION] Offres existantes en local: 2
🏗️ [CRÉATION] Nouvelle offre avec ID: {id_offre: "1647856234567", ...}
💾 [CRÉATION] Sauvegarde localStorage - Total: 3 offres
```
**→ L'API POST /api/entreprise/offres n'existe pas côté backend**

### ❌ Scénario 3 : Serveur backend inaccessible
```
➕ [CRÉATION] Début de la création d'offre...
📡 [CRÉATION] Envoi POST vers: http://localhost:4000/api/entreprise/offres
💥 [CRÉATION] Erreur de connexion complète: TypeError: Failed to fetch
💥 [CRÉATION] Type d'erreur: TypeError
💥 [CRÉATION] Message d'erreur: Failed to fetch
⚠️ [CRÉATION] Serveur inaccessible, sauvegarde locale
```
**→ Le serveur backend n'est pas démarré ou inaccessible**

### ❌ Scénario 4 : Problème d'authentification (401/403)
```
➕ [CRÉATION] Début de la création d'offre...
🔑 [CRÉATION] Token utilisé: eyJhbGciOiJIUzI1NiIs...
📡 [CRÉATION] Envoi POST vers: http://localhost:4000/api/entreprise/offres
📊 [CRÉATION] Réponse reçue - Status: 401
❌ [CRÉATION] Erreur HTTP: 401
📄 [CRÉATION] Détails de l'erreur: {message: "Token invalide"}
```
**→ Problème d'authentification (token expiré/invalide)**

### ❌ Scénario 5 : Erreur de validation (400)
```
➕ [CRÉATION] Début de la création d'offre...
📊 [CRÉATION] Réponse reçue - Status: 400
❌ [CRÉATION] Erreur HTTP: 400
📄 [CRÉATION] Détails de l'erreur: {message: "Données invalides", erreurs: {...}}
```
**→ Données envoyées invalides (validation côté backend)**

### ❌ Scénario 6 : Erreur serveur (500)
```
➕ [CRÉATION] Début de la création d'offre...
📊 [CRÉATION] Réponse reçue - Status: 500
❌ [CRÉATION] Erreur HTTP: 500
📄 [CRÉATION] Détails de l'erreur: {message: "Erreur interne du serveur"}
```
**→ Erreur côté backend (base de données, code, etc.)**

## 🔧 Actions à prendre selon les logs

### Si vous voyez Status 404
```bash
# L'endpoint n'existe pas, vous devez l'implémenter côté backend
# Vérifiez que ces routes existent dans votre serveur :
POST   /api/entreprise/offres
GET    /api/entreprise/offres
PUT    /api/entreprise/offres/:id
DELETE /api/entreprise/offres/:id
PATCH  /api/entreprise/offres/:id/statut
```

### Si vous voyez "Failed to fetch"
```bash
# Le serveur backend n'est pas accessible
# Vérifiez :
1. Le serveur backend est-il démarré ?
2. Écoute-t-il sur le port 4000 ?
3. Y a-t-il des erreurs CORS ?

# Test manuel :
curl http://localhost:4000/
```

### Si vous voyez Status 401/403
```bash
# Problème d'authentification
# Vérifiez :
1. Êtes-vous connecté ?
2. Votre token est-il valide ?
3. Avez-vous le rôle "entreprise" ?

# Dans la console :
localStorage.getItem("token_auth")
localStorage.getItem("utilisateur_connecte")
```

### Si vous voyez Status 500
```bash
# Erreur côté backend
# Vérifiez les logs du serveur backend :
1. Erreurs de base de données
2. Erreurs de code
3. Table "offres_emploi" existe-t-elle ?
```

## 🧪 Scripts de diagnostic disponibles

### 1. Diagnostic général
```javascript
// Copier le contenu de scripts/diagnostic-backend.js
diagnosticBackend()
```

### 2. Diagnostic base de données
```javascript
// Copier le contenu de scripts/diagnostic-base-donnees.js
diagnosticBaseDonnees()
```

### 3. Test des APIs d'offres
```javascript
// Copier le contenu de scripts/test-offres-emploi.js
testCompletAPIs()
```

## 📊 Exemple d'analyse complète

Voici comment analyser un problème complet :

1. **Créez une offre** et regardez les logs
2. **Identifiez le status code** de la réponse
3. **Suivez le guide ci-dessus** selon le status
4. **Utilisez les scripts de diagnostic** pour plus de détails
5. **Corrigez le problème** côté backend si nécessaire

## 🎯 Résultat attendu

Une fois le problème identifié et corrigé, vous devriez voir :
```
📊 [CRÉATION] Réponse reçue - Status: 201
✅ [CRÉATION] Réponse OK - Parsing JSON...
🆔 [CRÉATION] ID de l'offre créée: 123
```

Et lors du rechargement de la page, l'offre doit toujours être présente car elle est sauvegardée en base de données ! 🎉