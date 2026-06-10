# API Endpoints - Gestion des Utilisateurs (Admin)

## 🔐 Authentification
Toutes les API nécessitent un token d'authentification admin dans le header :
```
Authorization: Bearer <admin_token>
```

---

## 📋 1. LISTER LES UTILISATEURS (avec pagination et filtres)

### Endpoint
```http
GET /api/admin/utilisateurs
```

### Query Parameters
```
page: number (défaut: 1)
limit: number (défaut: 10, max: 100)
role: string (optionnel: candidat|entreprise|admin)
statut: string (optionnel: actif|inactif|en_attente|suspendu)
dateDebut: string (optionnel: YYYY-MM-DD)
dateFin: string (optionnel: YYYY-MM-DD)
recherche: string (optionnel: recherche dans nom/email)
```

### Exemple de requête
```
GET /api/admin/utilisateurs?page=1&limit=10&role=candidat&statut=actif&dateDebut=2024-01-01
```

### Réponse attendue
```json
{
  "message": "Utilisateurs récupérés avec succès",
  "donnees": {
    "utilisateurs": [
      {
        "id_utilisateur": "123",
        "nom": "Jean Dupont",
        "email": "jean.dupont@email.com",
        "role": "candidat",
        "statut": "actif",
        "telephone": "0123456789",
        "addresse": "123 Rue de la Paix, Paris",
        "created_at": "2024-01-15T10:30:00Z",
        "updated_at": "2024-01-20T14:45:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 150,
      "totalPages": 15
    },
    "statistiques": {
      "total": 150,
      "actifs": 120,
      "en_attente": 20,
      "suspendus": 10,
      "par_role": {
        "candidat": 100,
        "entreprise": 45,
        "admin": 5
      }
    }
  }
}
```

---

## 👤 2. RÉCUPÉRER UN UTILISATEUR SPÉCIFIQUE

### Endpoint
```http
GET /api/admin/utilisateurs/{id_utilisateur}
```

### Réponse attendue
```json
{
  "message": "Utilisateur récupéré avec succès",
  "donnees": {
    "id_utilisateur": "123",
    "nom": "Jean Dupont",
    "email": "jean.dupont@email.com",
    "role": "candidat",
    "statut": "actif",
    "telephone": "0123456789",
    "addresse": "123 Rue de la Paix, Paris",
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-20T14:45:00Z",
    "derniere_connexion": "2024-01-25T09:15:00Z",
    "profil_complete": true
  }
}
```

---

## ➕ 3. CRÉER UN NOUVEL UTILISATEUR

### Endpoint
```http
POST /api/admin/utilisateurs
```

### Body
```json
{
  "nom": "Marie Martin",
  "email": "marie.martin@email.com",
  "mot_de_passe": "MotDePasseSecurise123!",
  "role": "candidat",
  "statut": "actif",
  "telephone": "0987654321",
  "addresse": "456 Avenue des Champs, Lyon"
}
```

### Réponse attendue
```json
{
  "message": "Utilisateur créé avec succès",
  "donnees": {
    "id_utilisateur": "456",
    "nom": "Marie Martin",
    "email": "marie.martin@email.com",
    "role": "candidat",
    "statut": "actif"
  }
}
```

---

## ✏️ 4. MODIFIER UN UTILISATEUR

### Endpoint
```http
PUT /api/admin/utilisateurs/{id_utilisateur}
```

### Body
```json
{
  "nom": "Marie Martin-Dupont",
  "email": "marie.martin-dupont@email.com",
  "role": "candidat",
  "statut": "actif",
  "telephone": "0987654321",
  "addresse": "789 Boulevard Nouveau, Lyon"
}
```

### Réponse attendue
```json
{
  "message": "Utilisateur modifié avec succès",
  "donnees": {
    "id_utilisateur": "456",
    "nom": "Marie Martin-Dupont",
    "email": "marie.martin-dupont@email.com"
  }
}
```

---

## 🗑️ 5. SUPPRIMER UN UTILISATEUR

### Endpoint
```http
DELETE /api/admin/utilisateurs/{id_utilisateur}
```

