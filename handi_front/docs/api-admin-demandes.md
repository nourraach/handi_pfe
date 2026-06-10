# API Endpoints - Gestion des Demandes d'Inscription (Admin)

## 🔐 Authentification
Toutes les API nécessitent un token d'authentification admin dans le header :
```
Authorization: Bearer <admin_token>
```

---

## 📋 1. LISTER LES DEMANDES EN ATTENTE

### Endpoint
```http
GET /api/admin/demandes-en-attente
```

### Headers
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

### Réponse attendue
```json
{
  "message": "Demandes récupérées avec succès",
  "donnees": [
    {
      "id_utilisateur": "123",
      "nom": "Jean Dupont",
      "email": "jean.dupont@email.com",
      "role": "candidat",
      "statut": "en_attente",
      "telephone": "0123456789",
      "addresse": "123 Rue de la Paix, Paris",
      "created_at": "2024-03-15T10:00:00Z",
      "profil_candidat": {
        "competences": ["JavaScript", "React"],
        "experience": "2 ans",
        "formation": "Master Informatique",
        "handicap": "Mobilité réduite"
      },
      "profil_entreprise": null
    },
    {
      "id_utilisateur": "124",
      "nom": "Entreprise Tech",
      "email": "contact@entreprisetech.com",
      "role": "entreprise",
      "statut": "en_attente",
      "telephone": "0987654321",
      "addresse": "456 Avenue Innovation, Lyon",
      "created_at": "2024-03-16T14:30:00Z",
      "profil_candidat": null,
      "profil_entreprise": {
        "secteur": "Technologie",
        "taille": "50-100 employés",
        "description": "Entreprise spécialisée en développement web"
      }
    }
  ]
}
```

---

## ✅ 2. APPROUVER UNE DEMANDE D'INSCRIPTION

### Endpoint
```http
POST /api/admin/approuver/{id_utilisateur}
```

### Headers
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

### Paramètres
- `id_utilisateur` : ID de l'utilisateur à approuver

### Réponse attendue
```json
{
  "message": "Demande approuvée avec succès",
  "donnees": {
    "id_utilisateur": "123",
    "ancien_statut": "en_attente",
    "nouveau_statut": "actif",
    "approuve_par": "admin_456",
    "date_approbation": "2024-03-20T16:00:00Z"
  }
}
```

### Actions effectuées côté backend
1. **Changer le statut** de "en_attente" vers "actif"
2. **Enregistrer l'historique** de l'approbation
3. **Envoyer un email** de confirmation à l'utilisateur (optionnel)
4. **Activer les permissions** selon le rôle

---

## ❌ 3. REFUSER UNE DEMANDE D'INSCRIPTION

### Endpoint
```http
POST /api/admin/refuser/{id_utilisateur}
```

### Headers
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

### Body (optionnel)
```json
{
  "motif": "Informations incomplètes",
  "commentaire": "Veuillez compléter votre profil et soumettre à nouveau votre demande."
}
```

### Réponse attendue
```json
{
  "message": "Demande refusée avec succès",
  "donnees": {
    "id_utilisateur": "124",
    "ancien_statut": "en_attente",
    "nouveau_statut": "refuse",
    "refuse_par": "admin_456",
    "date_refus": "2024-03-20T16:15:00Z",
    "motif": "Informations incomplètes"
  }
}
```

### Actions effectuées côté backend
1. **Changer le statut** de "en_attente" vers "refuse"
2. **Enregistrer l'historique** du refus avec motif
3. **Envoyer un email** d'explication à l'utilisateur (optionnel)
4. **Supprimer le compte** après X jours (optionnel)

---

## 📊 4. STATISTIQUES DES DEMANDES (Optionnel)

### Endpoint
```http
GET /api/admin/demandes/statistiques
```

### Réponse attendue
```json
{
  "message": "Statistiques récupérées avec succès",
  "donnees": {
    "total_en_attente": 15,
    "total_approuvees_ce_mois": 45,
    "total_refusees_ce_mois": 8,
    "repartition_roles": {
      "candidat": 10,
      "entreprise": 5
    },
    "temps_moyen_traitement_heures": 24,
    "demandes_par_jour": [
      {
        "date": "2024-03-15",
        "nouvelles": 3,
        "approuvees": 5,
        "refusees": 1
      }
    ]
  }
}
```

---

## 🔒 Sécurité et Autorisation

### Vérifications côté backend
1. **Token valide** : Vérifier que le token JWT est valide
2. **Rôle admin** : Vérifier que l'utilisateur a le rôle "admin"
3. **Permissions** : Vérifier les permissions d'approbation/refus
4. **Audit trail** : Enregistrer toutes les actions admin

### Exemple de vérification
```javascript
// Middleware d'authentification admin
const requireAdmin = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ message: 'Token manquant' });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    if (decoded.role !== 'admin') {
      return res.status(403).json({ message: 'Accès refusé - Admin requis' });
    }
    
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token invalide' });
  }
};
```

