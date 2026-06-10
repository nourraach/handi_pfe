# API Tests Psychologiques - Documentation Backend

## Vue d'ensemble
Cette documentation décrit tous les endpoints nécessaires pour le système de tests psychologiques, côté backend.

## Structure de la base de données requise

### Table: tests_psychologiques
```sql
CREATE TABLE tests_psychologiques (
    id_test VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    titre VARCHAR(255) NOT NULL,
    description TEXT,
    type_test ENUM('soft_skills', 'personnalite', 'competences') NOT NULL,
    duree_minutes INT NOT NULL DEFAULT 30,
    statut ENUM('actif', 'inactif', 'brouillon') NOT NULL DEFAULT 'brouillon',
    score_total INT NOT NULL DEFAULT 0,
    date_debut_validite DATETIME NOT NULL,
    date_fin_validite DATETIME NOT NULL,
    instructions TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    createur_id VARCHAR(36) NOT NULL,
    FOREIGN KEY (createur_id) REFERENCES utilisateurs(id_utilisateur)
);
```

### Table: questions
```sql
CREATE TABLE questions (
    id_question VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    id_test VARCHAR(36) NOT NULL,
    contenu_question TEXT NOT NULL,
    type_question ENUM('choix_multiple', 'vrai_faux', 'echelle_likert', 'texte_libre') NOT NULL,
    score_question INT NOT NULL DEFAULT 10,
    ordre INT NOT NULL,
    obligatoire BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_test) REFERENCES tests_psychologiques(id_test) ON DELETE CASCADE
);
```

### Table: options_reponse
```sql
CREATE TABLE options_reponse (
    id_option VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    id_question VARCHAR(36) NOT NULL,
    texte_option TEXT NOT NULL,
    est_correcte BOOLEAN DEFAULT FALSE,
    score_option INT NOT NULL DEFAULT 0,
    ordre INT NOT NULL,
    FOREIGN KEY (id_question) REFERENCES questions(id_question) ON DELETE CASCADE
);
```

### Table: resultats_tests
```sql
CREATE TABLE resultats_tests (
    id_resultat VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    id_test VARCHAR(36) NOT NULL,
    id_candidat VARCHAR(36) NOT NULL,
    score_obtenu INT NOT NULL DEFAULT 0,
    pourcentage DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    temps_passe_minutes INT NOT NULL,
    date_passage TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    est_visible BOOLEAN DEFAULT TRUE,
    peut_modifier_visibilite BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (id_test) REFERENCES tests_psychologiques(id_test),
    FOREIGN KEY (id_candidat) REFERENCES utilisateurs(id_utilisateur),
    UNIQUE KEY unique_candidat_test (id_candidat, id_test)
);
```

### Table: reponses_candidats
```sql
CREATE TABLE reponses_candidats (
    id_reponse VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    id_resultat VARCHAR(36) NOT NULL,
    id_question VARCHAR(36) NOT NULL,
    id_option VARCHAR(36) NULL,
    reponse_texte TEXT NULL,
    score_attribue INT NOT NULL DEFAULT 0,
    FOREIGN KEY (id_resultat) REFERENCES resultats_tests(id_resultat) ON DELETE CASCADE,
    FOREIGN KEY (id_question) REFERENCES questions(id_question),
    FOREIGN KEY (id_option) REFERENCES options_reponse(id_option)
);
```

## Endpoints Admin

### 1. Lister les tests (avec pagination)
**GET** `/api/tests-psychologiques/admin/tests`

**Query Parameters:**
- `page` (optional): Numéro de page (défaut: 1)
- `limit` (optional): Nombre d'éléments par page (défaut: 10)
- `statut` (optional): Filtrer par statut
- `type_test` (optional): Filtrer par type

**Response:**
```json
{
  "success": true,
  "donnees": {
    "tests": [
      {
        "id_test": "uuid",
        "titre": "Test de Communication",
        "description": "Évalue les compétences...",
        "type_test": "soft_skills",
        "duree_minutes": 30,
        "statut": "actif",
        "score_total": 100,
        "date_debut_validite": "2024-01-01T00:00:00Z",
        "date_fin_validite": "2024-12-31T23:59:59Z",
        "created_at": "2024-01-01T10:00:00Z",
        "createur": "Admin User"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 45,
      "itemsPerPage": 10
    }
  }
}
```

### 2. Créer un nouveau test
**POST** `/api/tests-psychologiques/admin/tests`

**Request Body:**
```json
{
  "titre": "Test de Communication",
  "description": "Évalue les compétences de communication",
  "type_test": "soft_skills",
  "duree_minutes": 30,
  "date_debut_validite": "2024-01-01T00:00:00Z",
  "date_fin_validite": "2024-12-31T23:59:59Z",
  "instructions": "Lisez attentivement chaque question...",
  "questions": [
    {
      "contenu_question": "Comment gérez-vous les conflits ?",
      "type_question": "choix_multiple",
      "score_question": 10,
      "ordre": 1,
      "obligatoire": true,
      "options": [
        {
          "texte_option": "J'évite les conflits",
          "est_correcte": false,
          "score_option": 2,
          "ordre": 1
        },
        {
          "texte_option": "Je cherche des solutions collaboratives",
          "est_correcte": true,
          "score_option": 10,
          "ordre": 2
        }
      ]
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Test créé avec succès",
  "donnees": {
    "id_test": "uuid-generated"
  }
}
```

### 3. Modifier un test
**PUT** `/api/tests-psychologiques/admin/tests/:id`

**Request Body:** (même structure que la création)