### Réponse attendue
```json
{
  "message": "Utilisateur supprimé avec succès",
  "donnees": {
    "id_utilisateur": "456",
    "supprime_le": "2024-01-25T15:30:00Z"
  }
}
```

---

## 🔄 6. CHANGER LE STATUT D'UN UTILISATEUR

### Endpoint
```http
PATCH /api/admin/utilisateurs/{id_utilisateur}/statut
```

### Body
```json
{
  "statut": "suspendu"
}
```

### Réponse attendue
```json
{
  "message": "Statut modifié avec succès",
  "donnees": {
    "id_utilisateur": "123",
    "ancien_statut": "actif",
    "nouveau_statut": "suspendu",
    "modifie_le": "2024-01-25T16:00:00Z"
  }
}
```

---

## 🔑 7. RÉINITIALISER LE MOT DE PASSE

### Endpoint
```http
POST /api/admin/utilisateurs/{id_utilisateur}/reset-password
```

### Réponse attendue
```json
{
  "message": "Mot de passe réinitialisé avec succès",
  "donnees": {
    "id_utilisateur": "123",
    "nouveauMotDePasse": "TempPass2024!",
    "expire_le": "2024-01-26T16:00:00Z"
  }
}
```

---

## 📊 8. EXPORTER LES UTILISATEURS (CSV)

### Endpoint
```http
GET /api/admin/utilisateurs/export
```

### Query Parameters (mêmes que pour la liste)
```
role: string (optionnel)
statut: string (optionnel)
dateDebut: string (optionnel)
dateFin: string (optionnel)
format: string (défaut: csv, options: csv|xlsx)
```

### Réponse attendue
```
Content-Type: text/csv
Content-Disposition: attachment; filename="utilisateurs_2024-01-25.csv"

id_utilisateur,nom,email,role,statut,telephone,created_at
123,"Jean Dupont","jean.dupont@email.com","candidat","actif","0123456789","2024-01-15"
456,"Marie Martin","marie.martin@email.com","entreprise","actif","0987654321","2024-01-16"
```

---

## 📈 9. STATISTIQUES DÉTAILLÉES

### Endpoint
```http
GET /api/admin/utilisateurs/statistiques
```

### Query Parameters
```
periode: string (optionnel: jour|semaine|mois|annee, défaut: mois)
dateDebut: string (optionnel)
dateFin: string (optionnel)
```

### Réponse attendue
```json
{
  "message": "Statistiques récupérées avec succès",
  "donnees": {
    "total_utilisateurs": 150,
    "nouveaux_utilisateurs_periode": 25,
    "utilisateurs_actifs_periode": 120,
    "repartition_roles": {
      "candidat": 100,
      "entreprise": 45,
      "admin": 5
    },
    "repartition_statuts": {
      "actif": 120,
      "inactif": 10,
      "en_attente": 15,
      "suspendu": 5
    },
    "evolution_mensuelle": [
      {
        "mois": "2024-01",
        "nouveaux": 25,
        "actifs": 120
      }
    ],
    "top_domaines_email": [
      {
        "domaine": "gmail.com",
        "count": 45
      },
      {
        "domaine": "outlook.com",
        "count": 30
      }
    ]
  }
}
```

---

## 🔍 10. RECHERCHE AVANCÉE

### Endpoint
```http
POST /api/admin/utilisateurs/recherche
```

### Body
```json
{
  "criteres": {
    "nom": "Jean",
    "email_domaine": "gmail.com",
    "role": ["candidat", "entreprise"],
    "statut": ["actif"],
    "date_creation_apres": "2024-01-01",
    "date_creation_avant": "2024-01-31",
    "derniere_connexion_apres": "2024-01-20",
    "a_profil_complete": true,
    "ville": "Paris"
  },
  "tri": {
    "champ": "created_at",
    "ordre": "desc"
  },
  "pagination": {
    "page": 1,
    "limit": 20
  }
}
```

### Réponse attendue
```json
{
  "message": "Recherche effectuée avec succès",
  "donnees": {
    "utilisateurs": [...],
    "pagination": {...},
    "criteres_appliques": {...}
  }
}
```

---

## 📝 11. HISTORIQUE DES ACTIONS

