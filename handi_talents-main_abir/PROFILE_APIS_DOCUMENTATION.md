# 📋 Documentation des APIs de Profils - HandiTalents

## 🎯 Vue d'ensemble

Ce document décrit les APIs de gestion des profils pour les candidats et les entreprises dans le système HandiTalents.

## 📊 Tables de Base de Données

### Table `profil_candidat`
```sql
CREATE TABLE profil_candidat (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_utilisateur uuid NOT NULL UNIQUE,
  competences json,
  experience text,
  formation text,
  handicap text,
  disponibilite text,
  salaire_souhaite text,
  cv_url text,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now(),
  FOREIGN KEY (id_utilisateur) REFERENCES utilisateur(id_utilisateur) ON DELETE CASCADE
);
```

### Table `profil_entreprise`
```sql
CREATE TABLE profil_entreprise (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_utilisateur uuid NOT NULL UNIQUE,
  secteur text,
  taille text,
  description text,
  site_web text,
  siret text,
  contact_rh text,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now(),
  FOREIGN KEY (id_utilisateur) REFERENCES utilisateur(id_utilisateur) ON DELETE CASCADE
);
```

## 🔗 APIs Implémentées

### 1. Profil Candidat

#### GET `/api/candidats/profil/:id`
**Description**: Récupère le profil complet d'un candidat

**Headers**:
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Paramètres**:
- `id` (string): ID de l'utilisateur candidat

**Réponse Success (200)**:
```json
{
  "message": "Profil récupéré avec succès",
  "donnees": {
    "id_utilisateur": "uuid",
    "nom": "Ahmed Ben Ali",
    "email": "ahmed@example.com",
    "telephone": "98765432",
    "adresse": "Rue de la République, Sfax",
    "statut": "approuve",
    "created_at": "2026-03-15T19:54:37.316Z",
    "type_handicap": "Handicap moteur",
    "num_carte_handicap": "HC123456789",
    "niveau_academique": "Licence en Informatique",
    "secteur": "Technologies de l'information",
    "age": 28,
    "competences": ["JavaScript", "React", "Node.js"],
    "experience": "5 ans d'expérience en développement web",
    "formation": "Master en Informatique",
    "handicap": "Handicap moteur - mobilité réduite",
    "disponibilite": "Immédiate",
    "salaire_souhaite": "2500-3000 TND",
    "cv_url": "https://example.com/cv.pdf"
  }
}
```

#### PUT `/api/candidats/profil`
**Description**: Met à jour le profil d'un candidat

**Headers**:
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body**:
```json
{
  "nom": "Ahmed Ben Ali",
  "email": "ahmed.updated@handitalents.com",
  "telephone": "98765432",
  "addresse": "Rue de la République, Sfax",
  "competences": ["JavaScript", "React", "Node.js", "PostgreSQL"],
  "experience": "5 ans d'expérience en développement web",
  "formation": "Master en Informatique",
  "handicap": "Handicap moteur - mobilité réduite",
  "disponibilite": "Immédiate",
  "salaire_souhaite": "2500-3000 TND"
}
```

**Réponse Success (200)**:
```json
{
  "message": "Profil mis à jour avec succès",
  "donnees": {
    "id_utilisateur": "uuid"
  }
}
```

### 2. Profil Entreprise

#### GET `/api/entreprises/profil/:id`
**Description**: Récupère le profil complet d'une entreprise

**Headers**:
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Paramètres**:
- `id` (string): ID de l'utilisateur entreprise

**Réponse Success (200)**:
```json
{
  "message": "Profil récupéré avec succès",
  "donnees": {
    "id_utilisateur": "uuid",
    "nom": "Entreprise HandiTech",
    "email": "contact@handitech.tn",
    "telephone": "71234567",
    "adresse": "Avenue Habib Bourguiba, Tunis",
    "statut": "approuve",
    "created_at": "2026-03-17T23:11:59.751Z",
    "nom_entreprise": "HandiTech Solutions",
    "patente": "76574",
    "rne": "kdf",
    "secteur_activite": "Technologies",
    "nbr_employe": 50,
    "entreprise_description": "Entreprise technologique",
    "secteur": "Technologies de l'information",
    "taille": "50-100 employés",
    "description": "Entreprise spécialisée dans le développement de solutions technologiques inclusives",
    "site_web": "https://www.handitech.tn",
    "siret": "12345678901234",
    "contact_rh": "rh@handitech.tn"
  }
}
```

#### PUT `/api/entreprises/profil`
**Description**: Met à jour le profil d'une entreprise

**Headers**:
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body**:
```json
{
  "nom": "Entreprise HandiTech",
  "email": "contact@handitech.tn",
  "telephone": "71234567",
  "addresse": "Avenue Habib Bourguiba, Tunis",
  "secteur": "Technologies de l'information",
  "taille": "50-100 employés",
  "description": "Entreprise spécialisée dans le développement de solutions technologiques inclusives",
  "site_web": "https://www.handitech.tn",
  "siret": "12345678901234",
  "contact_rh": "rh@handitech.tn"
}
```

**Réponse Success (200)**:
```json
{
  "message": "Profil mis à jour avec succès",
  "donnees": {
    "id_utilisateur": "uuid"
  }
}
```

## 🔒 Authentification

Toutes les APIs nécessitent un token JWT valide dans le header `Authorization`:
```
Authorization: Bearer <your-jwt-token>
```

## ❌ Codes d'Erreur

- **401 Unauthorized**: Token manquant ou invalide
- **403 Forbidden**: Accès refusé (rôle insuffisant)
- **404 Not Found**: Utilisateur non trouvé
- **500 Internal Server Error**: Erreur serveur

## 🧪 Tests

Les APIs ont été testées avec succès:

### Test Candidat
- ✅ Récupération du profil candidat
- ✅ Mise à jour du profil candidat
- ✅ Persistance des données en base
- ✅ Gestion des compétences (JSON array)

### Test Entreprise
- ✅ Récupération du profil entreprise
- ✅ Mise à jour du profil entreprise
- ✅ Persistance des données en base
- ✅ Gestion des informations étendues

## 🚀 Intégration Frontend

Le frontend peut maintenant utiliser ces APIs pour:

1. **Afficher les profils complets** des candidats et entreprises
2. **Permettre la modification** des informations de profil
3. **Gérer les compétences** des candidats (array JSON)
4. **Stocker les informations étendues** (CV, site web, contact RH, etc.)

## 📝 Notes Techniques

- Les tables utilisent des UUIDs comme clés primaires
- Les contraintes de clés étrangères assurent l'intégrité référentielle
- Les timestamps sont automatiquement gérés (created_at, updated_at)
- Les compétences sont stockées au format JSON pour plus de flexibilité
- Toutes les APIs incluent une authentification et une validation appropriées

## 🔄 Prochaines Étapes

1. Intégrer l'authentification JWT réelle (extraction de l'ID utilisateur du token)
2. Ajouter la validation des données côté serveur
3. Implémenter l'upload de CV pour les candidats
4. Ajouter la gestion des images de profil
5. Créer des APIs de recherche de profils