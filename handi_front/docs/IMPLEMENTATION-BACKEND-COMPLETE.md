# Implémentation Backend Complète - APIs Manquantes

## 🎯 **OBJECTIF**
Implémenter toutes les APIs backend manquantes pour finaliser le projet.

---

## 📋 **1. APIS PROFILS UTILISATEUR**

### **A. Profils Candidats**

#### **Structure de table**
```sql
CREATE TABLE profils_candidats (
  id_candidat VARCHAR(255) PRIMARY KEY,
  competences JSON,
  experience TEXT,
  formation TEXT,
  handicap TEXT,
  disponibilite VARCHAR(100) DEFAULT 'Immédiate',
  salaire_souhaite VARCHAR(100),
  cv_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (id_candidat) REFERENCES utilisateurs(id_utilisateur) ON DELETE CASCADE
);
```

#### **GET /api/candidats/profil/:id**
```javascript
app.get('/api/candidats/profil/:id', authenticateToken, async (req, res) => {
  try {
    // Vérifier que l'utilisateur peut accéder à ce profil
    if (req.user.role !== 'admin' && req.user.id_utilisateur !== req.params.id) {
      return res.status(403).json({ message: 'Accès non autorisé' });
    }
    
    const profil = await db.query(`
      SELECT 
        u.nom, u.email, u.telephone, u.addresse,
        pc.competences, pc.experience, pc.formation, 
        pc.handicap, pc.disponibilite, pc.salaire_souhaite, pc.cv_url
      FROM utilisateurs u
      LEFT JOIN profils_candidats pc ON u.id_utilisateur = pc.id_candidat
      WHERE u.id_utilisateur = ? AND u.role = 'candidat'
    `, [req.params.id]);
    
    if (profil.length === 0) {
      return res.status(404).json({ message: 'Profil candidat non trouvé' });
    }
    
    // Parser les compétences JSON
    const profilData = profil[0];
    if (profilData.competences) {
      try {
        profilData.competences = JSON.parse(profilData.competences);
      } catch (e) {
        profilData.competences = [];
      }
    } else {
      profilData.competences = [];
    }
    
    res.json({
      message: 'Profil candidat récupéré avec succès',
      donnees: profilData
    });
  } catch (error) {
    console.error('Erreur récupération profil candidat:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});
```

#### **PUT /api/candidats/profil**
```javascript
app.put('/api/candidats/profil', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'candidat') {
      return res.status(403).json({ message: 'Seuls les candidats peuvent modifier leur profil' });
    }
    
    const { 
      nom, email, telephone, addresse, 
      competences, experience, formation, 
      handicap, disponibilite, salaire_souhaite 
    } = req.body;
    
    const id_candidat = req.user.id_utilisateur;
    
    // Validation
    if (!nom || nom.length < 2) {
      return res.status(400).json({ message: 'Le nom doit contenir au moins 2 caractères' });
    }
    
    if (!email || !email.includes('@')) {
      return res.status(400).json({ message: 'Email invalide' });
    }
    
    // Mettre à jour les données utilisateur de base
    await db.query(`
      UPDATE utilisateurs 
      SET nom = ?, email = ?, telephone = ?, addresse = ?, updated_at = NOW()
      WHERE id_utilisateur = ?
    `, [nom, email, telephone || null, addresse || null, id_candidat]);
    
    // Insérer ou mettre à jour le profil candidat
    await db.query(`
      INSERT INTO profils_candidats 
      (id_candidat, competences, experience, formation, handicap, disponibilite, salaire_souhaite)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
      competences = VALUES(competences),
      experience = VALUES(experience),
      formation = VALUES(formation),
      handicap = VALUES(handicap),
      disponibilite = VALUES(disponibilite),
      salaire_souhaite = VALUES(salaire_souhaite),
      updated_at = NOW()
    `, [
      id_candidat, 
      JSON.stringify(competences || []), 
      experience || null, 
      formation || null, 
      handicap || null, 
      disponibilite || 'Immédiate', 
      salaire_souhaite || null
    ]);
    
    res.json({ 
      message: 'Profil candidat mis à jour avec succès',
      donnees: { id_candidat, nom, email }
    });
  } catch (error) {
    console.error('Erreur mise à jour profil candidat:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});
```

