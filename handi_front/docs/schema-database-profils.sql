-- Schema de base de données pour les profils utilisateurs
-- Application Handi Talents

-- ============================================================================
-- TABLE PROFILS CANDIDATS
-- ============================================================================

CREATE TABLE IF NOT EXISTS profils_candidats (
  id_profil INT PRIMARY KEY AUTO_INCREMENT,
  id_utilisateur INT NOT NULL,
  competences JSON COMMENT 'Liste des compétences au format JSON',
  experience TEXT COMMENT 'Description de l\'expérience professionnelle',
  formation TEXT COMMENT 'Description de la formation',
  handicap TEXT COMMENT 'Informations sur le handicap (optionnel)',
  disponibilite VARCHAR(50) DEFAULT 'Immédiate' COMMENT 'Disponibilité pour un poste',
  salaire_souhaite VARCHAR(100) COMMENT 'Salaire souhaité (optionnel)',
  cv_url VARCHAR(255) COMMENT 'URL du CV uploadé',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (id_utilisateur) REFERENCES utilisateurs(id_utilisateur) ON DELETE CASCADE,
  INDEX idx_candidat_utilisateur (id_utilisateur)
);

-- ============================================================================
-- TABLE PROFILS ENTREPRISES
-- ============================================================================

CREATE TABLE IF NOT EXISTS profils_entreprises (
  id_profil INT PRIMARY KEY AUTO_INCREMENT,
  id_utilisateur INT NOT NULL,
  nom_entreprise VARCHAR(255) NOT NULL COMMENT 'Nom de l\'entreprise',
  secteur_activite VARCHAR(100) COMMENT 'Secteur d\'activité',
  taille_entreprise VARCHAR(50) COMMENT 'Taille de l\'entreprise',
  siret VARCHAR(14) COMMENT 'Numéro SIRET (14 chiffres)',
  site_web VARCHAR(255) COMMENT 'Site web de l\'entreprise',
  description TEXT COMMENT 'Description de l\'entreprise',
  politique_handicap TEXT COMMENT 'Politique d\'inclusion et handicap',
  contact_rh_nom VARCHAR(255) COMMENT 'Nom du contact RH',
  contact_rh_email VARCHAR(255) COMMENT 'Email du contact RH',
  contact_rh_telephone VARCHAR(20) COMMENT 'Téléphone du contact RH',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (id_utilisateur) REFERENCES utilisateurs(id_utilisateur) ON DELETE CASCADE,
  INDEX idx_entreprise_utilisateur (id_utilisateur),
  INDEX idx_entreprise_secteur (secteur_activite),
  INDEX idx_entreprise_taille (taille_entreprise)
);

-- ============================================================================
-- TABLE PROFILS ADMINS
-- ============================================================================

CREATE TABLE IF NOT EXISTS profils_admins (
  id_profil INT PRIMARY KEY AUTO_INCREMENT,
  id_utilisateur INT NOT NULL,
  poste VARCHAR(255) COMMENT 'Poste occupé',
  departement VARCHAR(100) COMMENT 'Département',
  date_embauche DATE COMMENT 'Date d\'embauche',
  notifications_email BOOLEAN DEFAULT TRUE COMMENT 'Notifications par email activées',
  notifications_sms BOOLEAN DEFAULT FALSE COMMENT 'Notifications par SMS activées',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (id_utilisateur) REFERENCES utilisateurs(id_utilisateur) ON DELETE CASCADE,
  INDEX idx_admin_utilisateur (id_utilisateur),
  INDEX idx_admin_departement (departement)
);

-- ============================================================================
-- DONNÉES DE TEST
-- ============================================================================

-- Insérer des profils de test pour les utilisateurs existants

