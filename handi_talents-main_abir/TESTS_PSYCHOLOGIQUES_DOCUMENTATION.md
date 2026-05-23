# 🧠 Documentation API Tests Psychologiques HandiTalents

## 🚀 Vue d'ensemble

Ce système permet aux administrateurs de créer des tests psychologiques (soft skills) pour évaluer les candidats. Les candidats peuvent passer ces tests une seule fois par période de validité et choisir d'afficher ou masquer leurs résultats.

## 🔐 Authentification

Toutes les API nécessitent un token d'authentification JWT :

```http
Authorization: Bearer <token>
```

## 📊 Architecture du Système

### Tables de Base de Données

1. **test_psychologique** - Informations principales du test
2. **question** - Questions du test
3. **option_reponse** - Options de réponse pour chaque question
4. **resultat_test** - Résultats des candidats
5. **tentative_test** - Suivi des tentatives pour éviter les doublons

### Types de Questions Supportés

- **choix_multiple** - Questions à choix multiples
- **vrai_faux** - Questions vrai/faux
- **echelle_likert** - Échelles de notation (1-5)
- **texte_libre** - Réponses ouvertes

## 🔧 API ADMIN - Gestion des Tests

### 1. Créer un Test

```http
POST /api/tests-psychologiques/admin/tests
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "titre": "Test de Soft Skills - Communication",
  "description": "Évaluation des compétences en communication et travail d'équipe",
  "type_test": "soft_skills",
  "duree_minutes": 30,
  "date_debut_validite": "2024-01-01T00:00:00.000Z",
  "date_fin_validite": "2024-12-31T23:59:59.000Z",
  "instructions": "Répondez honnêtement à toutes les questions.",
  "questions": [
    {
      "contenu_question": "Comment réagissez-vous face à un conflit ?",
      "type_question": "choix_multiple",
      "score_question": 10,
      "ordre": 1,
      "obligatoire": true,
      "options": [
        {
          "texte_option": "J'évite le conflit",
          "est_correcte": false,
          "score_option": 2,
          "ordre": 1
        },
        {
          "texte_option": "J'organise une discussion",
          "est_correcte": true,
          "score_option": 10,
          "ordre": 2
        }
      ]
    }
  ]
}
```

**Réponse :**
```json
{
  "message": "Test créé avec succès",
  "donnees": {
    "id_test": "uuid-du-test",
    "titre": "Test de Soft Skills - Communication",
    "score_total": "30",
    "nombre_questions": 3
  }
}
```

### 2. Lister les Tests

```http
GET /api/tests-psychologiques/admin/tests?page=1&limit=10&statut=actif
```

**Réponse :**
```json
{
  "message": "Tests récupérés avec succès",
  "donnees": {
    "tests": [
      {
        "id_test": "uuid",
        "titre": "Test de Communication",
        "description": "Description du test",
        "type_test": "soft_skills",
        "score_total": "30",
        "duree_minutes": 30,
        "statut": "actif",
        "date_debut_validite": "2024-01-01T00:00:00.000Z",
        "date_fin_validite": "2024-12-31T23:59:59.000Z",
        "created_at": "2024-01-01T10:00:00.000Z",
        "createur": "Admin Principal"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 5,
      "totalPages": 1
    }
  }
}
```

### 3. Obtenir un Test Complet

```http
GET /api/tests-psychologiques/admin/tests/{id_test}
```

**Réponse :**
```json
{
  "message": "Test récupéré avec succès",
  "donnees": {
    "id_test": "uuid",
    "titre": "Test de Communication",
    "description": "Description complète",
    "questions": [
      {
        "id_question": "uuid",
        "contenu_question": "Comment réagissez-vous face à un conflit ?",
        "type_question": "choix_multiple",
        "score_question": "10",
        "ordre": 1,
        "obligatoire": true,
        "options": [
          {
            "id_option": "uuid",
            "texte_option": "J'évite le conflit",
            "est_correcte": false,
            "score_option": "2",
            "ordre": 1
          }
        ]
      }
    ]
  }
}
```

### 4. Modifier un Test

```http
PUT /api/tests-psychologiques/admin/tests/{id_test}
Content-Type: application/json

{
  "titre": "Nouveau titre",
  "statut": "inactif",
  "date_fin_validite": "2024-06-30T23:59:59.000Z"
}
```

### 5. Supprimer un Test

```http
DELETE /api/tests-psychologiques/admin/tests/{id_test}
```

### 6. Obtenir les Statistiques d'un Test

```http
GET /api/tests-psychologiques/admin/tests/{id_test}/statistiques
```

**Réponse :**
```json
{
  "message": "Statistiques récupérées avec succès",
  "donnees": {
    "test": {
      "id_test": "uuid",
      "titre": "Test de Communication",
      "type_test": "soft_skills"
    },
    "statistiques": {
      "nombre_participants": 25,
      "score_moyen": 22.5,
      "score_min": 10,
      "score_max": 30,
      "taux_completion": 92.5,
      "temps_moyen_minutes": 28
    }
  }
}
```

### 7. Obtenir tous les Résultats d'un Test

```http
GET /api/tests-psychologiques/admin/tests/{id_test}/resultats
```

**Réponse :**
```json
{
  "message": "Résultats récupérés avec succès",
  "donnees": {
    "test": {
      "id_test": "uuid",
      "titre": "Test de Communication",
      "score_total": "30"
    },
    "resultats": [
      {
        "id_resultat": "uuid",
        "candidat": {
          "nom": "Ahmed Ben Ali",
          "email": "candidat@example.com"
        },
        "score_obtenu": "25",
        "pourcentage": "83.33",
        "temps_passe_minutes": 28,
        "date_passage": "2024-01-15T14:30:00.000Z",
        "est_visible": true
      }
    ]
  }
}
```

