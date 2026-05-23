// Exemple d'implémentation backend pour la gestion des utilisateurs (Admin)
// Framework : Express.js avec MySQL

const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');
const csv = require('csv-writer');
const router = express.Router();

// Middleware d'authentification admin
const authenticateAdmin = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Token d\'accès requis' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Token invalide' });
    }
    
    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Accès non autorisé - Admin requis' });
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
// 1. LISTER LES UTILISATEURS (avec pagination et filtres)
// ============================================================================
router.get('/utilisateurs', authenticateAdmin, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      role,
      statut,
      dateDebut,
      dateFin,
      recherche
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const limitInt = Math.min(parseInt(limit), 100); // Max 100 par page

    const connection = await mysql.createConnection(dbConfig);

    // Construction de la requête avec filtres
    let whereConditions = [];
    let queryParams = [];

    if (role) {
      whereConditions.push('role = ?');
      queryParams.push(role);
    }

    if (statut) {
      whereConditions.push('statut = ?');
      queryParams.push(statut);
    }

    if (dateDebut) {
      whereConditions.push('DATE(created_at) >= ?');
      queryParams.push(dateDebut);
    }

    if (dateFin) {
      whereConditions.push('DATE(created_at) <= ?');
      queryParams.push(dateFin);
    }

    if (recherche) {
      whereConditions.push('(nom LIKE ? OR email LIKE ?)');
      queryParams.push(`%${recherche}%`, `%${recherche}%`);
    }

    const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

    // Requête pour les utilisateurs
    const [utilisateurs] = await connection.execute(`
      SELECT 
        id_utilisateur, nom, email, role, statut, telephone, addresse,
        created_at, updated_at, derniere_connexion, profil_complete
      FROM utilisateurs 
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `, [...queryParams, limitInt, offset]);

    // Requête pour le total
    const [totalResult] = await connection.execute(`
      SELECT COUNT(*) as total FROM utilisateurs ${whereClause}
    `, queryParams);

    const total = totalResult[0].total;
    const totalPages = Math.ceil(total / limitInt);

    // Statistiques
    const [statsResult] = await connection.execute(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN statut = 'actif' THEN 1 END) as actifs,
        COUNT(CASE WHEN statut = 'en_attente' THEN 1 END) as en_attente,
        COUNT(CASE WHEN statut = 'suspendu' THEN 1 END) as suspendus,
        COUNT(CASE WHEN role = 'candidat' THEN 1 END) as candidats,
        COUNT(CASE WHEN role = 'entreprise' THEN 1 END) as entreprises,
        COUNT(CASE WHEN role = 'admin' THEN 1 END) as admins
      FROM utilisateurs ${whereClause}
    `, queryParams);

    const stats = statsResult[0];

    await connection.end();

    res.json({
      message: 'Utilisateurs récupérés avec succès',
      donnees: {
        utilisateurs,
        pagination: {
          page: parseInt(page),
          limit: limitInt,
          total,
          totalPages
        },
        statistiques: {
          total: stats.total,
          actifs: stats.actifs,
          en_attente: stats.en_attente,
          suspendus: stats.suspendus,
          par_role: {
            candidat: stats.candidats,
            entreprise: stats.entreprises,
            admin: stats.admins
          }
        }
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs:', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});

// ============================================================================
// 2. RÉCUPÉRER UN UTILISATEUR SPÉCIFIQUE
// ============================================================================
router.get('/utilisateurs/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await mysql.createConnection(dbConfig);

    const [rows] = await connection.execute(`
      SELECT 
        id_utilisateur, nom, email, role, statut, telephone, addresse,
        created_at, updated_at, derniere_connexion, profil_complete
      FROM utilisateurs 
      WHERE id_utilisateur = ?
    `, [id]);

    await connection.end();

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    res.json({
      message: 'Utilisateur récupéré avec succès',
      donnees: rows[0]
    });

  } catch (error) {
    console.error('Erreur lors de la récupération de l\'utilisateur:', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});

// ============================================================================
// 3. CRÉER UN NOUVEL UTILISATEUR
// ============================================================================
router.post('/utilisateurs', authenticateAdmin, async (req, res) => {
  try {
    const { nom, email, mot_de_passe, role, statut, telephone, addresse } = req.body;

    // Validation
    if (!nom || !email || !mot_de_passe || !role) {
      return res.status(400).json({
        message: 'Données manquantes',
        erreurs: {
          nom: !nom ? 'Le nom est requis' : null,
          email: !email ? 'L\'email est requis' : null,
          mot_de_passe: !mot_de_passe ? 'Le mot de passe est requis' : null,
          role: !role ? 'Le rôle est requis' : null
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

    // Validation mot de passe
    if (mot_de_passe.length < 8) {
      return res.status(400).json({
        message: 'Mot de passe trop faible',
        erreurs: { mot_de_passe: 'Le mot de passe doit contenir au moins 8 caractères' }
      });
    }

    const connection = await mysql.createConnection(dbConfig);

    // Vérifier si l'email existe déjà
    const [existingUser] = await connection.execute(
      'SELECT id_utilisateur FROM utilisateurs WHERE email = ?',
      [email]
    );

    if (existingUser.length > 0) {
      await connection.end();
      return res.status(400).json({
        message: 'Email déjà utilisé',
        erreurs: { email: 'Cet email est déjà utilisé' }
      });
    }

    // Hasher le mot de passe
    const motDePasseHash = await bcrypt.hash(mot_de_passe, 10);

    // Insérer l'utilisateur
    const [result] = await connection.execute(`
      INSERT INTO utilisateurs 
      (nom, email, mot_de_passe, role, statut, telephone, addresse, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, [nom, email, motDePasseHash, role, statut || 'actif', telephone, addresse]);

    // Log de l'action
    await connection.execute(`
      INSERT INTO audit_actions_admin 
      (admin_id, utilisateur_cible_id, type_action, nouvelles_valeurs, date_action)
      VALUES (?, ?, 'creation', ?, NOW())
    `, [
      req.user.id_utilisateur,
      result.insertId,
      JSON.stringify({ nom, email, role, statut: statut || 'actif' })
    ]);

    await connection.end();

    res.status(201).json({
      message: 'Utilisateur créé avec succès',
      donnees: {
        id_utilisateur: result.insertId,
        nom,
        email,
        role,
        statut: statut || 'actif'
      }
    });

  } catch (error) {
    console.error('Erreur lors de la création de l\'utilisateur:', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});

