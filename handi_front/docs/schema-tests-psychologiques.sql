-- Schema de base de données pour le système de tests psychologiques
-- Compatible MySQL 8.0+

-- Table principale des tests psychologiques
CREATE TABLE tests_psychologiques (
    id_test VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    titre VARCHAR(255) NOT NULL,
    description TEXT,
    type_test ENUM('soft_skills', 'personnalite', 'competences') NOT NULL,
    duree_minutes INT NOT NULL DEFAULT 30,
    statut ENUM('actif', 'inactif', 'brouillon') NOT NULL DEFAULT 'brouillon',
    score_total INT NOT NULL DEFAULT 0,
    date_debut_validite DATETIME NOT NULL,
    date_fin_validite DATETIME NOT NULL,
    instructions TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    createur_id VARCHAR(36) NOT NULL,
    
    FOREIGN KEY (createur_id) REFERENCES utilisateurs(id_utilisateur) ON DELETE RESTRICT,
    
    INDEX idx_statut (statut),
    INDEX idx_type_test (type_test),
    INDEX idx_dates (date_debut_validite, date_fin_validite),
    INDEX idx_createur (createur_id)
);

-- Table des questions
CREATE TABLE questions (
    id_question VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    id_test VARCHAR(36) NOT NULL,
    contenu_question TEXT NOT NULL,
    type_question ENUM('choix_multiple', 'vrai_faux', 'echelle_likert', 'texte_libre') NOT NULL,
    score_question INT NOT NULL DEFAULT 10,
    ordre INT NOT NULL,
    obligatoire BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (id_test) REFERENCES tests_psychologiques(id_test) ON DELETE CASCADE,
    
    INDEX idx_test_ordre (id_test, ordre),
    INDEX idx_type_question (type_question)
);

-- Table des options de réponse
CREATE TABLE options_reponse (
    id_option VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    id_question VARCHAR(36) NOT NULL,
    texte_option TEXT NOT NULL,
    est_correcte BOOLEAN DEFAULT FALSE,
    score_option INT NOT NULL DEFAULT 0,
    ordre INT NOT NULL,
    
    FOREIGN KEY (id_question) REFERENCES questions(id_question) ON DELETE CASCADE,
    
    INDEX idx_question_ordre (id_question, ordre),
    INDEX idx_correcte (est_correcte)
);

-- Table des résultats des tests
CREATE TABLE resultats_tests (
    id_resultat VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    id_test VARCHAR(36) NOT NULL,
    id_candidat VARCHAR(36) NOT NULL,
    score_obtenu INT NOT NULL DEFAULT 0,
    pourcentage DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    temps_passe_minutes INT NOT NULL,
    date_passage TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    est_visible BOOLEAN DEFAULT TRUE,
    peut_modifier_visibilite BOOLEAN DEFAULT TRUE,
    
    FOREIGN KEY (id_test) REFERENCES tests_psychologiques(id_test) ON DELETE RESTRICT,
    FOREIGN KEY (id_candidat) REFERENCES utilisateurs(id_utilisateur) ON DELETE CASCADE,
    
    UNIQUE KEY unique_candidat_test (id_candidat, id_test),
    INDEX idx_test (id_test),
    INDEX idx_candidat (id_candidat),
    INDEX idx_date_passage (date_passage),
    INDEX idx_score (score_obtenu),
    INDEX idx_visible (est_visible)
);

-- Table des réponses des candidats
CREATE TABLE reponses_candidats (
    id_reponse VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    id_resultat VARCHAR(36) NOT NULL,
    id_question VARCHAR(36) NOT NULL,
    id_option VARCHAR(36) NULL,
    reponse_texte TEXT NULL,
    score_attribue INT NOT NULL DEFAULT 0,
    
    FOREIGN KEY (id_resultat) REFERENCES resultats_tests(id_resultat) ON DELETE CASCADE,
    FOREIGN KEY (id_question) REFERENCES questions(id_question) ON DELETE RESTRICT,
    FOREIGN KEY (id_option) REFERENCES options_reponse(id_option) ON DELETE RESTRICT,
    
    INDEX idx_resultat (id_resultat),
    INDEX idx_question (id_question),
    INDEX idx_option (id_option)
);

-- Vues utiles pour les statistiques

