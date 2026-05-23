-- Modifications de la base de données pour la gestion des utilisateurs par les admins

-- ============================================================================
-- MODIFICATIONS DE LA TABLE UTILISATEURS
-- ============================================================================

-- Ajouter des colonnes pour améliorer la gestion
ALTER TABLE utilisateurs 
ADD COLUMN IF NOT EXISTS derniere_connexion TIMESTAMP NULL COMMENT 'Date de dernière connexion',
ADD COLUMN IF NOT EXISTS profil_complete BOOLEAN DEFAULT FALSE COMMENT 'Indique si le profil est complet',
ADD COLUMN IF NOT EXISTS date_suspension TIMESTAMP NULL COMMENT 'Date de suspension si applicable',
ADD COLUMN IF NOT EXISTS raison_suspension TEXT COMMENT 'Raison de la suspension';

-- Ajouter des index pour optimiser les requêtes
ALTER TABLE utilisateurs 
ADD INDEX IF NOT EXISTS idx_role (role),
ADD INDEX IF NOT EXISTS idx_statut (statut),
ADD INDEX IF NOT EXISTS idx_created_at (created_at),
ADD INDEX IF NOT EXISTS idx_email (email),
ADD INDEX IF NOT EXISTS idx_nom (nom),
ADD INDEX IF NOT EXISTS idx_derniere_connexion (derniere_connexion);

-- ============================================================================
-- TABLE D'AUDIT DES ACTIONS ADMIN
-- ============================================================================

CREATE TABLE IF NOT EXISTS audit_actions_admin (
  id_action INT PRIMARY KEY AUTO_INCREMENT,
  admin_id INT NOT NULL COMMENT 'ID de l\'admin qui effectue l\'action',
  utilisateur_cible_id INT NOT NULL COMMENT 'ID de l\'utilisateur concerné',
  type_action ENUM(
    'creation', 
    'modification', 
    'suppression', 
    'changement_statut', 
    'reset_password',
    'suspension',
    'activation'
  ) NOT NULL COMMENT 'Type d\'action effectuée',
  anciennes_valeurs JSON COMMENT 'Valeurs avant modification',
  nouvelles_valeurs JSON COMMENT 'Valeurs après modification',
  commentaire TEXT COMMENT 'Commentaire optionnel de l\'admin',
  adresse_ip VARCHAR(45) COMMENT 'Adresse IP de l\'admin',
  user_agent TEXT COMMENT 'User agent du navigateur',
  date_action TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (admin_id) REFERENCES utilisateurs(id_utilisateur) ON DELETE CASCADE,
  FOREIGN KEY (utilisateur_cible_id) REFERENCES utilisateurs(id_utilisateur) ON DELETE CASCADE,
  
  INDEX idx_admin (admin_id),
  INDEX idx_cible (utilisateur_cible_id),
  INDEX idx_date (date_action),
  INDEX idx_type_action (type_action)
) COMMENT 'Historique des actions effectuées par les administrateurs';

-- ============================================================================
-- TABLE DE STATISTIQUES PRÉCALCULÉES (OPTIONNEL)
-- ============================================================================

CREATE TABLE IF NOT EXISTS statistiques_utilisateurs (
  id_stat INT PRIMARY KEY AUTO_INCREMENT,
  date_stat DATE NOT NULL,
  total_utilisateurs INT DEFAULT 0,
  nouveaux_utilisateurs INT DEFAULT 0,
  utilisateurs_actifs INT DEFAULT 0,
  utilisateurs_suspendus INT DEFAULT 0,
  candidats_total INT DEFAULT 0,
  entreprises_total INT DEFAULT 0,
  admins_total INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE KEY unique_date (date_stat),
  INDEX idx_date_stat (date_stat)
) COMMENT 'Statistiques quotidiennes des utilisateurs';

-- ============================================================================
-- VUES UTILES POUR LES REQUÊTES FRÉQUENTES
-- ============================================================================

-- Vue des utilisateurs avec informations complètes
CREATE OR REPLACE VIEW vue_utilisateurs_complets AS
SELECT 
  u.id_utilisateur,
  u.nom,
  u.email,
  u.role,
  u.statut,
  u.telephone,
  u.addresse,
  u.created_at,
  u.updated_at,
  u.derniere_connexion,
  u.profil_complete,
  u.date_suspension,
  u.raison_suspension,
  
  -- Informations de profil selon le rôle
  CASE 
    WHEN u.role = 'candidat' THEN pc.id_profil IS NOT NULL
    WHEN u.role = 'entreprise' THEN pe.id_profil IS NOT NULL
    WHEN u.role = 'admin' THEN pa.id_profil IS NOT NULL
    ELSE FALSE
  END as a_profil_specifique,
  
  -- Dernière action admin sur cet utilisateur
  (SELECT MAX(date_action) FROM audit_actions_admin WHERE utilisateur_cible_id = u.id_utilisateur) as derniere_action_admin