### Endpoint
```http
GET /api/admin/utilisateurs/{id_utilisateur}/historique
```

### Réponse attendue
```json
{
  "message": "Historique récupéré avec succès",
  "donnees": {
    "actions": [
      {
        "id_action": "789",
        "type_action": "modification_statut",
        "ancien_statut": "actif",
        "nouveau_statut": "suspendu",
        "admin_id": "admin123",
        "admin_nom": "Admin Test",
        "date_action": "2024-01-25T16:00:00Z",
        "commentaire": "Suspension temporaire"
      },
      {
        "id_action": "788",
        "type_action": "creation",
        "admin_id": "admin123",
        "admin_nom": "Admin Test",
        "date_action": "2024-01-15T10:30:00Z"
      }
    ]
  }
}
```

---

## 🔒 Sécurité et Validation

### Validation côté backend :
1. **Authentification admin** : Vérifier que l'utilisateur est admin
2. **Validation des données** :
   - Email unique et valide
   - Mot de passe sécurisé (8+ caractères, majuscules, chiffres)
   - Rôles valides (candidat, entreprise, admin)
   - Statuts valides (actif, inactif, en_attente, suspendu)
3. **Limitations** :
   - Un admin ne peut pas se supprimer lui-même
   - Un admin ne peut pas changer son propre rôle
   - Limite de 100 utilisateurs par page

### Gestion d'erreurs :
```json
// Erreur d'autorisation
{
  "message": "Accès non autorisé - Admin requis",
  "code": 403
}

// Erreur de validation
{
  "message": "Données invalides",
  "erreurs": {
    "email": "Email déjà utilisé",
    "mot_de_passe": "Mot de passe trop faible"
  },
  "code": 400
}

// Utilisateur non trouvé
{
  "message": "Utilisateur non trouvé",
  "code": 404
}
```

---

## 🗄️ Structure de Base de Données

### Modifications nécessaires à la table `utilisateurs` :
```sql
ALTER TABLE utilisateurs 
ADD COLUMN derniere_connexion TIMESTAMP NULL,
ADD COLUMN profil_complete BOOLEAN DEFAULT FALSE,
ADD INDEX idx_role (role),
ADD INDEX idx_statut (statut),
ADD INDEX idx_created_at (created_at),
ADD INDEX idx_email (email);
```

### Table d'audit des actions admin :
```sql
CREATE TABLE audit_actions_admin (
  id_action INT PRIMARY KEY AUTO_INCREMENT,
  admin_id INT NOT NULL,
  utilisateur_cible_id INT NOT NULL,
  type_action ENUM('creation', 'modification', 'suppression', 'changement_statut', 'reset_password') NOT NULL,
  anciennes_valeurs JSON,
  nouvelles_valeurs JSON,
  commentaire TEXT,
  date_action TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (admin_id) REFERENCES utilisateurs(id_utilisateur),
  FOREIGN KEY (utilisateur_cible_id) REFERENCES utilisateurs(id_utilisateur),
  INDEX idx_admin (admin_id),
  INDEX idx_cible (utilisateur_cible_id),
  INDEX idx_date (date_action)
);
```

---

## 📊 Requêtes SQL Utiles

### Statistiques par rôle :
```sql
SELECT 
  role,
  COUNT(*) as total,
  COUNT(CASE WHEN statut = 'actif' THEN 1 END) as actifs,
  COUNT(CASE WHEN statut = 'en_attente' THEN 1 END) as en_attente
FROM utilisateurs 
GROUP BY role;
```

### Utilisateurs récents :
```sql
SELECT * FROM utilisateurs 
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
ORDER BY created_at DESC;
```

### Recherche avec filtres :
```sql
SELECT * FROM utilisateurs 
WHERE 
  (nom LIKE '%search%' OR email LIKE '%search%')
  AND (role = 'candidat' OR role IS NULL)
  AND statut = 'actif'
  AND created_at BETWEEN '2024-01-01' AND '2024-01-31'
ORDER BY created_at DESC
LIMIT 10 OFFSET 0;
```

Cette documentation couvre tous les besoins du frontend pour la gestion complète des utilisateurs par les administrateurs.