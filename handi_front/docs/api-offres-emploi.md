# API Endpoints - Gestion des Offres d'Emploi (Entreprise)

## 🔐 Authentification
Toutes les API nécessitent un token d'authentification entreprise dans le header :
```
Authorization: Bearer <entreprise_token>
```

---

## 📋 1. LISTER LES OFFRES D'EMPLOI DE L'ENTREPRISE

### Endpoint
```http
GET /api/entreprise/offres
```

### Headers
```
Authorization: Bearer <token>
Content-Type: application/json
```

### Réponse attendue
```json
{
  "message": "Offres récupérées avec succès",
  "donnees": {
    "offres": [
      {
        "id_offre": 123,
        "titre": "Développeur Full Stack",
        "description": "Nous recherchons un développeur passionné...",
        "localisation": "Paris",
        "type_poste": "CDI",
        "salaire_min": 45000,
        "salaire_max": 55000,
        "date_limite": "2024-04-15",
        "competences_requises": "JavaScript, React, Node.js",
        "experience_requise": "2-3 ans",
        "niveau_etude": "Bac+3",
        "statut": "active",
        "created_at": "2024-03-01T10:00:00Z",
        "updated_at": "2024-03-01T10:00:00Z",
        "candidatures_count": 12,
        "vues_count": 156
      }
    ]
  }
}
```

---

## ➕ 2. CRÉER UNE NOUVELLE OFFRE D'EMPLOI

### Endpoint
```http
POST /api/entreprise/offres
```

### Headers
```
Authorization: Bearer <token>
Content-Type: application/json
```

### Body
```json
{
  "titre": "Développeur Full Stack",
  "description": "Nous recherchons un développeur passionné pour rejoindre notre équipe dynamique. Vous travaillerez sur des projets innovants...",
  "localisation": "Paris",
  "type_poste": "CDI",
  "salaire_min": 45000,
  "salaire_max": 55000,
  "date_limite": "2024-04-15",
  "competences_requises": "JavaScript, React, Node.js, MongoDB",
  "experience_requise": "2-3 ans",
  "niveau_etude": "Bac+3 en informatique"
}
```

### Validation
- **titre** : Obligatoire, minimum 3 caractères
- **description** : Obligatoire, minimum 50 caractères
- **localisation** : Obligatoire
- **type_poste** : Obligatoire, valeurs acceptées : CDI, CDD, Stage, Freelance, Alternance
- **salaire_min** : Optionnel, nombre positif
- **salaire_max** : Optionnel, nombre positif, doit être >= salaire_min
- **date_limite** : Optionnel, format YYYY-MM-DD, doit être dans le futur

### Réponse attendue
```json
{
  "message": "Offre créée avec succès",
  "donnees": {
    "id_offre": 124,
    "titre": "Développeur Full Stack",
    "statut": "active",
    "created_at": "2024-03-20T14:30:00Z"
  }
}
```

---

## ✏️ 3. MODIFIER UNE OFFRE D'EMPLOI

### Endpoint
```http
PUT /api/entreprise/offres/{id_offre}
```

### Headers
```
Authorization: Bearer <token>
Content-Type: application/json
```

### Body
```json
{
  "titre": "Développeur Full Stack Senior",
  "description": "Description mise à jour...",
  "localisation": "Paris / Télétravail",
  "type_poste": "CDI",
  "salaire_min": 50000,
  "salaire_max": 60000,
  "date_limite": "2024-05-15",
  "competences_requises": "JavaScript, React, Node.js, TypeScript",
  "experience_requise": "3-5 ans",
  "niveau_etude": "Bac+3/5 en informatique"
}
```

### Réponse attendue
```json
{
  "message": "Offre modifiée avec succès",
  "donnees": {
    "id_offre": 124,
    "titre": "Développeur Full Stack Senior",
    "updated_at": "2024-03-20T15:00:00Z"
  }
}
```

---

## 🗑️ 4. SUPPRIMER UNE OFFRE D'EMPLOI

### Endpoint
```http
DELETE /api/entreprise/offres/{id_offre}
```

### Headers
```
Authorization: Bearer <token>
```

### Réponse attendue
```json
{
  "message": "Offre supprimée avec succès",
  "donnees": {
    "id_offre": 124,
    "supprime_le": "2024-03-20T15:30:00Z"
  }
}
```

---

## 🔄 5. CHANGER LE STATUT D'UNE OFFRE

### Endpoint
```http
PATCH /api/entreprise/offres/{id_offre}/statut
```

### Headers
```
Authorization: Bearer <token>
Content-Type: application/json
```

### Body
```json
{
  "statut": "inactive"
}
```

### Statuts valides
- **active** : Offre visible et ouverte aux candidatures
- **inactive** : Offre masquée temporairement
- **pourvue** : Poste pourvu, offre fermée
- **expiree** : Offre expirée (géré automatiquement)

### Réponse attendue
```json
{
  "message": "Statut modifié avec succès",
  "donnees": {
    "id_offre": 124,
    "ancien_statut": "active",
    "nouveau_statut": "inactive",
    "modifie_le": "2024-03-20T16:00:00Z"
  }
}
```