## 👤 API CANDIDAT - Passage des Tests

### 1. Obtenir les Tests Disponibles

```http
GET /api/tests-psychologiques/candidat/tests-disponibles
Authorization: Bearer <candidat_token>
```

**Réponse :**
```json
{
  "message": "Tests disponibles récupérés avec succès",
  "donnees": {
    "tests": [
      {
        "id_test": "uuid",
        "titre": "Test de Communication",
        "description": "Évaluation des compétences...",
        "type_test": "soft_skills",
        "duree_minutes": 30,
        "date_fin_validite": "2024-12-31T23:59:59.000Z",
        "instructions": "Répondez honnêtement...",
        "deja_passe": false,
        "peut_passer": true
      }
    ]
  }
}
```

### 2. Commencer un Test

```http
GET /api/tests-psychologiques/candidat/tests/{id_test}/commencer
```

**Réponse :**
```json
{
  "message": "Test commencé avec succès",
  "donnees": {
    "id_test": "uuid",
    "titre": "Test de Communication",
    "description": "Description du test",
    "duree_minutes": 30,
    "instructions": "Instructions détaillées",
    "questions": [
      {
        "id_question": "uuid",
        "contenu_question": "Comment réagissez-vous face à un conflit ?",
        "type_question": "choix_multiple",
        "ordre": 1,
        "obligatoire": true,
        "options": [
          {
            "id_option": "uuid",
            "texte_option": "J'évite le conflit",
            "ordre": 1
          }
        ]
      }
    ]
  }
}
```

### 3. Soumettre les Réponses

```http
POST /api/tests-psychologiques/candidat/tests/{id_test}/soumettre
Content-Type: application/json

{
  "reponses": [
    {
      "id_question": "uuid-question-1",
      "id_option": "uuid-option-2"
    },
    {
      "id_question": "uuid-question-2",
      "reponse_texte": "Ma réponse détaillée..."
    }
  ],
  "temps_passe_minutes": 25
}
```

**Réponse :**
```json
{
  "message": "Test soumis avec succès",
  "donnees": {
    "id_resultat": "uuid",
    "score_obtenu": "25",
    "pourcentage": "83.33",
    "temps_passe_minutes": 25,
    "date_passage": "2024-01-15T14:30:00.000Z"
  }
}
```

### 4. Obtenir Mes Résultats

```http
GET /api/tests-psychologiques/candidat/mes-resultats
```

**Réponse :**
```json
{
  "message": "Résultats récupérés avec succès",
  "donnees": {
    "resultats": [
      {
        "id_resultat": "uuid",
        "test": {
          "id_test": "uuid",
          "titre": "Test de Communication",
          "type_test": "soft_skills",
          "score_total": "30"
        },
        "score_obtenu": "25",
        "pourcentage": "83.33",
        "temps_passe_minutes": 25,
        "date_passage": "2024-01-15T14:30:00.000Z",
        "est_visible": true,
        "peut_modifier_visibilite": true
      }
    ]
  }
}
```

### 5. Modifier la Visibilité d'un Résultat

```http
PATCH /api/tests-psychologiques/candidat/resultats/{id_resultat}/visibilite
Content-Type: application/json

{
  "est_visible": false
}
```

**Réponse :**
```json
{
  "message": "Visibilité modifiée avec succès",
  "donnees": {
    "id_resultat": "uuid",
    "est_visible": false
  }
}
```

## 🔒 Règles de Sécurité et Validation

### Contrôles d'Accès
- **Admins** : Peuvent créer, modifier, supprimer des tests et voir tous les résultats
- **Candidats** : Peuvent uniquement passer les tests et gérer leurs propres résultats

### Règles Métier
1. **Une seule tentative par période** : Un candidat ne peut passer un test qu'une fois pendant sa période de validité
2. **Tests actifs uniquement** : Seuls les tests avec statut "actif" et dans leur période de validité sont disponibles
3. **Scores automatiques** : Les scores sont calculés automatiquement selon les options correctes
4. **Visibilité contrôlée** : Les candidats peuvent masquer leurs résultats

### Validation des Données
- **Questions obligatoires** : Au moins une question par test
- **Options cohérentes** : Les questions à choix multiple doivent avoir des options
- **Scores positifs** : Tous les scores doivent être positifs
- **Dates valides** : Date de fin postérieure à la date de début

## 📈 Calcul des Scores

### Méthode de Calcul
1. **Score par question** : Basé sur l'option sélectionnée ou le score complet pour texte libre
2. **Score total** : Somme des scores de toutes les questions
3. **Pourcentage** : (Score obtenu / Score maximum) × 100

### Types de Questions
- **Choix multiple** : Score de l'option sélectionnée
- **Vrai/Faux** : Score complet si correct, 0 sinon
- **Échelle Likert** : Score correspondant au niveau sélectionné
- **Texte libre** : Score complet de la question (évaluation manuelle possible)

## 🚀 Déploiement et Configuration

### Scripts Disponibles
```bash
# Générer les migrations
npm run drizzle:generer

# Appliquer les migrations
npm run drizzle:migrer

# Tester les API
npm run tester-tests-psychologiques
```

### Variables d'Environnement
Assurez-vous que votre fichier `.env` contient les configurations de base de données nécessaires.

## 📞 Support et Maintenance

### Monitoring
- Surveillez les statistiques de passage des tests
- Vérifiez les taux de completion
- Analysez les scores moyens par test

### Maintenance
- Archivez les anciens tests
- Nettoyez les tentatives non terminées
- Sauvegardez régulièrement les résultats

Ce système offre une solution complète pour l'évaluation des soft skills des candidats avec un contrôle total pour les administrateurs et une expérience utilisateur optimale pour les candidats.