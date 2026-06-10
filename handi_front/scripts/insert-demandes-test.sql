-- Script SQL pour injecter des demandes en attente
-- À exécuter directement dans votre base de données

-- Insertion de candidats en attente d'approbation
INSERT INTO utilisateurs (nom, email, mot_de_passe, role, statut, telephone, addresse, created_at) VALUES
('Jean Dupont', 'jean.dupont@test.com', '$2b$10$hashedPassword1', 'candidat', 'en_attente', '0123456789', '123 Rue de Test, 75001 Paris', NOW()),
('Marie Martin', 'marie.martin@test.com', '$2b$10$hashedPassword2', 'candidat', 'en_attente', '0987654321', '456 Avenue Test, 69000 Lyon', NOW()),
('Pierre Durand', 'pierre.durand@test.com', '$2b$10$hashedPassword3', 'candidat', 'en_attente', '0145678901', '789 Boulevard Test, 13000 Marseille', NOW());

-- Insertion d'entreprises en attente d'approbation
INSERT INTO utilisateurs (nom, email, mot_de_passe, role, statut, telephone, addresse, created_at) VALUES
('TechCorp SARL', 'contact@techcorp.test.com', '$2b$10$hashedPassword4', 'entreprise', 'en_attente', '0156789012', '321 Rue Innovation, 92000 Nanterre', NOW()),
('InnovateLab', 'rh@innovatelab.test.com', '$2b$10$hashedPassword5', 'entreprise', 'en_attente', '0167890123', '654 Avenue Startup, 75011 Paris', NOW());

-- Vérification des données insérées
SELECT 
    nom, 
    email, 
    role, 
    statut, 
    telephone,
    created_at
FROM utilisateurs 
WHERE statut = 'en_attente' 
ORDER BY created_at DESC;