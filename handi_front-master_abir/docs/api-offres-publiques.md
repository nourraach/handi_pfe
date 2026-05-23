# API Offres d'Emploi Publiques - Spécifications Backend

## 🎯 **Objectif**
Permettre aux candidats de voir toutes les offres d'emploi actives publiées par les entreprises, sans nécessiter d'authentification.

---

## 📋 **1. API OFFRES PUBLIQUES**

### **GET /api/offres/publiques**
Récupérer toutes les offres d'emploi actives (publiques)

#### **Caractéristiques**
- **Authentification** : ❌ Non requise (endpoint public)
- **Rôle requis** : ❌ Aucun (accessible à tous)
- **Filtrage** : Seulement les offres avec `statut = 'active'`

#### **Requête**
```http
GET /api/offres/publiques
Content-Type: application/json
```

#### **Réponse attendue**
```json
{
  "message": "Offres publiques récupérées avec succès",
  "donnees": {
    "offres": [
      {
        "id_offre": "uuid",
        "titre": "Développeur Full Stack",
        "description": "Description complète de l'offre...",
        "localisation": "Paris",
        "type_poste": "cdi",
        "salaire_min": 45000,
        "salaire_max": 55000,
        "competences_requises": "JavaScript, React, Node.js",
        "experience_requise": "2-3 ans",
        "niveau_etude": "Bac+3",
        "statut": "active",
        "date_limite": "2024-12-31T00:00:00.000Z",
        "created_at": "2024-03-01T10:00:00.000Z",
        "candidatures_count": 12,
        "vues_count": 156,
        "nom_entreprise": "TechCorp SARL"
      }
    ]
  }
}
```

#### **Implémentation Backend**
```javascript
app.get('/api/offres/publiques', async (req, res) => {
  try {
    // Récupérer toutes les offres actives avec les infos entreprise
    const offres = await db.query(`
      SELECT 
        oe.id_offre,
        oe.titre,
        oe.description,
        oe.localisation,
        oe.type_poste,
        oe.salaire_min,
        oe.salaire_max,
        oe.competences_requises,
        oe.experience_requise,
        oe.niveau_etude,
        oe.statut,
        oe.date_limite,
        oe.created_at,
        oe.candidatures_count,
        oe.vues_count,
        u.nom as nom_entreprise
      FROM offres_emploi oe
      JOIN utilisateurs u ON oe.id_entreprise = u.id_utilisateur
      WHERE oe.statut = 'active'
      ORDER BY oe.created_at DESC
    `);
    
    res.json({
      message: 'Offres publiques récupérées avec succès',
      donnees: { offres }
    });
  } catch (error) {
    console.error('Erreur récupération offres publiques:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});
```

---

## 📋 **2. API CANDIDATURES**

### **POST /api/candidatures**
Permettre à un candidat de postuler à une offre

#### **Caractéristiques**
- **Authentification** : ✅ Requise (token candidat)
- **Rôle requis** : `candidat`

#### **Requête**
```http
POST /api/candidatures
Authorization: Bearer <candidat_token>
Content-Type: application/json

{
  "id_offre": "uuid-de-l-offre",
  "message_motivation": "Lettre de motivation du candidat..."
}
```

#### **Réponse attendue**
```json
{
  "message": "Candidature envoyée avec succès",
  "donnees": {
    "id_candidature": "uuid",
    "id_offre": "uuid-de-l-offre",
    "id_candidat": "uuid-du-candidat",
    "statut": "en_attente",
    "date_candidature": "2024-03-20T10:00:00.000Z"
  }
}
```

#### **Implémentation Backend**
```javascript
app.post('/api/candidatures', authenticateToken, async (req, res) => {
  try {
    // Vérifier que l'utilisateur est un candidat
    if (req.user.role !== 'candidat') {
      return res.status(403).json({ message: 'Seuls les candidats peuvent postuler' });
    }
    
    const { id_offre, message_motivation } = req.body;
    const id_candidat = req.user.id_utilisateur;
    
    // Vérifier que l'offre existe et est active
    const offre = await db.query(
      'SELECT * FROM offres_emploi WHERE id_offre = ? AND statut = "active"',
      [id_offre]
    );
    
    if (offre.length === 0) {
      return res.status(404).json({ message: 'Offre non trouvée ou inactive' });
    }
    
    // Vérifier que le candidat n'a pas déjà postulé
    const candidatureExistante = await db.query(
      'SELECT * FROM candidatures WHERE id_offre = ? AND id_candidat = ?',
      [id_offre, id_candidat]
    );
    
    if (candidatureExistante.length > 0) {
      return res.status(400).json({ message: 'Vous avez déjà postulé à cette offre' });
    }
    
    // Créer la candidature
    const id_candidature = generateUUID();
    await db.query(`
      INSERT INTO candidatures 
      (id_candidature, id_offre, id_candidat, message_motivation, statut, created_at)
      VALUES (?, ?, ?, ?, 'en_attente', NOW())
    `, [id_candidature, id_offre, id_candidat, message_motivation]);
    
    // Incrémenter le compteur de candidatures
    await db.query(
      'UPDATE offres_emploi SET candidatures_count = candidatures_count + 1 WHERE id_offre = ?',
      [id_offre]
    );
    
    res.status(201).json({
      message: 'Candidature envoyée avec succès',
      donnees: {
        id_candidature,
        id_offre,
        id_candidat,
        statut: 'en_attente',
        date_candidature: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Erreur création candidature:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});
```