### **B. Profils Entreprises**

#### **Structure de table**
```sql
CREATE TABLE profils_entreprises (
  id_entreprise VARCHAR(255) PRIMARY KEY,
  secteur_activite VARCHAR(255),
  taille_entreprise VARCHAR(100),
  description_entreprise TEXT,
  site_web VARCHAR(255),
  politique_handicap TEXT,
  siret VARCHAR(14),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (id_entreprise) REFERENCES utilisateurs(id_utilisateur) ON DELETE CASCADE
);
```

#### **GET /api/entreprises/profil/:id**
```javascript
app.get('/api/entreprises/profil/:id', authenticateToken, async (req, res) => {
  try {
    // Vérifier les permissions
    if (req.user.role !== 'admin' && req.user.id_utilisateur !== req.params.id) {
      return res.status(403).json({ message: 'Accès non autorisé' });
    }
    
    const profil = await db.query(`
      SELECT 
        u.nom, u.email, u.telephone, u.addresse,
        pe.secteur_activite, pe.taille_entreprise, pe.description_entreprise,
        pe.site_web, pe.politique_handicap, pe.siret
      FROM utilisateurs u
      LEFT JOIN profils_entreprises pe ON u.id_utilisateur = pe.id_entreprise
      WHERE u.id_utilisateur = ? AND u.role = 'entreprise'
    `, [req.params.id]);
    
    if (profil.length === 0) {
      return res.status(404).json({ message: 'Profil entreprise non trouvé' });
    }
    
    res.json({
      message: 'Profil entreprise récupéré avec succès',
      donnees: profil[0]
    });
  } catch (error) {
    console.error('Erreur récupération profil entreprise:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});
```

#### **PUT /api/entreprises/profil**
```javascript
app.put('/api/entreprises/profil', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'entreprise') {
      return res.status(403).json({ message: 'Seules les entreprises peuvent modifier leur profil' });
    }
    
    const { 
      nom, email, telephone, addresse,
      secteur_activite, taille_entreprise, description_entreprise,
      site_web, politique_handicap, siret
    } = req.body;
    
    const id_entreprise = req.user.id_utilisateur;
    
    // Validation
    if (!nom || nom.length < 2) {
      return res.status(400).json({ message: 'Le nom doit contenir au moins 2 caractères' });
    }
    
    // Mettre à jour les données utilisateur de base
    await db.query(`
      UPDATE utilisateurs 
      SET nom = ?, email = ?, telephone = ?, addresse = ?, updated_at = NOW()
      WHERE id_utilisateur = ?
    `, [nom, email, telephone || null, addresse || null, id_entreprise]);
    
    // Insérer ou mettre à jour le profil entreprise
    await db.query(`
      INSERT INTO profils_entreprises 
      (id_entreprise, secteur_activite, taille_entreprise, description_entreprise, site_web, politique_handicap, siret)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
      secteur_activite = VALUES(secteur_activite),
      taille_entreprise = VALUES(taille_entreprise),
      description_entreprise = VALUES(description_entreprise),
      site_web = VALUES(site_web),
      politique_handicap = VALUES(politique_handicap),
      siret = VALUES(siret),
      updated_at = NOW()
    `, [
      id_entreprise,
      secteur_activite || null,
      taille_entreprise || null,
      description_entreprise || null,
      site_web || null,
      politique_handicap || null,
      siret || null
    ]);
    
    res.json({ 
      message: 'Profil entreprise mis à jour avec succès',
      donnees: { id_entreprise, nom, email }
    });
  } catch (error) {
    console.error('Erreur mise à jour profil entreprise:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});
```

---

## 📋 **2. API OFFRES PUBLIQUES**

