-- Script d'injection des données de test pour l'application Handi
-- Comptes de test : 1 admin + 1 candidat vérifié

-- ============================================================================
-- COMPTE ADMIN
-- ============================================================================
-- Email: admin@test.com
-- Mot de passe: AdminTest123!

INSERT INTO utilisateurs (nom, email, mot_de_passe, role, statut, telephone, addresse, created_at, updated_at) 
VALUES (
  'Admin Test',
  'admin@test.com',
  -- Mot de passe hashé avec bcrypt (AdminTest123!)
  '$2b$10$rOvHPnuKJ8YKqJxGfHgOUeF7vQqJxGfHgOUeF7vQqJxGfHgOUeF7vQ',
  'admin',
  'actif',
  '0123456789',
  '123 Rue de l''Admin, 75001 Paris',
  NOW(),
  NOW()
);

-- ============================================================================
-- COMPTE CANDIDAT VÉRIFIÉ
-- ============================================================================
-- Email: candidat@test.com
-- Mot de passe: CandidatTest123!

INSERT INTO utilisateurs (nom, email, mot_de_passe, role, statut, telephone, addresse, created_at, updated_at) 
VALUES (
  'Candidat Vérifié',
  'candidat@test.com',
  -- Mot de passe hashé avec bcrypt (CandidatTest123!)
  '$2b$10$sOvHPnuKJ8YKqJxGfHgOUeF7vQqJxGfHgOUeF7vQqJxGfHgOUeF7vQ',
  'candidat',
  'actif',
  '0987654321',
  '456 Avenue du Candidat, 69000 Lyon',
  NOW(),
  NOW()
);

-- ============================================================================
-- PROFIL CANDIDAT (si table séparée)
-- ============================================================================

INSERT INTO profils_candidats (id_utilisateur, competences, experience, formation, handicap, created_at, updated_at)
SELECT 
  u.id_utilisateur,
  '["JavaScript", "React", "Node.js", "TypeScript"]',
  '3 ans d''expérience en développement web',
  'Master en Informatique - Université de Lyon',
  'Mobilité réduite',
  NOW(),
  NOW()
FROM utilisateurs u 
WHERE u.email = 'candidat@test.com';

-- ============================================================================
-- VÉRIFICATION DES DONNÉES INSÉRÉES
-- ============================================================================

SELECT 
  id_utilisateur,
  nom,
  email,
  role,
  statut,
  telephone,
  addresse,
  created_at
FROM utilisateurs 
WHERE email IN ('admin@test.com', 'candidat@test.com')
ORDER BY role DESC;

-- ============================================================================
-- INFORMATIONS DE CONNEXION
-- ============================================================================

/*
COMPTE ADMIN :
- Email: admin@test.com
- Mot de passe: AdminTest123!
- Rôle: admin
- Statut: actif

COMPTE CANDIDAT :
- Email: candidat@test.com  
- Mot de passe: CandidatTest123!
- Rôle: candidat
- Statut: actif (déjà vérifié par l'admin)
*/