---

## 📋 **3. STRUCTURE BASE DE DONNÉES**

### **Table candidatures**
```sql
CREATE TABLE candidatures (
  id_candidature VARCHAR(255) PRIMARY KEY,
  id_offre VARCHAR(255) NOT NULL,
  id_candidat VARCHAR(255) NOT NULL,
  message_motivation TEXT,
  statut ENUM('en_attente', 'acceptee', 'refusee') DEFAULT 'en_attente',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (id_offre) REFERENCES offres_emploi(id_offre),
  FOREIGN KEY (id_candidat) REFERENCES utilisateurs(id_utilisateur),
  UNIQUE KEY unique_candidature (id_offre, id_candidat)
);
```

### **Mise à jour table offres_emploi**
```sql
-- Ajouter les compteurs s'ils n'existent pas
ALTER TABLE offres_emploi 
ADD COLUMN candidatures_count INT DEFAULT 0,
ADD COLUMN vues_count INT DEFAULT 0;

-- Mettre à jour les compteurs existants
UPDATE offres_emploi oe 
SET candidatures_count = (
  SELECT COUNT(*) FROM candidatures c WHERE c.id_offre = oe.id_offre
);
```

---

## 📋 **4. ALTERNATIVE SIMPLE (SANS NOUVELLE API)**

Si vous ne voulez pas créer de nouvelle API, modifiez l'API entreprise existante :

### **Modification de GET /api/entreprise/offres**
```javascript
app.get('/api/entreprise/offres', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      // Pas d'authentification = mode public
      // Retourner toutes les offres actives
      const offres = await db.query(`
        SELECT oe.*, u.nom as nom_entreprise
        FROM offres_emploi oe
        JOIN utilisateurs u ON oe.id_entreprise = u.id_utilisateur
        WHERE oe.statut = 'active'
        ORDER BY oe.created_at DESC
      `);
      
      return res.json({
        message: 'Offres publiques récupérées avec succès',
        donnees: { offres }
      });
    }
    
    // Avec authentification = mode entreprise
    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, JWT_SECRET);
    
    if (decoded.role === 'entreprise') {
      // Retourner seulement les offres de cette entreprise
      const offres = await db.query(
        'SELECT * FROM offres_emploi WHERE id_entreprise = ? ORDER BY created_at DESC',
        [decoded.id_utilisateur]
      );
      
      return res.json({
        message: 'Offres récupérées avec succès',
        donnees: { offres }
      });
    }
    
    // Pour admin ou autres rôles, retourner toutes les offres
    const offres = await db.query(`
      SELECT oe.*, u.nom as nom_entreprise
      FROM offres_emploi oe
      JOIN utilisateurs u ON oe.id_entreprise = u.id_utilisateur
      ORDER BY oe.created_at DESC
    `);
    
    res.json({
      message: 'Offres récupérées avec succès',
      donnees: { offres }
    });
    
  } catch (error) {
    console.error('Erreur récupération offres:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});
```

---

## 🎯 **RÉSUMÉ DES FONCTIONNALITÉS**

### ✅ **Frontend Implémenté**
- Page `/offres` avec affichage de toutes les offres actives
- Filtrage par titre, localisation, type de poste
- Bouton "Postuler" fonctionnel
- Mode fallback avec données de test
- Interface responsive et accessible

### 🔧 **Backend à Implémenter**
- `GET /api/offres/publiques` (optionnel)
- `POST /api/candidatures` (pour postuler)
- Table `candidatures` en base de données
- Ou modification de l'API entreprise existante

### 🚀 **Avantages**
- **Candidats** peuvent voir toutes les offres disponibles
- **Filtrage** pour trouver les offres pertinentes
- **Candidature** en un clic
- **Statistiques** visibles (candidatures, vues)
- **Responsive** et accessible

**La page des offres publiques est maintenant prête pour les candidats !** 🎉