### **Modification de l'API entreprise existante**
```javascript
app.get('/api/entreprise/offres', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    // CAS 1: Pas d'authentification = Mode public (pour candidats)
    if (!authHeader || authHeader === 'Bearer null' || authHeader === 'Bearer undefined') {
      console.log('Mode public - Retour des offres actives');
      
      const offresPubliques = await db.query(`
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
      
      return res.json({
        message: 'Offres publiques récupérées avec succès',
        donnees: { offres: offresPubliques }
      });
    }
    
    // CAS 2: Avec authentification
    const token = authHeader.replace('Bearer ', '');
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      if (decoded.role === 'entreprise') {
        // Retourner seulement les offres de cette entreprise
        const offresEntreprise = await db.query(`
          SELECT * FROM offres_emploi 
          WHERE id_entreprise = ? 
          ORDER BY created_at DESC
        `, [decoded.id_utilisateur]);
        
        return res.json({
          message: 'Offres de l\'entreprise récupérées avec succès',
          donnees: { offres: offresEntreprise }
        });
      }
      
      if (decoded.role === 'admin') {
        // Admin voit toutes les offres
        const toutesOffres = await db.query(`
          SELECT 
            oe.*,
            u.nom as nom_entreprise
          FROM offres_emploi oe
          JOIN utilisateurs u ON oe.id_entreprise = u.id_utilisateur
          ORDER BY oe.created_at DESC
        `);
        
        return res.json({
          message: 'Toutes les offres récupérées avec succès',
          donnees: { offres: toutesOffres }
        });
      }
      
      // Candidat avec token = mode public
      const offresPubliques = await db.query(`
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
      
      return res.json({
        message: 'Offres publiques récupérées avec succès',
        donnees: { offres: offresPubliques }
      });
      
    } catch (jwtError) {
      // Token invalide = mode public
      console.log('Token invalide, mode public activé');
      
      const offresPubliques = await db.query(`
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
      
      return res.json({
        message: 'Offres publiques récupérées avec succès',
        donnees: { offres: offresPubliques }
      });
    }
    
  } catch (error) {
    console.error('Erreur récupération offres:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});
```

---

## 📋 **3. API CANDIDATURES**

### **Structure de table**
```sql
CREATE TABLE candidatures (
  id_candidature VARCHAR(255) PRIMARY KEY,
  id_offre VARCHAR(255) NOT NULL,
  id_candidat VARCHAR(255) NOT NULL,
  message_motivation TEXT,
  statut ENUM('en_attente', 'acceptee', 'refusee') DEFAULT 'en_attente',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (id_offre) REFERENCES offres_emploi(id_offre) ON DELETE CASCADE,
  FOREIGN KEY (id_candidat) REFERENCES utilisateurs(id_utilisateur) ON DELETE CASCADE,
  UNIQUE KEY unique_candidature (id_offre, id_candidat)
);
```

### **POST /api/candidatures**
```javascript
app.post('/api/candidatures', authenticateToken, async (req, res) => {
  try {
    // Vérifier que l'utilisateur est un candidat
    if (req.user.role !== 'candidat') {
      return res.status(403).json({ message: 'Seuls les candidats peuvent postuler' });
    }
    
    const { id_offre, message_motivation } = req.body;
    const id_candidat = req.user.id_utilisateur;
    
    // Validation
    if (!id_offre) {
      return res.status(400).json({ message: 'ID de l\'offre requis' });
    }
    
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
    `, [id_candidature, id_offre, id_candidat, message_motivation || null]);
    
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
    
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Vous avez déjà postulé à cette offre' });
    }
    
    res.status(500).json({ message: 'Erreur serveur' });
  }
});
```

### **GET /api/candidatures/candidat**
```javascript
app.get('/api/candidatures/candidat', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'candidat') {
      return res.status(403).json({ message: 'Accès non autorisé' });
    }
    
    const candidatures = await db.query(`
      SELECT 
        c.id_candidature,
        c.statut,
        c.message_motivation,
        c.created_at,
        oe.titre,
        oe.localisation,
        oe.type_poste,
        oe.salaire_min,
        oe.salaire_max,
        u.nom as nom_entreprise
      FROM candidatures c
      JOIN offres_emploi oe ON c.id_offre = oe.id_offre
      JOIN utilisateurs u ON oe.id_entreprise = u.id_utilisateur
      WHERE c.id_candidat = ?
      ORDER BY c.created_at DESC
    `, [req.user.id_utilisateur]);
    
    res.json({
      message: 'Candidatures récupérées avec succès',
      donnees: { candidatures }
    });
  } catch (error) {
    console.error('Erreur récupération candidatures:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});
```

### **GET /api/candidatures/entreprise**
```javascript
app.get('/api/candidatures/entreprise', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'entreprise') {
      return res.status(403).json({ message: 'Accès non autorisé' });
    }
    
    const candidatures = await db.query(`
      SELECT 
        c.id_candidature,
        c.statut,
        c.message_motivation,
        c.created_at,
        oe.titre as titre_offre,
        u.nom as nom_candidat,
        u.email as email_candidat,
        u.telephone as telephone_candidat
      FROM candidatures c
      JOIN offres_emploi oe ON c.id_offre = oe.id_offre
      JOIN utilisateurs u ON c.id_candidat = u.id_utilisateur
      WHERE oe.id_entreprise = ?
      ORDER BY c.created_at DESC
    `, [req.user.id_utilisateur]);
    
    res.json({
      message: 'Candidatures reçues récupérées avec succès',
      donnees: { candidatures }
    });
  } catch (error) {
    console.error('Erreur récupération candidatures entreprise:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});
```

---

## 📋 **4. SCRIPT DE CRÉATION DES TABLES**

```sql
-- Script complet de création des tables manquantes

-- Table profils candidats
CREATE TABLE IF NOT EXISTS profils_candidats (
  id_candidat VARCHAR(255) PRIMARY KEY,
  competences JSON,
  experience TEXT,
  formation TEXT,
  handicap TEXT,
  disponibilite VARCHAR(100) DEFAULT 'Immédiate',
  salaire_souhaite VARCHAR(100),
  cv_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (id_candidat) REFERENCES utilisateurs(id_utilisateur) ON DELETE CASCADE
);

-- Table profils entreprises
CREATE TABLE IF NOT EXISTS profils_entreprises (
  id_entreprise VARCHAR(255) PRIMARY KEY,
  secteur_activite VARCHAR(255),
  taille_entreprise VARCHAR(100),
  description_entreprise TEXT,
  site_web VARCHAR(255),
  politique_handicap TEXT,
  siret VARCHAR(14),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (id_entreprise) REFERENCES utilisateurs(id_utilisateur) ON DELETE CASCADE
);

-- Table candidatures
CREATE TABLE IF NOT EXISTS candidatures (
  id_candidature VARCHAR(255) PRIMARY KEY,
  id_offre VARCHAR(255) NOT NULL,
  id_candidat VARCHAR(255) NOT NULL,
  message_motivation TEXT,
  statut ENUM('en_attente', 'acceptee', 'refusee') DEFAULT 'en_attente',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (id_offre) REFERENCES offres_emploi(id_offre) ON DELETE CASCADE,
  FOREIGN KEY (id_candidat) REFERENCES utilisateurs(id_utilisateur) ON DELETE CASCADE,
  UNIQUE KEY unique_candidature (id_offre, id_candidat)
);

-- Ajouter les compteurs aux offres si pas déjà fait
ALTER TABLE offres_emploi 
ADD COLUMN IF NOT EXISTS candidatures_count INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS vues_count INT DEFAULT 0;

-- Mettre à jour les compteurs existants
UPDATE offres_emploi oe 
SET candidatures_count = (
  SELECT COUNT(*) FROM candidatures c WHERE c.id_offre = oe.id_offre
);
```

---

## 🚀 **ORDRE D'IMPLÉMENTATION RECOMMANDÉ**

1. **Créer les tables** avec le script SQL ci-dessus
2. **Implémenter les APIs profils** (candidats et entreprises)
3. **Modifier l'API offres** pour le mode public
4. **Implémenter les APIs candidatures**
5. **Tester chaque API** avec Postman ou curl
6. **Vérifier l'intégration frontend**

**Une fois ces APIs implémentées, le projet sera 100% fonctionnel !** 🎉