### 4. Supprimer un test
**DELETE** `/api/tests-psychologiques/admin/tests/:id`

**Response:**
```json
{
  "success": true,
  "message": "Test supprimé avec succès"
}
```

### 5. Statistiques d'un test
**GET** `/api/tests-psychologiques/admin/tests/:id/statistiques`

**Response:**
```json
{
  "success": true,
  "donnees": {
    "test": {
      "id_test": "uuid",
      "titre": "Test de Communication"
    },
    "statistiques": {
      "nombre_passages": 25,
      "score_moyen": 75.5,
      "score_median": 78.0,
      "score_min": 45,
      "score_max": 95,
      "temps_moyen_minutes": 28,
      "taux_completion": 92.0
    },
    "distribution_scores": [
      { "tranche": "0-20", "nombre": 1 },
      { "tranche": "21-40", "nombre": 2 },
      { "tranche": "41-60", "nombre": 5 },
      { "tranche": "61-80", "nombre": 12 },
      { "tranche": "81-100", "nombre": 5 }
    ]
  }
}
```

### 6. Résultats détaillés d'un test
**GET** `/api/tests-psychologiques/admin/tests/:id/resultats`

**Query Parameters:**
- `page`, `limit` pour pagination

**Response:**
```json
{
  "success": true,
  "donnees": {
    "resultats": [
      {
        "id_resultat": "uuid",
        "candidat": {
          "id_utilisateur": "uuid",
          "nom": "Dupont",
          "prenom": "Jean",
          "email": "jean.dupont@email.com"
        },
        "score_obtenu": 85,
        "pourcentage": 85.0,
        "temps_passe_minutes": 27,
        "date_passage": "2024-01-15T14:30:00Z",
        "est_visible": true
      }
    ],
    "pagination": { ... }
  }
}
```

## Endpoints Candidat

### 1. Tests disponibles
**GET** `/api/tests-psychologiques/candidat/tests-disponibles`

**Response:**
```json
{
  "success": true,
  "donnees": {
    "tests": [
      {
        "id_test": "uuid",
        "titre": "Test de Communication",
        "description": "Évalue les compétences...",
        "type_test": "soft_skills",
        "duree_minutes": 30,
        "date_fin_validite": "2024-12-31T23:59:59Z",
        "instructions": "Lisez attentivement...",
        "deja_passe": false,
        "peut_passer": true
      }
    ]
  }
}
```

### 2. Mes résultats
**GET** `/api/tests-psychologiques/candidat/mes-resultats`

**Response:**
```json
{
  "success": true,
  "donnees": {
    "resultats": [
      {
        "id_resultat": "uuid",
        "test": {
          "id_test": "uuid",
          "titre": "Test de Communication",
          "type_test": "soft_skills",
          "score_total": 100
        },
        "score_obtenu": 85,
        "pourcentage": 85.0,
        "temps_passe_minutes": 27,
        "date_passage": "2024-01-15T14:30:00Z",
        "est_visible": true,
        "peut_modifier_visibilite": true
      }
    ]
  }
}
```

### 3. Commencer un test
**GET** `/api/tests-psychologiques/candidat/tests/:id/commencer`

**Response:**
```json
{
  "success": true,
  "donnees": {
    "id_test": "uuid",
    "titre": "Test de Communication",
    "description": "Évalue les compétences...",
    "duree_minutes": 30,
    "instructions": "Lisez attentivement...",
    "questions": [
      {
        "id_question": "uuid",
        "contenu_question": "Comment gérez-vous les conflits ?",
        "type_question": "choix_multiple",
        "ordre": 1,
        "obligatoire": true,
        "options": [
          {
            "id_option": "uuid",
            "texte_option": "J'évite les conflits",
            "ordre": 1
          },
          {
            "id_option": "uuid",
            "texte_option": "Je cherche des solutions collaboratives",
            "ordre": 2
          }
        ]
      }
    ]
  }
}
```

### 4. Soumettre un test
**POST** `/api/tests-psychologiques/candidat/tests/:id/soumettre`

**Request Body:**
```json
{
  "reponses": [
    {
      "id_question": "uuid",
      "id_option": "uuid"
    },
    {
      "id_question": "uuid",
      "reponse_texte": "Ma réponse en texte libre"
    }
  ],
  "temps_passe_minutes": 27
}
```

**Response:**
```json
{
  "success": true,
  "message": "Test soumis avec succès",
  "donnees": {
    "id_resultat": "uuid",
    "score_obtenu": 85,
    "pourcentage": 85.0
  }
}
```

### 5. Modifier la visibilité d'un résultat
**PATCH** `/api/tests-psychologiques/candidat/resultats/:id/visibilite`

**Request Body:**
```json
{
  "est_visible": true
}
```

## Logique métier importante

### Calcul des scores
1. **Questions à choix multiple/vrai-faux**: Score de l'option sélectionnée
2. **Échelle Likert**: Score = valeur sélectionnée (1-5)
3. **Texte libre**: Score complet de la question (à ajuster manuellement si nécessaire)

### Validation des tests
- Vérifier que le test est actif et dans sa période de validité
- Vérifier que le candidat n'a pas déjà passé le test
- Valider que toutes les questions obligatoires ont une réponse

### Sécurité
- Authentification JWT requise pour tous les endpoints
- Vérification des rôles (admin vs candidat)
- Validation des données d'entrée
- Protection contre les injections SQL

## Exemple d'implémentation (Express.js)

Voir le fichier `docs/exemple-backend-tests-psychologiques.js` pour un exemple complet d'implémentation.