// ============================================================================
// 4. MODIFIER UN UTILISATEUR
// ============================================================================
router.put('/utilisateurs/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { nom, email, role, statut, telephone, addresse } = req.body;

    // Un admin ne peut pas modifier son propre rôle
    if (id === req.user.id_utilisateur && role !== req.user.role) {
      return res.status(400).json({
        message: 'Vous ne pouvez pas modifier votre propre rôle'
      });
    }

    const connection = await mysql.createConnection(dbConfig);

    // Récupérer les anciennes valeurs
    const [oldUser] = await connection.execute(
      'SELECT * FROM utilisateurs WHERE id_utilisateur = ?',
      [id]
    );

    if (oldUser.length === 0) {
      await connection.end();
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Vérifier si l'email est unique (sauf pour l'utilisateur actuel)
    if (email !== oldUser[0].email) {
      const [existingUser] = await connection.execute(
        'SELECT id_utilisateur FROM utilisateurs WHERE email = ? AND id_utilisateur != ?',
        [email, id]
      );

      if (existingUser.length > 0) {
        await connection.end();
        return res.status(400).json({
          message: 'Email déjà utilisé',
          erreurs: { email: 'Cet email est déjà utilisé' }
        });
      }
    }

    // Mettre à jour l'utilisateur
    await connection.execute(`
      UPDATE utilisateurs 
      SET nom = ?, email = ?, role = ?, statut = ?, telephone = ?, addresse = ?, updated_at = NOW()
      WHERE id_utilisateur = ?
    `, [nom, email, role, statut, telephone, addresse, id]);

    // Log de l'action
    await connection.execute(`
      INSERT INTO audit_actions_admin 
      (admin_id, utilisateur_cible_id, type_action, anciennes_valeurs, nouvelles_valeurs, date_action)
      VALUES (?, ?, 'modification', ?, ?, NOW())
    `, [
      req.user.id_utilisateur,
      id,
      JSON.stringify({
        nom: oldUser[0].nom,
        email: oldUser[0].email,
        role: oldUser[0].role,
        statut: oldUser[0].statut
      }),
      JSON.stringify({ nom, email, role, statut })
    ]);

    await connection.end();

    res.json({
      message: 'Utilisateur modifié avec succès',
      donnees: {
        id_utilisateur: id,
        nom,
        email
      }
    });

  } catch (error) {
    console.error('Erreur lors de la modification de l\'utilisateur:', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});

