// Exemple d'implémentation backend pour les tests psychologiques
// Framework : Express.js avec MySQL

const express = require('express');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise');
const { v4: uuidv4 } = require('uuid');
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

// Middleware pour vérifier le rôle admin
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Accès non autorisé - Admin requis' });
  }
  next();
};

// Configuration de la base de données
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
};

// ============================================================================
// ENDPOINTS ADMIN
// ============================================================================

// 1. Lister les tests (avec pagination)
router.get('/admin/tests', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10, statut, type_test } = req.query;
    const offset = (page - 1) * limit;
    
    const connection = await mysql.createConnection(dbConfig);
    
    // Construction de la requête avec filtres
    let whereClause = 'WHERE 1=1';
    const params = [];
    
    if (statut) {
      whereClause += ' AND t.statut = ?';
      params.push(statut);
    }
    
    if (type_test) {
      whereClause += ' AND t.type_test = ?';
      params.push(type_test);
    }
    
    // Requête pour compter le total
    const [countResult] = await connection.execute(
      `SELECT COUNT(*) as total FROM tests_psychologiques t ${whereClause}`,
      params
    );
    
    const totalItems = countResult[0].total;
    const totalPages = Math.ceil(totalItems / limit);
    
    // Requête pour récupérer les tests
    const [tests] = await connection.execute(
      `SELECT 
        t.id_test,
        t.titre,
        t.description,
        t.type_test,
        t.duree_minutes,
        t.statut,
        t.score_total,
        t.date_debut_validite,
        t.date_fin_validite,
        t.created_at,
        CONCAT(u.prenom, ' ', u.nom) as createur
      FROM tests_psychologiques t
      LEFT JOIN utilisateurs u ON t.createur_id = u.id_utilisateur
      ${whereClause}
      ORDER BY t.created_at DESC
      LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );
    
    await connection.end();
    
    res.json({
      success: true,
      donnees: {
        tests,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems,
          itemsPerPage: parseInt(limit)
        }
      }
    });
    
  } catch (error) {
    console.error('Erreur lors de la récupération des tests:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// 2. Créer un nouveau test
router.post('/admin/tests', authenticateToken, requireAdmin, async (req, res) => {
  const connection = await mysql.createConnection(dbConfig);
  
  try {
    await connection.beginTransaction();
    
    const {
      titre,
      description,
      type_test,
      duree_minutes,
      date_debut_validite,
      date_fin_validite,
      instructions,
      questions
    } = req.body;
    
    // Validation des données
    if (!titre || !description || !type_test || !questions || questions.length === 0) {
      return res.status(400).json({ message: 'Données manquantes' });
    }
    
    const testId = uuidv4();
    
    // Calculer le score total
    const scoreTotal = questions.reduce((total, q) => total + q.score_question, 0);
    
    // Insérer le test
    await connection.execute(
      `INSERT INTO tests_psychologiques 
       (id_test, titre, description, type_test, duree_minutes, score_total, 
        date_debut_validite, date_fin_validite, instructions, createur_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        testId,
        titre,
        description,
        type_test,
        duree_minutes,
        scoreTotal,
        date_debut_validite,
        date_fin_validite,
        instructions,
        req.user.id_utilisateur
      ]
    );
    
    // Insérer les questions et options
    for (const question of questions) {
      const questionId = uuidv4();
      
      await connection.execute(
        `INSERT INTO questions 
         (id_question, id_test, contenu_question, type_question, score_question, ordre, obligatoire)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          questionId,
          testId,
          question.contenu_question,
          question.type_question,
          question.score_question,
          question.ordre,
          question.obligatoire
        ]
      );
      
      // Insérer les options si elles existent
      if (question.options && question.options.length > 0) {
        for (const option of question.options) {
          const optionId = uuidv4();
          
          await connection.execute(
            `INSERT INTO options_reponse 
             (id_option, id_question, texte_option, est_correcte, score_option, ordre)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
              optionId,
              questionId,
              option.texte_option,
              option.est_correcte,
              option.score_option,
              option.ordre
            ]
          );
        }
      }
    }
    
    await connection.commit();
    
    res.json({
      success: true,
      message: 'Test créé avec succès',
      donnees: { id_test: testId }
    });
    
  } catch (error) {
    await connection.rollback();
    console.error('Erreur lors de la création du test:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  } finally {
    await connection.end();
  }
});

