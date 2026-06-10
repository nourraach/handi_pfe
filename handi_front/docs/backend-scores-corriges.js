// Correction de la logique de calcul des scores
// Remplacer la section de soumission dans exemple-backend-tests-psychologiques.js

// 4. Soumettre un test (VERSION CORRIGÉE)
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
    
    // Récupérer les informations du test
    const [testInfo] = await connection.execute(
      'SELECT score_total FROM tests_psychologiques WHERE id_test = ?',
      [testId]
    );
    
    const scoreTotal = testInfo[0].score_total;
    const resultatId = uuidv4();
    let scoreObtenu = 0;
    
    // ✅ LOGIQUE DE CALCUL CORRIGÉE
    for (const reponse of reponses) {
      let scoreAttribue = 0;
      
      if (reponse.id_option) {
        // Réponse avec option - récupérer toutes les infos nécessaires
        const [optionInfo] = await connection.execute(
          `SELECT 
            o.score_option, 
            o.est_correcte, 
            q.score_question, 
            q.type_question
          FROM options_reponse o
          JOIN questions q ON o.id_question = q.id_question
          WHERE o.id_option = ? AND q.id_question = ?`,
          [reponse.id_option, reponse.id_question]
        );
        
        if (optionInfo.length > 0) {
          const { score_option, est_correcte, score_question, type_question } = optionInfo[0];
          
          // ✅ Logique différente selon le type de question
          switch (type_question) {
            case 'choix_multiple':
              // Choix multiple : seules les options correctes donnent des points
              scoreAttribue = est_correcte ? score_option : 0;
              break;
              
            case 'vrai_faux':
              // Vrai/Faux : réponse correcte = score complet de la question
              scoreAttribue = est_correcte ? score_question : 0;
              break;
              
            case 'echelle_likert':
              // Échelle Likert : chaque niveau a sa valeur (1-5 points)
              scoreAttribue = score_option;
              break;
              
            default:
              console.warn(`Type de question non reconnu: ${type_question}`);
              scoreAttribue = 0;
          }
          
          console.log(`Question ${type_question}: Option ${est_correcte ? 'correcte' : 'incorrecte'}, Score: ${scoreAttribue}`);
        }
      } else if (reponse.reponse_texte) {
        // ✅ Réponse texte libre - attribuer le score complet de la question
        const [questionInfo] = await connection.execute(
          'SELECT score_question FROM questions WHERE id_question = ?',
          [reponse.id_question]
        );
        
        if (questionInfo.length > 0) {
          scoreAttribue = questionInfo[0].score_question;
          console.log(`Question texte libre: Score complet attribué: ${scoreAttribue}`);
        }
      }
      
      scoreObtenu += scoreAttribue;
      
      // Enregistrer la réponse avec le score calculé
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
    
    // ✅ Calcul du pourcentage avec vérification
    const pourcentage = scoreTotal > 0 ? (scoreObtenu / scoreTotal) * 100 : 0;
    
    console.log(`Score final: ${scoreObtenu}/${scoreTotal} = ${pourcentage.toFixed(2)}%`);
    
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
        score_total: scoreTotal,
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

// ✅ FONCTION UTILITAIRE POUR VALIDER LES SCORES
async function validerScoresTest(connection, testId) {
  try {
    // Vérifier que le score total du test correspond à la somme des questions
    const [questions] = await connection.execute(
      'SELECT SUM(score_question) as somme_questions FROM questions WHERE id_test = ?',
      [testId]
    );
    
    const [test] = await connection.execute(
      'SELECT score_total FROM tests_psychologiques WHERE id_test = ?',
      [testId]
    );
    
    const sommeQuestions = questions[0].somme_questions || 0;
    const scoreTotal = test[0].score_total || 0;
    
    if (sommeQuestions !== scoreTotal) {
      console.warn(`⚠️ Incohérence détectée pour le test ${testId}:`);
      console.warn(`   Score total enregistré: ${scoreTotal}`);
      console.warn(`   Somme des questions: ${sommeQuestions}`);
      
      // Corriger automatiquement
      await connection.execute(
        'UPDATE tests_psychologiques SET score_total = ? WHERE id_test = ?',
        [sommeQuestions, testId]
      );
      
      console.log(`✅ Score total corrigé: ${sommeQuestions}`);
    }
    
    return { scoreTotal: sommeQuestions, coherent: sommeQuestions === scoreTotal };
  } catch (error) {
    console.error('Erreur lors de la validation des scores:', error);
    return { scoreTotal: 0, coherent: false };
  }
}

// ✅ ENDPOINT POUR RECALCULER LES SCORES (UTILITAIRE ADMIN)
router.post('/admin/tests/:id/recalculer-scores', authenticateToken, requireAdmin, async (req, res) => {
  const connection = await mysql.createConnection(dbConfig);
  
  try {
    await connection.beginTransaction();
    
    const testId = req.params.id;
    
    // Récupérer tous les résultats de ce test
    const [resultats] = await connection.execute(
      'SELECT id_resultat FROM resultats_tests WHERE id_test = ?',
      [testId]
    );
    
    let resultatsRecalcules = 0;
    
    for (const resultat of resultats) {
      // Récupérer toutes les réponses de ce résultat
      const [reponses] = await connection.execute(
        `SELECT 
          rc.id_question,
          rc.id_option,
          rc.reponse_texte,
          o.score_option,
          o.est_correcte,
          q.score_question,
          q.type_question
        FROM reponses_candidats rc
        LEFT JOIN options_reponse o ON rc.id_option = o.id_option
        LEFT JOIN questions q ON rc.id_question = q.id_question
        WHERE rc.id_resultat = ?`,
        [resultat.id_resultat]
      );
      
      let nouveauScore = 0;
      
      // Recalculer le score avec la nouvelle logique
      for (const reponse of reponses) {
        let scoreAttribue = 0;
        
        if (reponse.id_option) {
          switch (reponse.type_question) {
            case 'choix_multiple':
              scoreAttribue = reponse.est_correcte ? reponse.score_option : 0;
              break;
            case 'vrai_faux':
              scoreAttribue = reponse.est_correcte ? reponse.score_question : 0;
              break;
            case 'echelle_likert':
              scoreAttribue = reponse.score_option;
              break;
          }
        } else if (reponse.reponse_texte) {
          scoreAttribue = reponse.score_question;
        }
        
        nouveauScore += scoreAttribue;
        
        // Mettre à jour le score attribué dans la base
        await connection.execute(
          'UPDATE reponses_candidats SET score_attribue = ? WHERE id_resultat = ? AND id_question = ?',
          [scoreAttribue, resultat.id_resultat, reponse.id_question]
        );
      }
      
      // Récupérer le score total du test
      const [testInfo] = await connection.execute(
        'SELECT score_total FROM tests_psychologiques WHERE id_test = ?',
        [testId]
      );
      
      const scoreTotal = testInfo[0].score_total;
      const nouveauPourcentage = scoreTotal > 0 ? (nouveauScore / scoreTotal) * 100 : 0;
      
      // Mettre à jour le résultat
      await connection.execute(
        'UPDATE resultats_tests SET score_obtenu = ?, pourcentage = ? WHERE id_resultat = ?',
        [nouveauScore, nouveauPourcentage, resultat.id_resultat]
      );
      
      resultatsRecalcules++;
    }
    
    await connection.commit();
    
    res.json({
      success: true,
      message: `${resultatsRecalcules} résultats recalculés avec succès`,
      donnees: {
        resultats_recalcules: resultatsRecalcules
      }
    });
    
  } catch (error) {
    await connection.rollback();
    console.error('Erreur lors du recalcul des scores:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  } finally {
    await connection.end();
  }
});

module.exports = router;