-- Profil candidat de test
INSERT INTO profils_candidats (
  id_utilisateur, 
  competences, 
  experience, 
  formation, 
  handicap, 
  disponibilite, 
  salaire_souhaite
) 
SELECT 
  u.id_utilisateur,
  '["JavaScript", "React", "Node.js", "TypeScript"]',
  '3 ans d\'expérience en développement web full-stack. Spécialisé dans les technologies React et Node.js. Expérience en développement d\'applications accessibles.',
  'Master en Informatique - Université de Lyon\nFormation en accessibilité numérique',
  'Mobilité réduite - Besoin d\'un poste de travail adapté',
  'Immédiate',
  '35000€ annuel'
FROM utilisateurs u 
WHERE u.email = 'candidat@test.com' AND u.role = 'candidat'
ON DUPLICATE KEY UPDATE
  competences = VALUES(competences),
  experience = VALUES(experience),
  formation = VALUES(formation);

-- Profil entreprise de test
INSERT INTO profils_entreprises (
  id_utilisateur,
  nom_entreprise,
  secteur_activite,
  taille_entreprise,
  siret,
  site_web,
  description,
  politique_handicap,
  contact_rh_nom,
  contact_rh_email,
  contact_rh_telephone
)
SELECT 
  u.id_utilisateur,
  'TechCorp Solutions',
  'Technologie / Informatique',
  '51-200 employés',
  '12345678901234',
  'https://www.techcorp-solutions.com',
  'Entreprise spécialisée dans le développement de solutions logicielles innovantes. Nous accompagnons nos clients dans leur transformation digitale avec une approche centrée sur l\'accessibilité et l\'inclusion.',
  'Notre entreprise s\'engage activement pour l\'inclusion des personnes en situation de handicap. Nous proposons des aménagements de poste, des horaires flexibles et un environnement de travail adapté. Nous sommes certifiés pour l\'accueil de travailleurs handicapés.',
  'Sophie Dubois',
  'rh@techcorp-solutions.com',
  '0123456790'
FROM utilisateurs u 
WHERE u.email LIKE '%entreprise%' AND u.role = 'entreprise'
LIMIT 1
ON DUPLICATE KEY UPDATE
  nom_entreprise = VALUES(nom_entreprise),
  description = VALUES(description);

-- Profil admin de test
INSERT INTO profils_admins (
  id_utilisateur,
  poste,
  departement,
  date_embauche,
  notifications_email,
  notifications_sms
)
SELECT 
  u.id_utilisateur,
  'Administrateur Système',
  'Informatique / IT',
  '2023-01-15',
  TRUE,
  FALSE
FROM utilisateurs u 
WHERE u.email = 'admin@test.com' AND u.role = 'admin'
ON DUPLICATE KEY UPDATE
  poste = VALUES(poste);

-- ============================================================================
-- VUES UTILES
-- ============================================================================

-- Vue complète des candidats avec leurs profils
CREATE OR REPLACE VIEW vue_candidats_complets AS
SELECT 
  u.id_utilisateur,
  u.nom,
  u.email,
  u.telephone,
  u.addresse,
  u.statut,
  u.created_at as date_inscription,
  pc.competences,
  pc.experience,
  pc.formation,
  pc.handicap,
  pc.disponibilite,
  pc.salaire_souhaite,
  pc.cv_url,
  pc.updated_at as profil_mis_a_jour
FROM utilisateurs u
LEFT JOIN profils_candidats pc ON u.id_utilisateur = pc.id_utilisateur
WHERE u.role = 'candidat';

-- Vue complète des entreprises avec leurs profils
CREATE OR REPLACE VIEW vue_entreprises_completes AS
SELECT 
  u.id_utilisateur,
  u.nom as nom_contact,
  u.email,
  u.telephone,
  u.addresse,
  u.statut,
  u.created_at as date_inscription,
  pe.nom_entreprise,
  pe.secteur_activite,
  pe.taille_entreprise,
  pe.siret,
  pe.site_web,
  pe.description,
  pe.politique_handicap,
  pe.contact_rh_nom,
  pe.contact_rh_email,
  pe.contact_rh_telephone,
  pe.updated_at as profil_mis_a_jour
FROM utilisateurs u
LEFT JOIN profils_entreprises pe ON u.id_utilisateur = pe.id_utilisateur
WHERE u.role = 'entreprise';

