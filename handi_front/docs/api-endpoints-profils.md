# API Endpoints pour les Profils Utilisateurs

## 🔐 Authentification
Toutes les API nécessitent un token d'authentification dans le header :
```
Authorization: Bearer <token>
```

---

## 👤 API CANDIDAT

### 1. Récupérer le profil candidat
```http
GET /api/candidats/profil/{id_utilisateur}
```

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Réponse attendue:**
```json
{
  "message": "Profil récupéré avec succès",
  "donnees": {
    "nom": "Jean Dupont",
    "email": "jean.dupont@email.com",
    "telephone": "0123456789",
    "addresse": "123 Rue de la Paix, 75001 Paris",
    "competences": ["JavaScript", "React", "Node.js"],
    "experience": "3 ans d'expérience en développement web...",
    "formation": "Master en Informatique - Université de Lyon",
    "handicap": "Mobilité réduite",
    "disponibilite": "Immédiate",
    "salaire_souhaite": "35000€ annuel",
    "cv_url": "https://example.com/cv.pdf"
  }
}
```

### 2. Mettre à jour le profil candidat
```http
PUT /api/candidats/profil
```

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**
```json
{
  "nom": "Jean Dupont",
  "email": "jean.dupont@email.com",
  "telephone": "0123456789",
  "addresse": "123 Rue de la Paix, 75001 Paris",
  "competences": ["JavaScript", "React", "Node.js", "TypeScript"],
  "experience": "3 ans d'expérience en développement web...",
  "formation": "Master en Informatique - Université de Lyon",
  "handicap": "Mobilité réduite",
  "disponibilite": "Immédiate",
  "salaire_souhaite": "35000€ annuel"
}
```

**Réponse attendue:**
```json
{
  "message": "Profil mis à jour avec succès",
  "donnees": {
    "id_utilisateur": "123",
    "nom": "Jean Dupont",
    "email": "jean.dupont@email.com"
  }
}
```

---

## 🏢 API ENTREPRISE

### 1. Récupérer le profil entreprise
```http
GET /api/entreprises/profil/{id_utilisateur}
```

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Réponse attendue:**
```json
{
  "message": "Profil récupéré avec succès",
  "donnees": {
    "nom": "Marie Martin",
    "email": "marie.martin@entreprise.com",
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
}
```

### 2. Mettre à jour le profil entreprise
```http
PUT /api/entreprises/profil
```

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**
```json
{
  "nom": "Marie Martin",
  "email": "marie.martin@entreprise.com",
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

**Réponse attendue:**
```json
{
  "message": "Profil mis à jour avec succès",
  "donnees": {
    "id_utilisateur": "456",
    "nom": "Marie Martin",
    "email": "marie.martin@entreprise.com"
  }
}
```

---

## 👨‍💼 API ADMIN

### 1. Récupérer le profil admin
```http
GET /api/admin/profil/{id_utilisateur}
```

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Réponse attendue:**
```json
{
  "message": "Profil récupéré avec succès",
  "donnees": {
    "nom": "Admin Test",
    "email": "admin@test.com",
    "telephone": "0123456789",
    "addresse": "789 Rue de l'Administration, 75001 Paris",
    "poste": "Administrateur Système",
    "departement": "Informatique / IT",
    "date_embauche": "2023-01-15",
    "notifications_email": true,
    "notifications_sms": false
  }
}
```

### 2. Mettre à jour le profil admin
```http
PUT /api/admin/profil
```

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**
```json
{
  "nom": "Admin Test",
  "email": "admin@test.com",
  "telephone": "0123456789",
  "addresse": "789 Rue de l'Administration, 75001 Paris",
  "poste": "Administrateur Système",
  "departement": "Informatique / IT",
  "date_embauche": "2023-01-15",
  "notifications_email": true,
  "notifications_sms": true
}
```

**Réponse attendue:**
```json
{
  "message": "Profil mis à jour avec succès",
  "donnees": {
    "id_utilisateur": "789",
    "nom": "Admin Test",
    "email": "admin@test.com"
  }
}
```

---

## 🗄️ Structure de Base de Données Suggérée

### Table `utilisateurs` (existante)
```sql
- id_utilisateur (PRIMARY KEY)
- nom
- email
- mot_de_passe
- role (candidat/entreprise/admin)
- statut (actif/inactif/en_attente)
- telephone
- addresse
- created_at
- updated_at
```

### Table `profils_candidats`
```sql
CREATE TABLE profils_candidats (
  id_profil INT PRIMARY KEY AUTO_INCREMENT,
  id_utilisateur INT NOT NULL,
  competences JSON,
  experience TEXT,
  formation TEXT,
  handicap TEXT,
  disponibilite VARCHAR(50),
  salaire_souhaite VARCHAR(100),
  cv_url VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (id_utilisateur) REFERENCES utilisateurs(id_utilisateur)
);
```

### Table `profils_entreprises`
```sql
CREATE TABLE profils_entreprises (
  id_profil INT PRIMARY KEY AUTO_INCREMENT,
  id_utilisateur INT NOT NULL,
  nom_entreprise VARCHAR(255),
  secteur_activite VARCHAR(100),
  taille_entreprise VARCHAR(50),
  siret VARCHAR(14),
  site_web VARCHAR(255),
  description TEXT,
  politique_handicap TEXT,
  contact_rh_nom VARCHAR(255),
  contact_rh_email VARCHAR(255),
  contact_rh_telephone VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (id_utilisateur) REFERENCES utilisateurs(id_utilisateur)
);
```

### Table `profils_admins`
```sql
CREATE TABLE profils_admins (
  id_profil INT PRIMARY KEY AUTO_INCREMENT,
  id_utilisateur INT NOT NULL,
  poste VARCHAR(255),
  departement VARCHAR(100),
  date_embauche DATE,
  permissions JSON,
  notifications_email BOOLEAN DEFAULT TRUE,
  notifications_sms BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (id_utilisateur) REFERENCES utilisateurs(id_utilisateur)
);
```

---

## 🔒 Sécurité et Validation

### Validation côté backend :
1. **Authentification** : Vérifier le token JWT
2. **Autorisation** : Vérifier que l'utilisateur peut modifier son propre profil
3. **Validation des données** :
   - Email valide
   - Téléphone au bon format
   - SIRET à 14 chiffres pour les entreprises
   - URL valide pour le site web
4. **Sanitisation** : Nettoyer les données avant insertion en BDD

### Gestion d'erreurs :
```json
// Erreur d'authentification
{
  "message": "Token invalide ou expiré",
  "code": 401
}

// Erreur de validation
{
  "message": "Données invalides",
  "erreurs": {
    "email": "Format d'email invalide",
    "siret": "Le SIRET doit contenir 14 chiffres"
  },
  "code": 400
}

// Erreur serveur
{
  "message": "Erreur interne du serveur",
  "code": 500
}
```

---

## 📝 Notes d'implémentation

1. **Middleware d'authentification** : Vérifier le token sur toutes les routes
2. **Validation des rôles** : S'assurer que seuls les bons rôles accèdent aux bonnes API
3. **Logs** : Enregistrer les modifications de profil pour audit
4. **Cache** : Possibilité de mettre en cache les profils fréquemment consultés
5. **Upload de fichiers** : Prévoir une API séparée pour l'upload de CV (candidats)

Ces API couvrent tous les besoins des composants profil que j'ai créés dans le frontend.