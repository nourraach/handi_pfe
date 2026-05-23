// Exemple d'implémentation backend pour les API profils
// Framework : Express.js avec MySQL

const express = require('express');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise');
const router = express.Router();

// Middleware d'authentification
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Token d\'accès requis' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Token invalide' });
    }
    req.user = user;
    next();
  });
};

// Configuration de la base de données
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
};

// ============================================================================
// API CANDIDAT
// ============================================================================

// GET /api/candidats/profil/:id_utilisateur
router.get('/candidats/profil/:id_utilisateur', authenticateToken, async (req, res) => {
  try {
    const { id_utilisateur } = req.params;
    
    // Vérifier que l'utilisateur peut accéder à ce profil
    if (req.user.id_utilisateur !== id_utilisateur && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Accès non autorisé' });
    }

    const connection = await mysql.createConnection(dbConfig);
    
    // Récupérer les données utilisateur et profil candidat
    const [rows] = await connection.execute(`
      SELECT 
        u.nom, u.email, u.telephone, u.addresse,
        pc.competences, pc.experience, pc.formation, pc.handicap,
        pc.disponibilite, pc.salaire_souhaite, pc.cv_url
      FROM utilisateurs u
      LEFT JOIN profils_candidats pc ON u.id_utilisateur = pc.id_utilisateur
      WHERE u.id_utilisateur = ? AND u.role = 'candidat'
    `, [id_utilisateur]);

    await connection.end();

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Profil candidat non trouvé' });
    }

    const profil = rows[0];
    // Parser les compétences JSON
    if (profil.competences) {
      profil.competences = JSON.parse(profil.competences);
    } else {
      profil.competences = [];
    }

    res.json({
      message: 'Profil récupéré avec succès',
      donnees: profil
    });

  } catch (error) {
    console.error('Erreur lors de la récupération du profil candidat:', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});

// PUT /api/candidats/profil
router.put('/candidats/profil', authenticateToken, async (req, res) => {
  try {
    const {
      nom, email, telephone, addresse,
      competences, experience, formation, handicap,
      disponibilite, salaire_souhaite
    } = req.body;

    const id_utilisateur = req.user.id_utilisateur;

    // Validation des données
    if (!nom || !email) {
      return res.status(400).json({ 
        message: 'Nom et email sont requis',
        erreurs: {
          nom: !nom ? 'Le nom est requis' : null,
          email: !email ? 'L\'email est requis' : null
        }
      });
    }

    // Validation email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        message: 'Format d\'email invalide',
        erreurs: { email: 'Format d\'email invalide' }
      });
    }

    const connection = await mysql.createConnection(dbConfig);
    await connection.beginTransaction();

    try {
      // Mettre à jour la table utilisateurs
      await connection.execute(`
        UPDATE utilisateurs 
        SET nom = ?, email = ?, telephone = ?, addresse = ?, updated_at = NOW()
        WHERE id_utilisateur = ? AND role = 'candidat'
      `, [nom, email, telephone, addresse, id_utilisateur]);

      // Vérifier si un profil candidat existe
      const [existingProfile] = await connection.execute(
        'SELECT id_profil FROM profils_candidats WHERE id_utilisateur = ?',
        [id_utilisateur]
      );

      const competencesJson = JSON.stringify(competences || []);

      if (existingProfile.length > 0) {
        // Mettre à jour le profil existant
        await connection.execute(`
          UPDATE profils_candidats 
          SET competences = ?, experience = ?, formation = ?, handicap = ?,
              disponibilite = ?, salaire_souhaite = ?, updated_at = NOW()
          WHERE id_utilisateur = ?
        `, [competencesJson, experience, formation, handicap, disponibilite, salaire_souhaite, id_utilisateur]);
      } else {
        // Créer un nouveau profil
        await connection.execute(`
          INSERT INTO profils_candidats 
          (id_utilisateur, competences, experience, formation, handicap, disponibilite, salaire_souhaite)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [id_utilisateur, competencesJson, experience, formation, handicap, disponibilite, salaire_souhaite]);
      }

      await connection.commit();
      await connection.end();

      res.json({
        message: 'Profil mis à jour avec succès',
        donnees: {
          id_utilisateur,
          nom,
          email
        }
      });

    } catch (error) {
      await connection.rollback();
      await connection.end();
      throw error;
    }

  } catch (error) {
    console.error('Erreur lors de la mise à jour du profil candidat:', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});

// ============================================================================
// API ENTREPRISE
// ============================================================================

// GET /api/entreprises/profil/:id_utilisateur
router.get('/entreprises/profil/:id_utilisateur', authenticateToken, async (req, res) => {
  try {
    const { id_utilisateur } = req.params;
    
    if (req.user.id_utilisateur !== id_utilisateur && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Accès non autorisé' });
    }

    const connection = await mysql.createConnection(dbConfig);
    
    const [rows] = await connection.execute(`
      SELECT 
        u.nom, u.email, u.telephone, u.addresse,
        pe.nom_entreprise, pe.secteur_activite, pe.taille_entreprise, pe.siret,
        pe.site_web, pe.description, pe.politique_handicap,
        pe.contact_rh_nom, pe.contact_rh_email, pe.contact_rh_telephone
      FROM utilisateurs u
      LEFT JOIN profils_entreprises pe ON u.id_utilisateur = pe.id_utilisateur
      WHERE u.id_utilisateur = ? AND u.role = 'entreprise'
    `, [id_utilisateur]);

    await connection.end();

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Profil entreprise non trouvé' });
    }

    res.json({
      message: 'Profil récupéré avec succès',
      donnees: rows[0]
    });

  } catch (error) {
    console.error('Erreur lors de la récupération du profil entreprise:', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});

// PUT /api/entreprises/profil
router.put('/entreprises/profil', authenticateToken, async (req, res) => {
  try {
    const {
      nom, email, telephone, addresse,
      nom_entreprise, secteur_activite, taille_entreprise, siret,
      site_web, description, politique_handicap,
      contact_rh_nom, contact_rh_email, contact_rh_telephone
    } = req.body;

    const id_utilisateur = req.user.id_utilisateur;

    // Validation SIRET
    if (siret && !/^\d{14}$/.test(siret)) {
      return res.status(400).json({
        message: 'SIRET invalide',
        erreurs: { siret: 'Le SIRET doit contenir exactement 14 chiffres' }
      });
    }

    // Validation URL
    if (site_web && !/^https?:\/\/.+/.test(site_web)) {
      return res.status(400).json({
        message: 'URL invalide',
        erreurs: { site_web: 'L\'URL doit commencer par http:// ou https://' }
      });
    }

    const connection = await mysql.createConnection(dbConfig);
    await connection.beginTransaction();

    try {
      // Mettre à jour la table utilisateurs
      await connection.execute(`
        UPDATE utilisateurs 
        SET nom = ?, email = ?, telephone = ?, addresse = ?, updated_at = NOW()
        WHERE id_utilisateur = ? AND role = 'entreprise'
      `, [nom, email, telephone, addresse, id_utilisateur]);

      // Vérifier si un profil entreprise existe
      const [existingProfile] = await connection.execute(
        'SELECT id_profil FROM profils_entreprises WHERE id_utilisateur = ?',
        [id_utilisateur]
      );

      if (existingProfile.length > 0) {
        // Mettre à jour le profil existant
        await connection.execute(`
          UPDATE profils_entreprises 
          SET nom_entreprise = ?, secteur_activite = ?, taille_entreprise = ?, siret = ?,
              site_web = ?, description = ?, politique_handicap = ?,
              contact_rh_nom = ?, contact_rh_email = ?, contact_rh_telephone = ?, updated_at = NOW()
          WHERE id_utilisateur = ?
        `, [nom_entreprise, secteur_activite, taille_entreprise, siret, site_web, description, 
            politique_handicap, contact_rh_nom, contact_rh_email, contact_rh_telephone, id_utilisateur]);
      } else {
        // Créer un nouveau profil
        await connection.execute(`
          INSERT INTO profils_entreprises 
          (id_utilisateur, nom_entreprise, secteur_activite, taille_entreprise, siret,
           site_web, description, politique_handicap, contact_rh_nom, contact_rh_email, contact_rh_telephone)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [id_utilisateur, nom_entreprise, secteur_activite, taille_entreprise, siret, site_web, 
            description, politique_handicap, contact_rh_nom, contact_rh_email, contact_rh_telephone]);
      }

      await connection.commit();
      await connection.end();

      res.json({
        message: 'Profil mis à jour avec succès',
        donnees: {
          id_utilisateur,
          nom,
          email
        }
      });

    } catch (error) {
      await connection.rollback();
      await connection.end();
      throw error;
    }

  } catch (error) {
    console.error('Erreur lors de la mise à jour du profil entreprise:', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});

