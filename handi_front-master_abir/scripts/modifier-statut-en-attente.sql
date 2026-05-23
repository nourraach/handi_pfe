-- Script pour modifier des utilisateurs existants en statut "en_attente"
-- À exécuter dans votre base de données

-- 1. Voir les utilisateurs actuels
SELECT 'AVANT MODIFICATION:' as info;
SELECT nom, email, role, statut, created_at 
FROM utilisateurs 
ORDER BY created_at DESC;

-- 2. Modifier des utilisateurs pour les mettre en attente
UPDATE utilisateurs 
SET statut = 'en_attente' 
WHERE role IN ('candidat', 'entreprise') 
AND statut = 'actif' 
LIMIT 3;

-- 3. Vérifier le résultat
SELECT 'APRÈS MODIFICATION:' as info;
SELECT nom, email, role, statut, created_at 
FROM utilisateurs 
WHERE statut = 'en_attente'
ORDER BY created_at DESC;

-- 4. Voir tous les utilisateurs après modification
SELECT 'TOUS LES UTILISATEURS:' as info;
SELECT nom, email, role, statut 
FROM utilisateurs 
ORDER BY statut, role;