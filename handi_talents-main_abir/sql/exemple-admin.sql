INSERT INTO utilisateur
(id_utilisateur, nom, email, mdp, telephone, addresse, role, statut, genre)
VALUES
(gen_random_uuid(), 'Admin', 'admin@handitalents.com', '<mot_de_passe_hashe>', '00000000', 'Tunis', 'admin', 'actif', 'homme');