// ============================================================================
// API ADMIN
// ============================================================================

// GET /api/admin/profil/:id_utilisateur
router.get('/admin/profil/:id_utilisateur', authenticateToken, async (req, res) => {
  try {
    const { id_utilisateur } = req.params;
    
    // Seuls les admins peuvent accéder aux profils admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Accès non autorisé' });
    }

    const connection = await mysql.createConnection(dbConfig);
    
    const [rows] = await connection.execute(`
      SELECT 
        u.nom, u.email, u.telephone, u.addresse,
        pa.poste, pa.departement, pa.date_embauche,
        pa.notifications_email, pa.notifications_sms
      FROM utilisateurs u
      LEFT JOIN profils_admins pa ON u.id_utilisateur = pa.id_utilisateur
      WHERE u.id_utilisateur = ? AND u.role = 'admin'
    `, [id_utilisateur]);

    await connection.end();

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Profil admin non trouvé' });
    }

    const profil = rows[0];

    res.json({
      message: 'Profil récupéré avec succès',
      donnees: profil
    });

  } catch (error) {
    console.error('Erreur lors de la récupération du profil admin:', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});

// PUT /api/admin/profil
router.put('/admin/profil', authenticateToken, async (req, res) => {
  try {
    const {
      nom, email, telephone, addresse,
      poste, departement, date_embauche,
      notifications_email, notifications_sms
    } = req.body;

    const id_utilisateur = req.user.id_utilisateur;

    // Seuls les admins peuvent modifier les profils admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Accès non autorisé' });
    }

    const connection = await mysql.createConnection(dbConfig);
    await connection.beginTransaction();

    try {
      // Mettre à jour la table utilisateurs
      await connection.execute(`
        UPDATE utilisateurs 
        SET nom = ?, email = ?, telephone = ?, addresse = ?, updated_at = NOW()
        WHERE id_utilisateur = ? AND role = 'admin'
      `, [nom, email, telephone, addresse, id_utilisateur]);

      // Vérifier si un profil admin existe
      const [existingProfile] = await connection.execute(
        'SELECT id_profil FROM profils_admins WHERE id_utilisateur = ?',
        [id_utilisateur]
      );

      if (existingProfile.length > 0) {
        // Mettre à jour le profil existant
        await connection.execute(`
          UPDATE profils_admins 
          SET poste = ?, departement = ?, date_embauche = ?,
              notifications_email = ?, notifications_sms = ?, updated_at = NOW()
          WHERE id_utilisateur = ?
        `, [poste, departement, date_embauche, 
            notifications_email, notifications_sms, id_utilisateur]);
      } else {
        // Créer un nouveau profil
        await connection.execute(`
          INSERT INTO profils_admins 
          (id_utilisateur, poste, departement, date_embauche, notifications_email, notifications_sms)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [id_utilisateur, poste, departement, date_embauche, 
            notifications_email, notifications_sms]);
      }

      await connection.commit();
      await connection.end();

      res.json({
        message: 'Profil mis à jour avec succès',
        donnees: {
          id_utilisateur,
          nom,
          email
        }
      });

    } catch (error) {
      await connection.rollback();
      await connection.end();
      throw error;
    }

  } catch (error) {
    console.error('Erreur lors de la mise à jour du profil admin:', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});

module.exports = router;