---

## 📊 6. STATISTIQUES D'UNE OFFRE (Optionnel)

### Endpoint
```http
GET /api/entreprise/offres/{id_offre}/statistiques
```

### Réponse attendue
```json
{
  "message": "Statistiques récupérées avec succès",
  "donnees": {
    "id_offre": 124,
    "vues_count": 156,
    "candidatures_count": 12,
    "candidatures_par_jour": [
      {
        "date": "2024-03-15",
        "count": 3
      },
      {
        "date": "2024-03-16", 
        "count": 5
      }
    ],
    "vues_par_jour": [
      {
        "date": "2024-03-15",
        "count": 25
      }
    ]
  }
}
```

---

## 🔒 Sécurité et Autorisation

### Vérifications côté backend :
1. **Token valide** : Vérifier que le token JWT est valide
2. **Rôle entreprise** : Vérifier que l'utilisateur a le rôle "entreprise"
3. **Propriété** : Une entreprise ne peut modifier que ses propres offres
4. **Validation des données** : Valider tous les champs selon les règles définies

### Exemple de vérification d'autorisation :
```javascript
// Vérifier que l'offre appartient à l'entreprise connectée
const offre = await getOffreById(id_offre);
if (offre.id_entreprise !== user.id_utilisateur) {
  return res.status(403).json({
    message: "Accès refusé - Cette offre ne vous appartient pas"
  });
}
```

---

## 🚨 Gestion d'erreurs

### Erreurs d'authentification
```json
{
  "message": "Token manquant ou invalide",
  "code": 401
}
```

### Erreurs d'autorisation
```json
{
  "message": "Accès refusé - Entreprise requise",
  "code": 403
}
```

### Erreurs de validation
```json
{
  "message": "Données invalides",
  "erreurs": {
    "titre": "Le titre doit contenir au moins 3 caractères",
    "description": "La description doit contenir au moins 50 caractères",
    "salaire_max": "Le salaire maximum doit être supérieur au salaire minimum"
  },
  "code": 400
}
```

### Offre non trouvée
```json
{
  "message": "Offre non trouvée",
  "code": 404
}
```

### Erreur serveur
```json
{
  "message": "Erreur interne du serveur",
  "code": 500
}
```

---

## 🗄️ Structure de Base de Données

### Table `offres_emploi`
```sql
CREATE TABLE offres_emploi (
  id_offre INT PRIMARY KEY AUTO_INCREMENT,
  id_entreprise INT NOT NULL,
  titre VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  localisation VARCHAR(255) NOT NULL,
  type_poste ENUM('CDI', 'CDD', 'Stage', 'Freelance', 'Alternance') NOT NULL,
  salaire_min DECIMAL(10,2),
  salaire_max DECIMAL(10,2),
  date_limite DATE,
  competences_requises TEXT,
  experience_requise VARCHAR(255),
  niveau_etude VARCHAR(255),
  statut ENUM('active', 'inactive', 'pourvue', 'expiree') DEFAULT 'active',
  vues_count INT DEFAULT 0,
  candidatures_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (id_entreprise) REFERENCES utilisateurs(id_utilisateur) ON DELETE CASCADE,
  INDEX idx_entreprise (id_entreprise),
  INDEX idx_statut (statut),
  INDEX idx_date_limite (date_limite),
  INDEX idx_created_at (created_at)
);
```

### Contraintes et index
- **Clé étrangère** : `id_entreprise` référence `utilisateurs.id_utilisateur`
- **Index** sur `id_entreprise` pour les requêtes par entreprise
- **Index** sur `statut` pour filtrer les offres actives
- **Index** sur `date_limite` pour gérer les expirations
- **Cascade DELETE** : Supprimer les offres si l'entreprise est supprimée

---

## 📝 Exemples d'utilisation Frontend

### Charger les offres
```javascript
const chargerOffres = async () => {
  const token = localStorage.getItem("token_auth");
  const response = await fetch("http://localhost:4000/api/entreprise/offres", {
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    }
  });
  
  if (response.ok) {
    const data = await response.json();
    setOffres(data.donnees.offres);
  }
};
```

### Créer une offre
```javascript
const creerOffre = async (offreData) => {
  const token = localStorage.getItem("token_auth");
  const response = await fetch("http://localhost:4000/api/entreprise/offres", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(offreData)
  });
  
  if (response.ok) {
    const data = await response.json();
    console.log("Offre créée:", data);
    chargerOffres(); // Recharger la liste
  }
};
```

---

## ✅ Tests de validation

### Test de création d'offre
```bash
curl -X POST http://localhost:4000/api/entreprise/offres \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "titre": "Test Développeur",
    "description": "Description de test avec plus de 50 caractères pour respecter la validation",
    "localisation": "Paris",
    "type_poste": "CDI"
  }'
```

### Test de modification de statut
```bash
curl -X PATCH http://localhost:4000/api/entreprise/offres/123/statut \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"statut": "inactive"}'
```

Cette documentation couvre tous les aspects de l'API de gestion des offres d'emploi pour les entreprises.