FROM utilisateurs u
LEFT JOIN profils_candidats pc ON u.id_utilisateur = pc.id_utilisateur AND u.role = 'candidat'
LEFT JOIN profils_entreprises pe ON u.id_utilisateur = pe.id_utilisateur AND u.role = 'entreprise'
LEFT JOIN profils_admins pa ON u.id_utilisateur = pa.id_utilisateur AND u.role = 'admin';

-- Vue des statistiques en temps réel
CREATE OR REPLACE VIEW vue_statistiques_temps_reel AS
SELECT 
  COUNT(*) as total_utilisateurs,
  COUNT(CASE WHEN statut = 'actif' THEN 1 END) as utilisateurs_actifs,
  COUNT(CASE WHEN statut = 'inactif' THEN 1 END) as utilisateurs_inactifs,
  COUNT(CASE WHEN statut = 'en_attente' THEN 1 END) as utilisateurs_en_attente,
  COUNT(CASE WHEN statut = 'suspendu' THEN 1 END) as utilisateurs_suspendus,
  
  COUNT(CASE WHEN role = 'candidat' THEN 1 END) as total_candidats,
  COUNT(CASE WHEN role = 'entreprise' THEN 1 END) as total_entreprises,
  COUNT(CASE WHEN role = 'admin' THEN 1 END) as total_admins,
  
  COUNT(CASE WHEN DATE(created_at) = CURDATE() THEN 1 END) as nouveaux_aujourd_hui,
  COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 END) as nouveaux_7_jours,
  COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as nouveaux_30_jours,
  
  COUNT(CASE WHEN derniere_connexion >= DATE_SUB(NOW(), INTERVAL 24 HOUR) THEN 1 END) as connectes_24h,
  COUNT(CASE WHEN derniere_connexion >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 END) as connectes_7_jours
  
FROM utilisateurs;

-- ============================================================================
-- TRIGGERS POUR MAINTENIR LES STATISTIQUES
-- ============================================================================

-- Trigger pour mettre à jour profil_complete automatiquement
DELIMITER //

CREATE TRIGGER IF NOT EXISTS update_profil_complete_candidat
AFTER INSERT ON profils_candidats
FOR EACH ROW
BEGIN
  UPDATE utilisateurs 
  SET profil_complete = TRUE 
  WHERE id_utilisateur = NEW.id_utilisateur;
END//

CREATE TRIGGER IF NOT EXISTS update_profil_complete_entreprise
AFTER INSERT ON profils_entreprises
FOR EACH ROW
BEGIN
  UPDATE utilisateurs 
  SET profil_complete = TRUE 
  WHERE id_utilisateur = NEW.id_utilisateur;
END//

CREATE TRIGGER IF NOT EXISTS update_profil_complete_admin
AFTER INSERT ON profils_admins
FOR EACH ROW
BEGIN
  UPDATE utilisateurs 
  SET profil_complete = TRUE 
  WHERE id_utilisateur = NEW.id_utilisateur;
END//

-- Trigger pour enregistrer automatiquement les changements de statut
CREATE TRIGGER IF NOT EXISTS audit_changement_statut
AFTER UPDATE ON utilisateurs
FOR EACH ROW
BEGIN
  IF OLD.statut != NEW.statut THEN
    INSERT INTO audit_actions_admin (
      admin_id, 
      utilisateur_cible_id, 
      type_action, 
      anciennes_valeurs, 
      nouvelles_valeurs,
      commentaire
    ) VALUES (
      1, -- ID admin système, à adapter selon votre logique
      NEW.id_utilisateur,
      'changement_statut',
      JSON_OBJECT('statut', OLD.statut),
      JSON_OBJECT('statut', NEW.statut),
      CONCAT('Changement automatique de statut de ', OLD.statut, ' vers ', NEW.statut)
    );
  END IF;
END//

DELIMITER ;

-- ============================================================================
-- PROCÉDURES STOCKÉES UTILES
-- ============================================================================

-- Procédure pour calculer les statistiques quotidiennes
DELIMITER //

CREATE PROCEDURE IF NOT EXISTS CalculerStatistiquesQuotidiennes(IN date_calcul DATE)
BEGIN
  INSERT INTO statistiques_utilisateurs (
    date_stat,
    total_utilisateurs,
    nouveaux_utilisateurs,
    utilisateurs_actifs,
    utilisateurs_suspendus,
    candidats_total,
    entreprises_total,
    admins_total
  )
  SELECT 
    date_calcul,
    COUNT(*),
    COUNT(CASE WHEN DATE(created_at) = date_calcul THEN 1 END),
    COUNT(CASE WHEN statut = 'actif' THEN 1 END),
    COUNT(CASE WHEN statut = 'suspendu' THEN 1 END),
    COUNT(CASE WHEN role = 'candidat' THEN 1 END),
    COUNT(CASE WHEN role = 'entreprise' THEN 1 END),
    COUNT(CASE WHEN role = 'admin' THEN 1 END)
  FROM utilisateurs
  WHERE created_at <= DATE_ADD(date_calcul, INTERVAL 1 DAY)
  ON DUPLICATE KEY UPDATE
    total_utilisateurs = VALUES(total_utilisateurs),
    nouveaux_utilisateurs = VALUES(nouveaux_utilisateurs),
    utilisateurs_actifs = VALUES(utilisateurs_actifs),
    utilisateurs_suspendus = VALUES(utilisateurs_suspendus),
    candidats_total = VALUES(candidats_total),
    entreprises_total = VALUES(entreprises_total),
    admins_total = VALUES(admins_total);
