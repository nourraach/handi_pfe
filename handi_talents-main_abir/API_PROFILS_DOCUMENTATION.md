# 📋 Documentation API Profils HandiTalents

## 🚀 Vue d'ensemble

Cette documentation décrit les API REST pour la gestion des profils utilisateurs dans l'application HandiTalents. Les API permettent de récupérer et mettre à jour les profils pour trois types d'utilisateurs : candidats, entreprises et administrateurs.

## 🔐 Authentification

Toutes les API nécessitent un token d'authentification JWT dans le header :

```http
Authorization: Bearer <token>
```

Pour obtenir un token, utilisez l'endpoint de connexion :

```http
POST /api/auth/connexion
Content-Type: application/json

{
  "email": "utilisateur@example.com",
  "mdp": "motdepasse"
}
```

## 📊 Endpoints Disponibles

### 👤 API CANDIDAT

#### 1. Récupérer le profil candidat

```http
GET /api/candidats/profil/{id_utilisateur}
Authorization: Bearer <token>
```

**Réponse :**
```json
{
  "message": "Profil récupéré avec succès",
  "donnees": {
    "nom": "Ahmed Ben Ali",
    "email": "candidat@handitalents.com",
    "telephone": "98765432",
    "addresse": "Rue de la République, Sfax",
    "competences": ["JavaScript", "React", "Node.js", "TypeScript"],
    "experience": "3 ans d'expérience en développement web...",
    "formation": "Licence en Informatique - Université de Sfax",
    "handicap": "Handicap moteur",
    "disponibilite": "Immédiate",
    "salaire_souhaite": "35000€ annuel",
    "cv_url": "",
    "type_handicap": "Handicap moteur",
    "niveau_academique": "Licence en Informatique",
    "description": "Développeur passionné...",
    "secteur": "Technologies de l'information",
    "age": 28
  }
}
```

#### 2. Mettre à jour le profil candidat

```http
PUT /api/candidats/profil
Authorization: Bearer <token>
Content-Type: application/json

{
  "nom": "Ahmed Ben Ali",
  "telephone": "98765432",
  "addresse": "Rue de la République, Sfax",
  "competences": ["JavaScript", "React", "Node.js", "TypeScript", "Python"],
  "experience": "4 ans d'expérience en développement web full-stack",
  "formation": "Master en Informatique - Université de Sfax",
  "disponibilite": "Dans 2 semaines",
  "salaire_souhaite": "40000€ annuel"
}
```

**Réponse :**
```json
{
  "message": "Profil mis à jour avec succès",
  "donnees": {
    "id_utilisateur": "e89ff453-c02a-4bca-8a87-f3d10f04c5cf",
    "nom": "Ahmed Ben Ali",
    "email": "candidat@handitalents.com"
  }
}
```

### 🏢 API ENTREPRISE

#### 1. Récupérer le profil entreprise

```http
GET /api/entreprises/profil/{id_utilisateur}
Authorization: Bearer <token>
```

#### 2. Mettre à jour le profil entreprise

```http
PUT /api/entreprises/profil
Authorization: Bearer <token>
Content-Type: application/json

{
  "nom": "Marie Martin",
  "telephone": "0123456789",
  "addresse": "456 Avenue des Entreprises, 69000 Lyon",
  "nom_entreprise": "TechCorp Solutions",
  "secteur_activite": "Technologie / Informatique",
  "taille_entreprise": "51-200 employés",
  "siret": "12345678901234",
  "site_web": "https://www.techcorp.com",
  "description": "Entreprise spécialisée dans le développement...",
  "politique_handicap": "Notre entreprise s'engage pour l'inclusion...",
  "contact_rh_nom": "Sophie Dubois",
  "contact_rh_email": "rh@techcorp.com",
  "contact_rh_telephone": "0123456790"
}
```

### 👨‍💼 API ADMIN

#### 1. Récupérer le profil admin

```http
GET /api/admin/profil/{id_utilisateur}
Authorization: Bearer <token>
```

**Réponse :**
```json
{
  "message": "Profil récupéré avec succès",
  "donnees": {
    "nom": "Administrateur Principal",
    "email": "admin@handitalents.com",
    "telephone": "71234567",
    "addresse": "Avenue Habib Bourguiba, Tunis",
    "poste": "Administrateur Système",
    "departement": "Informatique / IT",
    "date_embauche": "2023-01-15",
    "permissions": [
      "Gestion des utilisateurs",
      "Validation des comptes",
      "Accès aux statistiques",
      "Configuration système"
    ],
    "notifications_email": true,
    "notifications_sms": false
  }
}
```

#### 2. Mettre à jour le profil admin

```http
PUT /api/admin/profil
Authorization: Bearer <token>
Content-Type: application/json

{
  "nom": "Administrateur Principal",
  "telephone": "71234567",
  "addresse": "Avenue Habib Bourguiba, Tunis",
  "poste": "Administrateur Système Senior",
  "departement": "Informatique / IT",
  "permissions": [
    "Gestion des utilisateurs",
    "Validation des comptes",
    "Accès aux statistiques",
    "Configuration système",
    "Audit"
  ],
  "notifications_email": true,
  "notifications_sms": true
}
```

## 🔒 Sécurité et Autorisations

### Règles d'accès :
- **Candidats** : Peuvent uniquement accéder et modifier leur propre profil
- **Entreprises** : Peuvent uniquement accéder et modifier leur propre profil  
- **Admins** : Peuvent accéder à tous les profils et modifier leur propre profil

### Validation des données :
- Email : Format valide requis
- Téléphone : Format numérique
- SIRET : 14 chiffres pour les entreprises
- URL : Format valide pour les sites web

## 📝 Codes d'erreur

| Code | Description |
|------|-------------|
| 200 | Succès |
| 400 | Données invalides |
| 401 | Token invalide ou expiré |
| 403 | Accès non autorisé |
| 404 | Profil non trouvé |
| 500 | Erreur serveur |

## 🧪 Tests

Pour tester les API, utilisez le script de test :

```bash
npm run tester-api-profils
```

## 📊 Structure de Base de Données

### Tables étendues :

#### `candidat` (étendue)
- Nouveaux champs : `competences`, `experience`, `formation`, `handicap`, `disponibilite`, `salaire_souhaite`, `cv_url`

#### `entreprise` (étendue)  
- Nouveaux champs : `secteur_activite`, `taille_entreprise`, `siret`, `site_web`, `politique_handicap`, `contact_rh_*`

#### `admin` (nouvelle table)
- Champs : `poste`, `departement`, `date_embauche`, `permissions`, `notifications_*`

## 🚀 Déploiement

1. Générer les migrations : `npm run drizzle:generer`
2. Appliquer les migrations : `npm run drizzle:migrer`
3. Initialiser les profils : `npm run initialiser-profils`
4. Démarrer le serveur : `npm run dev`

## 📞 Support

Pour toute question ou problème, contactez l'équipe de développement HandiTalents.