-- Vue pour les statistiques générales des tests
CREATE VIEW vue_statistiques_tests AS
SELECT 
    t.id_test,
    t.titre,
    t.type_test,
    t.score_total,
    COUNT(r.id_resultat) as nombre_passages,
    AVG(r.score_obtenu) as score_moyen,
    MIN(r.score_obtenu) as score_min,
    MAX(r.score_obtenu) as score_max,
    AVG(r.pourcentage) as pourcentage_moyen,
    AVG(r.temps_passe_minutes) as temps_moyen_minutes,
    STDDEV(r.score_obtenu) as ecart_type_score
FROM tests_psychologiques t
LEFT JOIN resultats_tests r ON t.id_test = r.id_test
GROUP BY t.id_test, t.titre, t.type_test, t.score_total;

-- Vue pour les résultats détaillés avec informations candidat
CREATE VIEW vue_resultats_detailles AS
SELECT 
    r.id_resultat,
    r.id_test,
    t.titre as titre_test,
    t.type_test,
    r.id_candidat,
    u.nom,
    u.prenom,
    u.email,
    r.score_obtenu,
    r.pourcentage,
    r.temps_passe_minutes,
    r.date_passage,
    r.est_visible
FROM resultats_tests r
JOIN tests_psychologiques t ON r.id_test = t.id_test
JOIN utilisateurs u ON r.id_candidat = u.id_utilisateur;

-- Procédures stockées utiles

DELIMITER //

-- Procédure pour calculer automatiquement le score total d'un test
CREATE PROCEDURE CalculerScoreTotal(IN test_id VARCHAR(36))
BEGIN
    DECLARE total_score INT DEFAULT 0;
    
    SELECT SUM(score_question) INTO total_score
    FROM questions
    WHERE id_test = test_id;
    
    UPDATE tests_psychologiques 
    SET score_total = IFNULL(total_score, 0)
    WHERE id_test = test_id;
END //

-- Procédure pour obtenir les statistiques complètes d'un test
CREATE PROCEDURE ObtenirStatistiquesTest(IN test_id VARCHAR(36))
BEGIN
    -- Statistiques générales
    SELECT 
        COUNT(*) as nombre_passages,
        AVG(score_obtenu) as score_moyen,
        MIN(score_obtenu) as score_min,
        MAX(score_obtenu) as score_max,
        AVG(pourcentage) as pourcentage_moyen,
        AVG(temps_passe_minutes) as temps_moyen_minutes,
        STDDEV(score_obtenu) as ecart_type_score
    FROM resultats_tests 
    WHERE id_test = test_id;
    
    -- Distribution des scores par tranches
    SELECT 
        CASE 
            WHEN pourcentage <= 20 THEN '0-20%'
            WHEN pourcentage <= 40 THEN '21-40%'
            WHEN pourcentage <= 60 THEN '41-60%'
            WHEN pourcentage <= 80 THEN '61-80%'
            ELSE '81-100%'
        END as tranche_score,
        COUNT(*) as nombre_candidats
    FROM resultats_tests 
    WHERE id_test = test_id
    GROUP BY tranche_score
    ORDER BY tranche_score;
    
    -- Performance par question
    SELECT 
        q.ordre,
        q.contenu_question,
        q.type_question,
        q.score_question,
        AVG(rc.score_attribue) as score_moyen_obtenu,
        COUNT(rc.id_reponse) as nombre_reponses
    FROM questions q
    LEFT JOIN reponses_candidats rc ON q.id_question = rc.id_question
    LEFT JOIN resultats_tests r ON rc.id_resultat = r.id_resultat
    WHERE q.id_test = test_id
    GROUP BY q.id_question, q.ordre, q.contenu_question, q.type_question, q.score_question
    ORDER BY q.ordre;
END //

DELIMITER ;

-- Triggers pour maintenir l'intégrité des données

-- Trigger pour recalculer le score total quand une question est ajoutée/modifiée
DELIMITER //
CREATE TRIGGER after_question_insert_update
AFTER INSERT ON questions
FOR EACH ROW
BEGIN
    CALL CalculerScoreTotal(NEW.id_test);
END //

CREATE TRIGGER after_question_update
AFTER UPDATE ON questions
FOR EACH ROW
BEGIN
    CALL CalculerScoreTotal(NEW.id_test);
END //

CREATE TRIGGER after_question_delete
AFTER DELETE ON questions
FOR EACH ROW
BEGIN
    CALL CalculerScoreTotal(OLD.id_test);
END //
DELIMITER ;

