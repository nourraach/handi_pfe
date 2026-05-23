# 📋 RÉSUMÉ - API Profils Utilisateurs

## 🎯 Vue d'ensemble

J'ai créé un système complet de gestion des profils utilisateurs pour votre application Handi Talents. Voici tout ce dont vous avez besoin pour implémenter le backend.

## 📁 Fichiers créés

1. **`api-endpoints-profils.md`** - Documentation complète des API endpoints
2. **`exemple-backend-profils.js`** - Code d'exemple Express.js/MySQL
3. **`schema-database-profils.sql`** - Scripts SQL pour créer les tables
4. **`RESUME-API-PROFILS.md`** - Ce résumé (fichier actuel)

## 🔗 API Endpoints à implémenter

### CANDIDAT
- `GET /api/candidats/profil/{id_utilisateur}` - Récupérer profil
- `PUT /api/candidats/profil` - Mettre à jour profil

### ENTREPRISE  
- `GET /api/entreprises/profil/{id_utilisateur}` - Récupérer profil
- `PUT /api/entreprises/profil` - Mettre à jour profil

### ADMIN
- `GET /api/admin/profil/{id_utilisateur}` - Récupérer profil
- `PUT /api/admin/profil` - Mettre à jour profil

## 🗄️ Tables de base de données

### `profils_candidats`
```sql
- id_profil (PK)
- id_utilisateur (FK)
- competences (JSON)
- experience (TEXT)
- formation (TEXT)
- handicap (TEXT)
- disponibilite (VARCHAR)
- salaire_souhaite (VARCHAR)
- cv_url (VARCHAR)
- created_at, updated_at
```

### `profils_entreprises`
```sql
- id_profil (PK)
- id_utilisateur (FK)
- nom_entreprise (VARCHAR)
- secteur_activite (VARCHAR)
- taille_entreprise (VARCHAR)
- siret (VARCHAR)
- site_web (VARCHAR)
- description (TEXT)
- politique_handicap (TEXT)
- contact_rh_nom (VARCHAR)
- contact_rh_email (VARCHAR)
- contact_rh_telephone (VARCHAR)
- created_at, updated_at
```

### `profils_admins`
```sql
- id_profil (PK)
- id_utilisateur (FK)
- poste (VARCHAR)
- departement (VARCHAR)
- date_embauche (DATE)
- notifications_email (BOOLEAN)
- notifications_sms (BOOLEAN)
- created_at, updated_at
```

## 🔒 Sécurité requise

1. **Authentification JWT** sur toutes les routes
2. **Validation des rôles** - chaque utilisateur ne peut modifier que son profil
3. **Validation des données** :
   - Email valide
   - SIRET 14 chiffres pour entreprises
   - URL valide pour sites web
4. **Sanitisation** des données avant insertion

## 📝 Étapes d'implémentation

### 1. Base de données
```bash
# Exécuter le script SQL
mysql -u username -p database_name < docs/schema-database-profils.sql
```

### 2. Backend (Express.js)
```javascript
// Installer les dépendances
npm install express mysql2 jsonwebtoken bcrypt

// Utiliser le code d'exemple
const profilsRouter = require('./docs/exemple-backend-profils.js');
app.use('/api', profilsRouter);
```

### 3. Variables d'environnement
```env
DB_HOST=localhost
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=your_db_name
JWT_SECRET=your_jwt_secret
```

## 🧪 Test des API

### Avec curl :
```bash
# Récupérer profil candidat
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:4000/api/candidats/profil/123

# Mettre à jour profil candidat
curl -X PUT \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"nom":"Jean Dupont","email":"jean@test.com"}' \
     http://localhost:4000/api/candidats/profil
```

### Avec Postman :
1. Créer une collection "Profils API"
2. Ajouter les 6 endpoints
3. Configurer l'authentification Bearer Token
4. Tester avec les données d'exemple

## 📊 Données de test

Le script SQL inclut des données de test pour :
- 1 profil candidat complet
- 1 profil entreprise complet  
- 1 profil admin complet

## 🎨 Frontend déjà prêt

Le frontend est déjà créé avec :
- Page `/profil` qui s'adapte au rôle
- Composants pour chaque type d'utilisateur
- Interface d'édition complète
- Gestion des erreurs et messages
- Design responsive

## 🚀 Prochaines étapes

1. **Créer les tables** avec le script SQL
2. **Implémenter les API** avec le code d'exemple
3. **Tester les endpoints** avec Postman/curl
4. **Vérifier l'intégration** frontend/backend
5. **Ajouter les validations** spécifiques à vos besoins

## 💡 Améliorations possibles

- Upload de CV pour candidats
- Photos de profil
- Historique des modifications
- Notifications de mise à jour
- Export des profils en PDF
- Recherche avancée par compétences

## 📞 Support

Si vous avez des questions sur l'implémentation :
1. Consultez les fichiers de documentation
2. Vérifiez les exemples de code
3. Testez étape par étape
4. Adaptez selon vos besoins spécifiques

**Tout est prêt pour l'implémentation ! 🎉**