-- Vue complète des admins avec leurs profils
CREATE OR REPLACE VIEW vue_admins_complets AS
SELECT 
  u.id_utilisateur,
  u.nom,
  u.email,
  u.telephone,
  u.addresse,
  u.statut,
  u.created_at as date_inscription,
  pa.poste,
  pa.departement,
  pa.date_embauche,
  pa.notifications_email,
  pa.notifications_sms,
  pa.updated_at as profil_mis_a_jour
FROM utilisateurs u
LEFT JOIN profils_admins pa ON u.id_utilisateur = pa.id_utilisateur
WHERE u.role = 'admin';

-- ============================================================================
-- INDEX POUR OPTIMISATION
-- ============================================================================

-- Index pour les recherches de compétences (candidats)
-- Note: Pour MySQL 8.0+, vous pouvez créer des index sur les colonnes JSON
-- ALTER TABLE profils_candidats ADD INDEX idx_competences ((CAST(competences AS CHAR(255) ARRAY)));

-- Index pour les recherches par secteur d'activité
CREATE INDEX idx_secteur_activite ON profils_entreprises(secteur_activite);

-- Index pour les recherches par taille d'entreprise
CREATE INDEX idx_taille_entreprise ON profils_entreprises(taille_entreprise);

-- Index pour les recherches par disponibilité
CREATE INDEX idx_disponibilite ON profils_candidats(disponibilite);

-- ============================================================================
-- TRIGGERS POUR AUDIT
-- ============================================================================

-- Trigger pour logger les modifications de profils candidats
DELIMITER //
CREATE TRIGGER audit_profil_candidat_update
AFTER UPDATE ON profils_candidats
FOR EACH ROW
BEGIN
  INSERT INTO audit_log (
    table_name, 
    operation, 
    record_id, 
    user_id, 
    old_values, 
    new_values, 
    timestamp
  ) VALUES (
    'profils_candidats',
    'UPDATE',
    NEW.id_profil,
    NEW.id_utilisateur,
    JSON_OBJECT(
      'competences', OLD.competences,
      'experience', OLD.experience,
      'formation', OLD.formation
    ),
    JSON_OBJECT(
      'competences', NEW.competences,
      'experience', NEW.experience,
      'formation', NEW.formation
    ),
    NOW()
  );
END//
DELIMITER ;

-- ============================================================================
-- REQUÊTES UTILES POUR LES STATISTIQUES
-- ============================================================================

-- Nombre de profils complétés par type
/*
SELECT 
  'candidats' as type,
  COUNT(*) as total_utilisateurs,
  COUNT(pc.id_profil) as profils_completes,
  ROUND(COUNT(pc.id_profil) * 100.0 / COUNT(*), 2) as pourcentage_completion
FROM utilisateurs u
LEFT JOIN profils_candidats pc ON u.id_utilisateur = pc.id_utilisateur
WHERE u.role = 'candidat'

UNION ALL

SELECT 
  'entreprises' as type,
  COUNT(*) as total_utilisateurs,
  COUNT(pe.id_profil) as profils_completes,
  ROUND(COUNT(pe.id_profil) * 100.0 / COUNT(*), 2) as pourcentage_completion
FROM utilisateurs u
LEFT JOIN profils_entreprises pe ON u.id_utilisateur = pe.id_utilisateur
WHERE u.role = 'entreprise';
*/

-- Compétences les plus demandées
/*
SELECT 
  competence,
  COUNT(*) as nombre_candidats
FROM (
  SELECT JSON_UNQUOTE(JSON_EXTRACT(competences, CONCAT('$[', idx, ']'))) as competence
  FROM profils_candidats
  CROSS JOIN (
    SELECT 0 as idx UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 
    UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9
  ) as indices
  WHERE JSON_EXTRACT(competences, CONCAT('$[', idx, ']')) IS NOT NULL
) as competences_extraites
GROUP BY competence
ORDER BY nombre_candidats DESC
LIMIT 10;
*/