---

## 🗄️ Structure de Base de Données

### Requêtes SQL utiles

#### Lister les demandes en attente
```sql
SELECT 
  u.id_utilisateur,
  u.nom,
  u.email,
  u.role,
  u.statut,
  u.telephone,
  u.addresse,
  u.created_at,
  pc.competences,
  pc.experience,
  pc.formation,
  pc.handicap,
  pe.secteur,
  pe.taille,
  pe.description as entreprise_description
FROM utilisateurs u
LEFT JOIN profils_candidats pc ON u.id_utilisateur = pc.id_utilisateur
LEFT JOIN profils_entreprises pe ON u.id_utilisateur = pe.id_utilisateur
WHERE u.statut = 'en_attente'
ORDER BY u.created_at ASC;
```

#### Approuver une demande
```sql
-- Mettre à jour le statut
UPDATE utilisateurs 
SET statut = 'actif', updated_at = NOW() 
WHERE id_utilisateur = ? AND statut = 'en_attente';

-- Enregistrer l'historique
INSERT INTO audit_actions_admin (
  admin_id, utilisateur_cible_id, type_action, 
  anciennes_valeurs, nouvelles_valeurs, date_action
) VALUES (
  ?, ?, 'approbation',
  '{"statut": "en_attente"}',
  '{"statut": "actif"}',
  NOW()
);
```

#### Refuser une demande
```sql
-- Mettre à jour le statut
UPDATE utilisateurs 
SET statut = 'refuse', updated_at = NOW() 
WHERE id_utilisateur = ? AND statut = 'en_attente';

-- Enregistrer l'historique avec motif
INSERT INTO audit_actions_admin (
  admin_id, utilisateur_cible_id, type_action,
  anciennes_valeurs, nouvelles_valeurs, commentaire, date_action
) VALUES (
  ?, ?, 'refus',
  '{"statut": "en_attente"}',
  '{"statut": "refuse"}',
  ?, -- motif du refus
  NOW()
);
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
  "message": "Accès refusé - Admin requis",
  "code": 403
}
```

### Utilisateur non trouvé
```json
{
  "message": "Utilisateur non trouvé ou déjà traité",
  "code": 404
}
```

### Erreur de statut
```json
{
  "message": "L'utilisateur n'est pas en attente d'approbation",
  "code": 400
}
```

---

## 📝 Exemples d'implémentation Backend

### Endpoint de liste des demandes
```javascript
app.get('/api/admin/demandes-en-attente', requireAdmin, async (req, res) => {
  try {
    const demandes = await db.query(`
      SELECT 
        u.id_utilisateur, u.nom, u.email, u.role, u.statut,
        u.telephone, u.addresse, u.created_at,
        pc.competences, pc.experience, pc.formation, pc.handicap,
        pe.secteur, pe.taille, pe.description as entreprise_description
      FROM utilisateurs u
      LEFT JOIN profils_candidats pc ON u.id_utilisateur = pc.id_utilisateur
      LEFT JOIN profils_entreprises pe ON u.id_utilisateur = pe.id_utilisateur
      WHERE u.statut = 'en_attente'
      ORDER BY u.created_at ASC
    `);
    
    res.json({
      message: 'Demandes récupérées avec succès',
      donnees: demandes
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});
```

### Endpoint d'approbation
```javascript
app.post('/api/admin/approuver/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  
  try {
    // Vérifier que l'utilisateur existe et est en attente
    const user = await db.query(
      'SELECT * FROM utilisateurs WHERE id_utilisateur = ? AND statut = "en_attente"',
      [id]
    );
    
    if (user.length === 0) {
      return res.status(404).json({
        message: 'Utilisateur non trouvé ou déjà traité'
      });
    }
    
    // Approuver l'utilisateur
    await db.query(
      'UPDATE utilisateurs SET statut = "actif", updated_at = NOW() WHERE id_utilisateur = ?',
      [id]
    );
    
    // Enregistrer l'audit
    await db.query(`
      INSERT INTO audit_actions_admin (
        admin_id, utilisateur_cible_id, type_action,
        anciennes_valeurs, nouvelles_valeurs, date_action
      ) VALUES (?, ?, 'approbation', '{"statut": "en_attente"}', '{"statut": "actif"}', NOW())
    `, [req.user.id_utilisateur, id]);
    
    res.json({
      message: 'Demande approuvée avec succès',
      donnees: {
        id_utilisateur: id,
        ancien_statut: 'en_attente',
        nouveau_statut: 'actif',
        approuve_par: req.user.id_utilisateur,
        date_approbation: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});
```

Cette documentation couvre tous les aspects nécessaires pour implémenter la gestion des demandes d'inscription côté backend.