// ============================================================================
// 5. SUPPRIMER UN UTILISATEUR
// ============================================================================
router.delete('/utilisateurs/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Un admin ne peut pas se supprimer lui-même
    if (id === req.user.id_utilisateur) {
      return res.status(400).json({
        message: 'Vous ne pouvez pas vous supprimer vous-même'
      });
    }

    const connection = await mysql.createConnection(dbConfig);

    // Vérifier que l'utilisateur existe
    const [user] = await connection.execute(
      'SELECT * FROM utilisateurs WHERE id_utilisateur = ?',
      [id]
    );

    if (user.length === 0) {
      await connection.end();
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Log de l'action avant suppression
    await connection.execute(`
      INSERT INTO audit_actions_admin 
      (admin_id, utilisateur_cible_id, type_action, anciennes_valeurs, date_action)
      VALUES (?, ?, 'suppression', ?, NOW())
    `, [
      req.user.id_utilisateur,
      id,
      JSON.stringify(user[0])
    ]);

    // Supprimer l'utilisateur (CASCADE supprimera les profils liés)
    await connection.execute('DELETE FROM utilisateurs WHERE id_utilisateur = ?', [id]);

    await connection.end();

    res.json({
      message: 'Utilisateur supprimé avec succès',
      donnees: {
        id_utilisateur: id,
        supprime_le: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Erreur lors de la suppression de l\'utilisateur:', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});

// ============================================================================
// 6. CHANGER LE STATUT D'UN UTILISATEUR
// ============================================================================
router.patch('/utilisateurs/:id/statut', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { statut } = req.body;

    const statutsValides = ['actif', 'inactif', 'en_attente', 'suspendu'];
    if (!statutsValides.includes(statut)) {
      return res.status(400).json({
        message: 'Statut invalide',
        erreurs: { statut: 'Statut doit être: ' + statutsValides.join(', ') }
      });
    }

    const connection = await mysql.createConnection(dbConfig);

    // Récupérer l'ancien statut
    const [user] = await connection.execute(
      'SELECT statut FROM utilisateurs WHERE id_utilisateur = ?',
      [id]
    );

    if (user.length === 0) {
      await connection.end();
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    const ancienStatut = user[0].statut;

    // Mettre à jour le statut
    await connection.execute(
      'UPDATE utilisateurs SET statut = ?, updated_at = NOW() WHERE id_utilisateur = ?',
      [statut, id]
    );

    // Log de l'action
    await connection.execute(`
      INSERT INTO audit_actions_admin 
      (admin_id, utilisateur_cible_id, type_action, anciennes_valeurs, nouvelles_valeurs, date_action)
      VALUES (?, ?, 'changement_statut', ?, ?, NOW())
    `, [
      req.user.id_utilisateur,
      id,
      JSON.stringify({ statut: ancienStatut }),
      JSON.stringify({ statut })
    ]);

    await connection.end();

    res.json({
      message: 'Statut modifié avec succès',
      donnees: {
        id_utilisateur: id,
        ancien_statut: ancienStatut,
        nouveau_statut: statut,
        modifie_le: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Erreur lors du changement de statut:', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});

// ============================================================================
// 7. RÉINITIALISER LE MOT DE PASSE
// ============================================================================
router.post('/utilisateurs/:id/reset-password', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Générer un mot de passe temporaire
    const nouveauMotDePasse = 'TempPass' + Math.random().toString(36).slice(-8) + '!';
    const motDePasseHash = await bcrypt.hash(nouveauMotDePasse, 10);

    const connection = await mysql.createConnection(dbConfig);

    // Vérifier que l'utilisateur existe
    const [user] = await connection.execute(
      'SELECT nom, email FROM utilisateurs WHERE id_utilisateur = ?',
      [id]
    );

    if (user.length === 0) {
      await connection.end();
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Mettre à jour le mot de passe
    await connection.execute(
      'UPDATE utilisateurs SET mot_de_passe = ?, updated_at = NOW() WHERE id_utilisateur = ?',
      [motDePasseHash, id]
    );

    // Log de l'action
    await connection.execute(`
      INSERT INTO audit_actions_admin 
      (admin_id, utilisateur_cible_id, type_action, date_action)
      VALUES (?, ?, 'reset_password', NOW())
    `, [req.user.id_utilisateur, id]);

    await connection.end();

    // TODO: Envoyer le nouveau mot de passe par email
    // await envoyerEmailResetPassword(user[0].email, nouveauMotDePasse);

    res.json({
      message: 'Mot de passe réinitialisé avec succès',
      donnees: {
        id_utilisateur: id,
        nouveauMotDePasse, // En production, ne pas retourner le mot de passe
        expire_le: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24h
      }
    });

  } catch (error) {
    console.error('Erreur lors de la réinitialisation du mot de passe:', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});

// ============================================================================
// 8. EXPORTER LES UTILISATEURS (CSV)
// ============================================================================
router.get('/utilisateurs/export', authenticateAdmin, async (req, res) => {
  try {
    const { role, statut, dateDebut, dateFin, format = 'csv' } = req.query;

    const connection = await mysql.createConnection(dbConfig);

    // Construction de la requête avec filtres
    let whereConditions = [];
    let queryParams = [];

    if (role) {
      whereConditions.push('role = ?');
      queryParams.push(role);
    }

    if (statut) {
      whereConditions.push('statut = ?');
      queryParams.push(statut);
    }

    if (dateDebut) {
      whereConditions.push('DATE(created_at) >= ?');
      queryParams.push(dateDebut);
    }

    if (dateFin) {
      whereConditions.push('DATE(created_at) <= ?');
      queryParams.push(dateFin);
    }

    const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

    const [utilisateurs] = await connection.execute(`
      SELECT 
        id_utilisateur, nom, email, role, statut, telephone, addresse,
        DATE(created_at) as date_creation, DATE(updated_at) as date_modification
      FROM utilisateurs 
      ${whereClause}
      ORDER BY created_at DESC
    `, queryParams);

    await connection.end();

    if (format === 'csv') {
      // Générer le CSV
      const csvData = [
        ['ID', 'Nom', 'Email', 'Rôle', 'Statut', 'Téléphone', 'Adresse', 'Date création', 'Date modification'],
        ...utilisateurs.map(u => [
          u.id_utilisateur,
          u.nom,
          u.email,
          u.role,
          u.statut,
          u.telephone || '',
          u.addresse || '',
          u.date_creation,
          u.date_modification
        ])
      ];

      const csvContent = csvData.map(row => 
        row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')
      ).join('\n');

      const filename = `utilisateurs_${new Date().toISOString().split('T')[0]}.csv`;

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(csvContent);
    } else {
      res.json({
        message: 'Export réalisé avec succès',
        donnees: utilisateurs
      });
    }

  } catch (error) {
    console.error('Erreur lors de l\'export:', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});

// ============================================================================
// 9. STATISTIQUES DÉTAILLÉES
// ============================================================================
router.get('/utilisateurs/statistiques', authenticateAdmin, async (req, res) => {
  try {
    const { periode = 'mois', dateDebut, dateFin } = req.query;

    const connection = await mysql.createConnection(dbConfig);

    // Statistiques générales
    const [statsGenerales] = await connection.execute(`
      SELECT 
        COUNT(*) as total_utilisateurs,
        COUNT(CASE WHEN statut = 'actif' THEN 1 END) as actifs,
        COUNT(CASE WHEN statut = 'inactif' THEN 1 END) as inactifs,
        COUNT(CASE WHEN statut = 'en_attente' THEN 1 END) as en_attente,
        COUNT(CASE WHEN statut = 'suspendu' THEN 1 END) as suspendus,
        COUNT(CASE WHEN role = 'candidat' THEN 1 END) as candidats,
        COUNT(CASE WHEN role = 'entreprise' THEN 1 END) as entreprises,
        COUNT(CASE WHEN role = 'admin' THEN 1 END) as admins
      FROM utilisateurs
    `);

    // Nouveaux utilisateurs selon la période
    let periodeCondition = '';
    switch (periode) {
      case 'jour':
        periodeCondition = 'DATE(created_at) = CURDATE()';
        break;
      case 'semaine':
        periodeCondition = 'created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)';
        break;
      case 'mois':
        periodeCondition = 'created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)';
        break;
      case 'annee':
        periodeCondition = 'created_at >= DATE_SUB(NOW(), INTERVAL 365 DAY)';
        break;
    }

    const [nouveauxUtilisateurs] = await connection.execute(`
      SELECT COUNT(*) as nouveaux FROM utilisateurs WHERE ${periodeCondition}
    `);

    // Top domaines email
    const [topDomaines] = await connection.execute(`
      SELECT 
        SUBSTRING_INDEX(email, '@', -1) as domaine,
        COUNT(*) as count
      FROM utilisateurs 
      GROUP BY domaine 
      ORDER BY count DESC 
      LIMIT 10
    `);

    await connection.end();

    const stats = statsGenerales[0];

    res.json({
      message: 'Statistiques récupérées avec succès',
      donnees: {
        total_utilisateurs: stats.total_utilisateurs,
        nouveaux_utilisateurs_periode: nouveauxUtilisateurs[0].nouveaux,
        repartition_roles: {
          candidat: stats.candidats,
          entreprise: stats.entreprises,
          admin: stats.admins
        },
        repartition_statuts: {
          actif: stats.actifs,
          inactif: stats.inactifs,
          en_attente: stats.en_attente,
          suspendu: stats.suspendus
        },
        top_domaines_email: topDomaines
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});

// ============================================================================
// 10. HISTORIQUE DES ACTIONS
// ============================================================================
router.get('/utilisateurs/:id/historique', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await mysql.createConnection(dbConfig);

    const [actions] = await connection.execute(`
      SELECT 
        a.id_action,
        a.type_action,
        a.anciennes_valeurs,
        a.nouvelles_valeurs,
        a.commentaire,
        a.date_action,
        u.nom as admin_nom
      FROM audit_actions_admin a
      JOIN utilisateurs u ON a.admin_id = u.id_utilisateur
      WHERE a.utilisateur_cible_id = ?
      ORDER BY a.date_action DESC
      LIMIT 50
    `, [id]);

    await connection.end();

    // Parser les valeurs JSON
    const actionsFormatees = actions.map(action => ({
      ...action,
      anciennes_valeurs: action.anciennes_valeurs ? JSON.parse(action.anciennes_valeurs) : null,
      nouvelles_valeurs: action.nouvelles_valeurs ? JSON.parse(action.nouvelles_valeurs) : null
    }));

    res.json({
      message: 'Historique récupéré avec succès',
      donnees: {
        actions: actionsFormatees
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération de l\'historique:', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});

module.exports = router;