END//

-- Procédure pour nettoyer les anciens logs d'audit
CREATE PROCEDURE IF NOT EXISTS NettoyerAuditAncien(IN jours_retention INT)
BEGIN
  DELETE FROM audit_actions_admin 
  WHERE date_action < DATE_SUB(NOW(), INTERVAL jours_retention DAY);
  
  SELECT ROW_COUNT() as lignes_supprimees;
END//

DELIMITER ;

-- ============================================================================
-- DONNÉES DE TEST POUR L'AUDIT
-- ============================================================================

-- Insérer quelques actions d'audit de test
INSERT INTO audit_actions_admin (
  admin_id, 
  utilisateur_cible_id, 
  type_action, 
  nouvelles_valeurs,
  commentaire
) 
SELECT 
  (SELECT id_utilisateur FROM utilisateurs WHERE role = 'admin' LIMIT 1),
  u.id_utilisateur,
  'creation',
  JSON_OBJECT('nom', u.nom, 'email', u.email, 'role', u.role),
  'Création automatique lors de la migration'
FROM utilisateurs u 
WHERE u.role IN ('candidat', 'entreprise')
LIMIT 5;

-- ============================================================================
-- INDEX COMPOSITES POUR OPTIMISER LES REQUÊTES COMPLEXES
-- ============================================================================

-- Index pour les requêtes de filtrage fréquentes
ALTER TABLE utilisateurs 
ADD INDEX IF NOT EXISTS idx_role_statut (role, statut),
ADD INDEX IF NOT EXISTS idx_statut_created (statut, created_at),
ADD INDEX IF NOT EXISTS idx_role_created (role, created_at);

-- Index pour les recherches textuelles
ALTER TABLE utilisateurs 
ADD FULLTEXT INDEX IF NOT EXISTS idx_fulltext_nom_email (nom, email);

-- ============================================================================
-- REQUÊTES D'EXEMPLE POUR TESTER LES PERFORMANCES
-- ============================================================================

/*
-- Requête pour lister les utilisateurs avec filtres (utilisée par l'API)
SELECT 
  id_utilisateur, nom, email, role, statut, telephone, addresse,
  created_at, updated_at, derniere_connexion, profil_complete
FROM utilisateurs 
WHERE 
  role = 'candidat' 
  AND statut = 'actif' 
  AND DATE(created_at) >= '2024-01-01'
  AND (nom LIKE '%jean%' OR email LIKE '%jean%')
ORDER BY created_at DESC
LIMIT 10 OFFSET 0;

-- Requête pour les statistiques (utilisée par l'API)
SELECT 
  COUNT(*) as total,
  COUNT(CASE WHEN statut = 'actif' THEN 1 END) as actifs,
  COUNT(CASE WHEN statut = 'en_attente' THEN 1 END) as en_attente,
  COUNT(CASE WHEN statut = 'suspendu' THEN 1 END) as suspendus,
  COUNT(CASE WHEN role = 'candidat' THEN 1 END) as candidats,
  COUNT(CASE WHEN role = 'entreprise' THEN 1 END) as entreprises,
  COUNT(CASE WHEN role = 'admin' THEN 1 END) as admins
FROM utilisateurs;

-- Requête pour l'historique d'un utilisateur
SELECT 
  a.type_action,
  a.anciennes_valeurs,
  a.nouvelles_valeurs,
  a.commentaire,
  a.date_action,
  u.nom as admin_nom
FROM audit_actions_admin a
JOIN utilisateurs u ON a.admin_id = u.id_utilisateur
WHERE a.utilisateur_cible_id = 123
ORDER BY a.date_action DESC
LIMIT 20;
*/

-- ============================================================================
-- ÉVÉNEMENTS PROGRAMMÉS (OPTIONNEL)
-- ============================================================================

-- Événement pour calculer les statistiques quotidiennes automatiquement
/*
CREATE EVENT IF NOT EXISTS evt_statistiques_quotidiennes
ON SCHEDULE EVERY 1 DAY
STARTS '2024-01-01 01:00:00'
DO
  CALL CalculerStatistiquesQuotidiennes(CURDATE() - INTERVAL 1 DAY);

-- Événement pour nettoyer les anciens logs d'audit (garder 1 an)
CREATE EVENT IF NOT EXISTS evt_nettoyage_audit
ON SCHEDULE EVERY 1 WEEK
STARTS '2024-01-01 02:00:00'
DO
  CALL NettoyerAuditAncien(365);
*/