-- Index composites pour optimiser les requêtes fréquentes
CREATE INDEX idx_test_statut_dates ON tests_psychologiques(statut, date_debut_validite, date_fin_validite);
CREATE INDEX idx_resultats_candidat_date ON resultats_tests(id_candidat, date_passage DESC);
CREATE INDEX idx_resultats_test_score ON resultats_tests(id_test, score_obtenu DESC);

-- Contraintes de validation
ALTER TABLE tests_psychologiques 
ADD CONSTRAINT chk_duree_positive CHECK (duree_minutes > 0),
ADD CONSTRAINT chk_score_total_positive CHECK (score_total >= 0),
ADD CONSTRAINT chk_dates_validite CHECK (date_fin_validite > date_debut_validite);

ALTER TABLE questions 
ADD CONSTRAINT chk_score_question_positive CHECK (score_question >= 0),
ADD CONSTRAINT chk_ordre_positive CHECK (ordre > 0);

ALTER TABLE options_reponse 
ADD CONSTRAINT chk_score_option_positive CHECK (score_option >= 0),
ADD CONSTRAINT chk_ordre_option_positive CHECK (ordre > 0);

ALTER TABLE resultats_tests 
ADD CONSTRAINT chk_score_obtenu_positive CHECK (score_obtenu >= 0),
ADD CONSTRAINT chk_pourcentage_valide CHECK (pourcentage >= 0 AND pourcentage <= 100),
ADD CONSTRAINT chk_temps_passe_positive CHECK (temps_passe_minutes > 0);

-- Données de test (optionnel)
INSERT INTO tests_psychologiques (
    id_test, titre, description, type_test, duree_minutes, statut, 
    date_debut_validite, date_fin_validite, instructions, createur_id
) VALUES (
    'test-demo-001',
    'Test de Communication - Démo',
    'Test de démonstration pour évaluer les compétences de communication',
    'soft_skills',
    15,
    'actif',
    '2024-01-01 00:00:00',
    '2024-12-31 23:59:59',
    'Ce test évalue vos compétences en communication. Répondez honnêtement à chaque question.',
    'admin-user-id'
);

-- Questions de démonstration
INSERT INTO questions (id_question, id_test, contenu_question, type_question, score_question, ordre, obligatoire) VALUES
('q1-demo', 'test-demo-001', 'Comment gérez-vous les conflits en équipe ?', 'choix_multiple', 10, 1, TRUE),
('q2-demo', 'test-demo-001', 'La communication non-verbale est plus importante que les mots.', 'vrai_faux', 5, 2, TRUE),
('q3-demo', 'test-demo-001', 'À quel point êtes-vous à l\'aise pour parler en public ?', 'echelle_likert', 5, 3, FALSE);

-- Options pour question 1
INSERT INTO options_reponse (id_option, id_question, texte_option, est_correcte, score_option, ordre) VALUES
('opt1-q1', 'q1-demo', 'J\'évite les conflits autant que possible', FALSE, 2, 1),
('opt2-q1', 'q1-demo', 'Je cherche à comprendre tous les points de vue', TRUE, 10, 2),
('opt3-q1', 'q1-demo', 'Je impose ma solution rapidement', FALSE, 1, 3),
('opt4-q1', 'q1-demo', 'Je fais appel à un médiateur', TRUE, 8, 4);

-- Options pour question 2 (Vrai/Faux)
INSERT INTO options_reponse (id_option, id_question, texte_option, est_correcte, score_option, ordre) VALUES
('opt1-q2', 'q2-demo', 'Vrai', TRUE, 5, 1),
('opt2-q2', 'q2-demo', 'Faux', FALSE, 0, 2);

-- Options pour question 3 (Échelle Likert)
INSERT INTO options_reponse (id_option, id_question, texte_option, est_correcte, score_option, ordre) VALUES
('opt1-q3', 'q2-demo', '1 - Très mal à l\'aise', TRUE, 1, 1),
('opt2-q3', 'q2-demo', '2 - Mal à l\'aise', TRUE, 2, 2),
('opt3-q3', 'q2-demo', '3 - Neutre', TRUE, 3, 3),
('opt4-q3', 'q2-demo', '4 - À l\'aise', TRUE, 4, 4),
('opt5-q3', 'q2-demo', '5 - Très à l\'aise', TRUE, 5, 5);

-- Recalculer le score total du test de démonstration
CALL CalculerScoreTotal('test-demo-001');