// 3. Modifier un test
router.put('/admin/tests/:id', authenticateToken, requireAdmin, async (req, res) => {
  const connection = await mysql.createConnection(dbConfig);
  
  try {
    await connection.beginTransaction();
    
    const testId = req.params.id;
    const { statut, ...updateData } = req.body;
    
    // Si on ne met à jour que le statut
    if (statut && Object.keys(updateData).length === 0) {
      await connection.execute(
        'UPDATE tests_psychologiques SET statut = ? WHERE id_test = ?',
        [statut, testId]
      );
    } else {
      // Mise à jour complète du test (logique similaire à la création)
      // ... implémentation complète selon vos besoins
    }
    
    await connection.commit();
    
    res.json({
      success: true,
      message: 'Test modifié avec succès'
    });
    
  } catch (error) {
    await connection.rollback();
    console.error('Erreur lors de la modification du test:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  } finally {
    await connection.end();
  }
});

// 4. Supprimer un test
router.delete('/admin/tests/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    
    // Vérifier s'il y a des résultats associés
    const [results] = await connection.execute(
      'SELECT COUNT(*) as count FROM resultats_tests WHERE id_test = ?',
      [req.params.id]
    );
    
    if (results[0].count > 0) {
      await connection.end();
      return res.status(400).json({ 
        message: 'Impossible de supprimer un test avec des résultats existants' 
      });
    }
    
    // Supprimer le test (CASCADE supprimera questions et options)
    await connection.execute(
      'DELETE FROM tests_psychologiques WHERE id_test = ?',
      [req.params.id]
    );
    
    await connection.end();
    
    res.json({
      success: true,
      message: 'Test supprimé avec succès'
    });
    
  } catch (error) {
    console.error('Erreur lors de la suppression du test:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// 5. Statistiques d'un test
router.get('/admin/tests/:id/statistiques', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    
    // Récupérer les informations du test
    const [testInfo] = await connection.execute(
      'SELECT id_test, titre FROM tests_psychologiques WHERE id_test = ?',
      [req.params.id]
    );
    
    if (testInfo.length === 0) {
      await connection.end();
      return res.status(404).json({ message: 'Test non trouvé' });
    }
    
    // Statistiques générales
    const [stats] = await connection.execute(
      `SELECT 
        COUNT(*) as nombre_passages,
        AVG(score_obtenu) as score_moyen,
        MIN(score_obtenu) as score_min,
        MAX(score_obtenu) as score_max,
        AVG(temps_passe_minutes) as temps_moyen_minutes
      FROM resultats_tests 
      WHERE id_test = ?`,
      [req.params.id]
    );
    
    // Distribution des scores
    const [distribution] = await connection.execute(
      `SELECT 
        CASE 
          WHEN pourcentage <= 20 THEN '0-20'
          WHEN pourcentage <= 40 THEN '21-40'
          WHEN pourcentage <= 60 THEN '41-60'
          WHEN pourcentage <= 80 THEN '61-80'
          ELSE '81-100'
        END as tranche,
        COUNT(*) as nombre
      FROM resultats_tests 
      WHERE id_test = ?
      GROUP BY tranche
      ORDER BY tranche`,
      [req.params.id]
    );
    
    await connection.end();
    
    res.json({
      success: true,
      donnees: {
        test: testInfo[0],
        statistiques: {
          nombre_passages: stats[0].nombre_passages || 0,
          score_moyen: parseFloat(stats[0].score_moyen) || 0,
          score_min: stats[0].score_min || 0,
          score_max: stats[0].score_max || 0,
          temps_moyen_minutes: parseFloat(stats[0].temps_moyen_minutes) || 0,
          taux_completion: 100 // À calculer selon votre logique
        },
        distribution_scores: distribution
      }
    });
    
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ============================================================================
// ENDPOINTS CANDIDAT
// ============================================================================

// 1. Tests disponibles
router.get('/candidat/tests-disponibles', authenticateToken, async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    
    const [tests] = await connection.execute(
      `SELECT 
        t.id_test,
        t.titre,
        t.description,
        t.type_test,
        t.duree_minutes,
        t.date_fin_validite,
        t.instructions,
        CASE WHEN r.id_resultat IS NOT NULL THEN TRUE ELSE FALSE END as deja_passe,
        CASE 
          WHEN t.statut = 'actif' 
          AND NOW() BETWEEN t.date_debut_validite AND t.date_fin_validite
          AND r.id_resultat IS NULL
          THEN TRUE 
          ELSE FALSE 
        END as peut_passer
      FROM tests_psychologiques t
      LEFT JOIN resultats_tests r ON t.id_test = r.id_test AND r.id_candidat = ?
      WHERE t.statut = 'actif'
      AND NOW() <= t.date_fin_validite
      ORDER BY t.created_at DESC`,
      [req.user.id_utilisateur]
    );
    
    await connection.end();
    
    res.json({
      success: true,
      donnees: { tests }
    });
    
  } catch (error) {
    console.error('Erreur lors de la récupération des tests disponibles:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// 2. Mes résultats
router.get('/candidat/mes-resultats', authenticateToken, async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    
    const [resultats] = await connection.execute(
      `SELECT 
        r.id_resultat,
        r.score_obtenu,
        r.pourcentage,
        r.temps_passe_minutes,
        r.date_passage,
        r.est_visible,
        r.peut_modifier_visibilite,
        t.id_test,
        t.titre,
        t.type_test,
        t.score_total
      FROM resultats_tests r
      JOIN tests_psychologiques t ON r.id_test = t.id_test
      WHERE r.id_candidat = ?
      ORDER BY r.date_passage DESC`,
      [req.user.id_utilisateur]
    );
    
    // Formater les résultats
    const resultatsFormates = resultats.map(r => ({
      id_resultat: r.id_resultat,
      test: {
        id_test: r.id_test,
        titre: r.titre,
        type_test: r.type_test,
        score_total: r.score_total
      },
      score_obtenu: r.score_obtenu,
      pourcentage: parseFloat(r.pourcentage),
      temps_passe_minutes: r.temps_passe_minutes,
      date_passage: r.date_passage,
      est_visible: Boolean(r.est_visible),
      peut_modifier_visibilite: Boolean(r.peut_modifier_visibilite)
    }));
    
    await connection.end();
    
    res.json({
      success: true,
      donnees: { resultats: resultatsFormates }
    });
    
  } catch (error) {
    console.error('Erreur lors de la récupération des résultats:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// 3. Commencer un test
router.get('/candidat/tests/:id/commencer', authenticateToken, async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    
    // Vérifier que le candidat peut passer le test
    const [testCheck] = await connection.execute(
      `SELECT t.*, r.id_resultat
      FROM tests_psychologiques t
      LEFT JOIN resultats_tests r ON t.id_test = r.id_test AND r.id_candidat = ?
      WHERE t.id_test = ?`,
      [req.user.id_utilisateur, req.params.id]
    );
    
    if (testCheck.length === 0) {
      await connection.end();
      return res.status(404).json({ message: 'Test non trouvé' });
    }
    
    const test = testCheck[0];
    
    if (test.id_resultat) {
      await connection.end();
      return res.status(400).json({ message: 'Test déjà passé' });
    }
    
    if (test.statut !== 'actif' || new Date() > new Date(test.date_fin_validite)) {
      await connection.end();
      return res.status(400).json({ message: 'Test non disponible' });
    }
    
    // Récupérer les questions et options
    const [questions] = await connection.execute(
      `SELECT 
        q.id_question,
        q.contenu_question,
        q.type_question,
        q.ordre,
        q.obligatoire
      FROM questions q
      WHERE q.id_test = ?
      ORDER BY q.ordre`,
      [req.params.id]
    );
    
    // Récupérer les options pour chaque question
    for (let question of questions) {
      const [options] = await connection.execute(
        `SELECT id_option, texte_option, ordre
        FROM options_reponse
        WHERE id_question = ?
        ORDER BY ordre`,
        [question.id_question]
      );
      question.options = options;
    }
    
    await connection.end();
    
    res.json({
      success: true,
      donnees: {
        id_test: test.id_test,
        titre: test.titre,
        description: test.description,
        duree_minutes: test.duree_minutes,
        instructions: test.instructions,
        questions
      }
    });
    
  } catch (error) {
    console.error('Erreur lors du démarrage du test:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// 4. Soumettre un test
router.post('/candidat/tests/:id/soumettre', authenticateToken, async (req, res) => {
  const connection = await mysql.createConnection(dbConfig);
  
  try {
    await connection.beginTransaction();
    
    const { reponses, temps_passe_minutes } = req.body;
    const testId = req.params.id;
    const candidatId = req.user.id_utilisateur;
    
    // Vérifier que le test n'a pas déjà été passé
    const [existingResult] = await connection.execute(
      'SELECT id_resultat FROM resultats_tests WHERE id_test = ? AND id_candidat = ?',
      [testId, candidatId]
    );
    
    if (existingResult.length > 0) {
      await connection.rollback();
      await connection.end();
      return res.status(400).json({ message: 'Test déjà passé' });
    }
    
    // Calculer le score
    let scoreTotal = 0;
    let scoreObtenu = 0;
    
    // Récupérer les informations du test
    const [testInfo] = await connection.execute(
      'SELECT score_total FROM tests_psychologiques WHERE id_test = ?',
      [testId]
    );
    
    scoreTotal = testInfo[0].score_total;
    
    // Créer le résultat
    const resultatId = uuidv4();
    
    // Calculer le score pour chaque réponse
    for (const reponse of reponses) {
      let scoreAttribue = 0;
      
      if (reponse.id_option) {
        // Réponse avec option
        const [optionInfo] = await connection.execute(
          `SELECT o.score_option, q.score_question, q.type_question
          FROM options_reponse o
          JOIN questions q ON o.id_question = q.id_question
          WHERE o.id_option = ? AND q.id_question = ?`,
          [reponse.id_option, reponse.id_question]
        );
        
        if (optionInfo.length > 0) {
          scoreAttribue = optionInfo[0].score_option;
        }
      } else if (reponse.reponse_texte) {
        // Réponse texte libre - attribuer le score complet de la question
        const [questionInfo] = await connection.execute(
          'SELECT score_question FROM questions WHERE id_question = ?',
          [reponse.id_question]
        );
        
        if (questionInfo.length > 0) {
          scoreAttribue = questionInfo[0].score_question;
        }
      }
      
      scoreObtenu += scoreAttribue;
      
      // Enregistrer la réponse
      await connection.execute(
        `INSERT INTO reponses_candidats 
         (id_reponse, id_resultat, id_question, id_option, reponse_texte, score_attribue)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          uuidv4(),
          resultatId,
          reponse.id_question,
          reponse.id_option || null,
          reponse.reponse_texte || null,
          scoreAttribue
        ]
      );
    }
    
    const pourcentage = scoreTotal > 0 ? (scoreObtenu / scoreTotal) * 100 : 0;
    
    // Enregistrer le résultat
    await connection.execute(
      `INSERT INTO resultats_tests 
       (id_resultat, id_test, id_candidat, score_obtenu, pourcentage, temps_passe_minutes)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [resultatId, testId, candidatId, scoreObtenu, pourcentage, temps_passe_minutes]
    );
    
    await connection.commit();
    
    res.json({
      success: true,
      message: 'Test soumis avec succès',
      donnees: {
        id_resultat: resultatId,
        score_obtenu: scoreObtenu,
        pourcentage: parseFloat(pourcentage.toFixed(2))
      }
    });
    
  } catch (error) {
    await connection.rollback();
    console.error('Erreur lors de la soumission du test:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  } finally {
    await connection.end();
  }
});

// 5. Modifier la visibilité d'un résultat
router.patch('/candidat/resultats/:id/visibilite', authenticateToken, async (req, res) => {
  try {
    const { est_visible } = req.body;
    const connection = await mysql.createConnection(dbConfig);
    
    // Vérifier que le résultat appartient au candidat
    const [result] = await connection.execute(
      'SELECT id_resultat FROM resultats_tests WHERE id_resultat = ? AND id_candidat = ?',
      [req.params.id, req.user.id_utilisateur]
    );
    
    if (result.length === 0) {
      await connection.end();
      return res.status(404).json({ message: 'Résultat non trouvé' });
    }
    
    await connection.execute(
      'UPDATE resultats_tests SET est_visible = ? WHERE id_resultat = ?',
      [est_visible, req.params.id]
    );
    
    await connection.end();
    
    res.json({
      success: true,
      message: `Résultat ${est_visible ? 'affiché' : 'masqué'} avec succès`
    });
    
  } catch (error) {
    console.error('Erreur lors de la modification de la visibilité:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;