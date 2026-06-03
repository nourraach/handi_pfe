BEGIN;

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Common password for all seeded users: Test1234!
WITH seed_users(id_utilisateur, nom, email, role, telephone, addresse, region, gouvernorat, delegation, genre) AS (
  VALUES
    ('11111111-1111-4111-8111-111111111111'::uuid, 'Admin HandiTalents', 'admin.demo@handitalents.tn', 'admin'::role_utilisateur, '+216 70 100 100', 'Centre Urbain Nord, Tunis', 'Grand Tunis', 'Tunis', 'Cite El Khadra', 'femme'::genre_utilisateur),
    ('22222222-2222-4222-8222-222222222201'::uuid, 'TechAccess Tunisie RH', 'rh.techaccess@handitalents.tn', 'entreprise'::role_utilisateur, '+216 71 245 100', 'Les Berges du Lac 2, Tunis', 'Grand Tunis', 'Tunis', 'La Marsa', 'femme'::genre_utilisateur),
    ('22222222-2222-4222-8222-222222222202'::uuid, 'MedSoft Solutions RH', 'rh.medsoft@handitalents.tn', 'entreprise'::role_utilisateur, '+216 73 310 420', 'Technopole de Sousse', 'Sahel', 'Sousse', 'Sahloul', 'homme'::genre_utilisateur),
    ('22222222-2222-4222-8222-222222222203'::uuid, 'TuniRetail Inclusive RH', 'rh.tuniretail@handitalents.tn', 'entreprise'::role_utilisateur, '+216 74 620 350', 'Route de Tunis, Sfax', 'Sud', 'Sfax', 'Sfax Ville', 'femme'::genre_utilisateur),
    ('33333333-3333-4333-8333-333333333301'::uuid, 'Amira Ben Salem', 'amira.candidat@handitalents.tn', 'candidat'::role_utilisateur, '+216 52 111 301', 'Ariana Centre', 'Grand Tunis', 'Ariana', 'Ariana Ville', 'femme'::genre_utilisateur),
    ('33333333-3333-4333-8333-333333333302'::uuid, 'Karim Trabelsi', 'karim.candidat@handitalents.tn', 'candidat'::role_utilisateur, '+216 55 222 302', 'Sahloul, Sousse', 'Sahel', 'Sousse', 'Sahloul', 'homme'::genre_utilisateur),
    ('33333333-3333-4333-8333-333333333303'::uuid, 'Yasmine Ayari', 'yasmine.candidat@handitalents.tn', 'candidat'::role_utilisateur, '+216 58 333 303', 'El Menzah 6, Tunis', 'Grand Tunis', 'Tunis', 'El Menzah', 'femme'::genre_utilisateur)
)
INSERT INTO utilisateur (
  id_utilisateur, nom, mdp, telephone, addresse, email, region, gouvernorat, delegation,
  statut, role, genre, profil_complete, derniere_connexion, created_at, updated_at
)
SELECT
  id_utilisateur,
  nom,
  '$2b$10$yva20KP7Kj2x6J6ds3pr0e.iMYdHlhwFNTxoQtgr62Kq64tZUggnW',
  telephone,
  addresse,
  email,
  region,
  gouvernorat,
  delegation,
  'actif'::statut_utilisateur,
  role,
  genre,
  TRUE,
  NOW() - INTERVAL '2 days',
  NOW() - INTERVAL '20 days',
  NOW()
FROM seed_users
ON CONFLICT (email) DO UPDATE SET
  nom = EXCLUDED.nom,
  mdp = EXCLUDED.mdp,
  telephone = EXCLUDED.telephone,
  addresse = EXCLUDED.addresse,
  region = EXCLUDED.region,
  gouvernorat = EXCLUDED.gouvernorat,
  delegation = EXCLUDED.delegation,
  statut = EXCLUDED.statut,
  role = EXCLUDED.role,
  genre = EXCLUDED.genre,
  profil_complete = EXCLUDED.profil_complete,
  updated_at = NOW();

INSERT INTO admin (id, id_utilisateur, poste, departement, date_embauche, permissions, notifications_email, notifications_sms)
VALUES (
  '11111111-1111-4111-8111-000000000001',
  '11111111-1111-4111-8111-111111111111',
  'Responsable validation plateforme',
  'Operations HandiTalents',
  '2025-09-15',
  '["validation_offres", "gestion_utilisateurs", "tests_psychologiques", "reporting"]'::json,
  TRUE,
  FALSE
)
ON CONFLICT (id_utilisateur) DO UPDATE SET
  poste = EXCLUDED.poste,
  departement = EXCLUDED.departement,
  permissions = EXCLUDED.permissions,
  updated_at = NOW();

INSERT INTO entreprise (
  id, id_utilisateur, nom_entreprise, patente, rne, statut_validation, profil_publique,
  url_site, date_fondation, description, nbr_employe, nbr_employe_handicape,
  secteur_activite, taille_entreprise, siret, site_web, politique_handicap,
  contact_rh_nom, contact_rh_email, contact_rh_telephone,
  subscription_pack, subscription_status, subscription_price_tnd, subscription_cycle, subscribed_at
)
VALUES
  (
    '22222222-2222-4222-8222-000000000201',
    '22222222-2222-4222-8222-222222222201',
    'TechAccess Tunisie',
    'PAT-TA-2026-001',
    'RNE-B123456789',
    'valide',
    TRUE,
    'https://techaccess.example.tn',
    '2018-03-12',
    'Editeur tunisien de solutions SaaS RH et accessibilite numerique pour institutions publiques et entreprises.',
    86,
    9,
    'Technologies de l information',
    '51-100',
    'TN-TA-2018-001',
    'https://techaccess.example.tn',
    'Recrutement inclusif, postes compatibles teletravail hybride, audits WCAG trimestriels et referent accessibilite interne.',
    'Nadia Gharbi',
    'nadia.gharbi@techaccess.example.tn',
    '+216 71 245 101',
    'premium',
    'active',
    690,
    'monthly',
    NOW() - INTERVAL '45 days'
  ),
  (
    '22222222-2222-4222-8222-000000000202',
    '22222222-2222-4222-8222-222222222202',
    'MedSoft Solutions',
    'PAT-MS-2026-014',
    'RNE-S987654321',
    'valide',
    TRUE,
    'https://medsoft.example.tn',
    '2015-06-21',
    'Entreprise de logiciels de sante connectee, specialisee dans les parcours patients et les tableaux de bord cliniques.',
    134,
    14,
    'HealthTech',
    '101-250',
    'TN-MS-2015-014',
    'https://medsoft.example.tn',
    'Locaux accessibles, horaires flexibles, outil de transcription automatique en reunion et accompagnement manager.',
    'Sami Kallel',
    'sami.kallel@medsoft.example.tn',
    '+216 73 310 421',
    'standard',
    'active',
    390,
    'monthly',
    NOW() - INTERVAL '30 days'
  ),
  (
    '22222222-2222-4222-8222-000000000203',
    '22222222-2222-4222-8222-222222222203',
    'TuniRetail Inclusive',
    'PAT-TR-2026-006',
    'RNE-SF246801357',
    'valide',
    TRUE,
    'https://tuniretail.example.tn',
    '2012-11-05',
    'Reseau retail omnicanal base a Sfax, developpant des services digitaux accessibles pour clients et equipes terrain.',
    220,
    19,
    'Commerce et services digitaux',
    '201-500',
    'TN-TR-2012-006',
    'https://tuniretail.example.tn',
    'Formation interne a la communication inclusive, adaptation postes back-office et suivi RH mensuel.',
    'Leila Sassi',
    'leila.sassi@tuniretail.example.tn',
    '+216 74 620 351',
    'premium',
    'active',
    690,
    'monthly',
    NOW() - INTERVAL '62 days'
  )
ON CONFLICT (id) DO UPDATE SET
  nom_entreprise = EXCLUDED.nom_entreprise,
  statut_validation = EXCLUDED.statut_validation,
  profil_publique = EXCLUDED.profil_publique,
  description = EXCLUDED.description,
  nbr_employe = EXCLUDED.nbr_employe,
  nbr_employe_handicape = EXCLUDED.nbr_employe_handicape,
  secteur_activite = EXCLUDED.secteur_activite,
  taille_entreprise = EXCLUDED.taille_entreprise,
  politique_handicap = EXCLUDED.politique_handicap,
  contact_rh_nom = EXCLUDED.contact_rh_nom,
  contact_rh_email = EXCLUDED.contact_rh_email,
  contact_rh_telephone = EXCLUDED.contact_rh_telephone,
  updated_at = NOW();

INSERT INTO profil_entreprise (id, id_utilisateur, secteur, taille, description, site_web, siret, contact_rh)
VALUES
  ('22222222-2222-4222-8222-100000000201', '22222222-2222-4222-8222-222222222201', 'Technologies de l information', '51-100', 'SaaS RH inclusif, outils accessibles et accompagnement des equipes.', 'https://techaccess.example.tn', 'TN-TA-2018-001', 'Nadia Gharbi - nadia.gharbi@techaccess.example.tn'),
  ('22222222-2222-4222-8222-100000000202', '22222222-2222-4222-8222-222222222202', 'HealthTech', '101-250', 'Solutions de sante numerique avec forte culture qualite et accessibilite.', 'https://medsoft.example.tn', 'TN-MS-2015-014', 'Sami Kallel - sami.kallel@medsoft.example.tn'),
  ('22222222-2222-4222-8222-100000000203', '22222222-2222-4222-8222-222222222203', 'Commerce et services digitaux', '201-500', 'Retail omnicanal avec operations back-office inclusives.', 'https://tuniretail.example.tn', 'TN-TR-2012-006', 'Leila Sassi - leila.sassi@tuniretail.example.tn')
ON CONFLICT (id_utilisateur) DO UPDATE SET
  secteur = EXCLUDED.secteur,
  taille = EXCLUDED.taille,
  description = EXCLUDED.description,
  site_web = EXCLUDED.site_web,
  contact_rh = EXCLUDED.contact_rh,
  updated_at = NOW();

INSERT INTO candidat (
  id, id_utilisateur, type_handicap, num_carte_handicap, date_expiration_carte_handicap,
  niveau_academique, description, secteur, type_licence, preference_communication, age,
  competences, experience, formation, handicap, disponibilite, salaire_souhaite,
  preferences_accessibilite, visibilite, photo_profil_url
)
VALUES
  (
    '33333333-3333-4333-8333-000000000301',
    '33333333-3333-4333-8333-333333333301',
    'moteur',
    'HC-ARI-2026-301',
    '2028-10-01',
    'Licence appliquee',
    'Developpeuse frontend junior orientee accessibilite, motivee par les interfaces inclusives et les parcours utilisateurs simples.',
    'Developpement web',
    'Informatique',
    'email',
    27,
    '["React", "TypeScript", "Next.js", "CSS accessible", "Tests utilisateurs", "Figma"]'::json,
    '2 ans en integration web, refonte de composants React et amelioration WCAG sur un portail associatif.',
    'Licence appliquee en informatique de gestion - ISET Charguia.',
    'Mobilite reduite; besoin de locaux accessibles ou teletravail partiel.',
    'Immediate, hybride ou teletravail 3 jours/semaine.',
    '1800-2300 TND',
    '{"teletravail": true, "locaux_accessibles": true, "temps_pause": true}'::json,
    '{"profil": true, "soft_skills": true, "cv": true}'::json,
    '/uploads/photo1.png'
  ),
  (
    '33333333-3333-4333-8333-000000000302',
    '33333333-3333-4333-8333-333333333302',
    'auditif',
    'HC-SOU-2026-302',
    '2029-02-15',
    'Master professionnel',
    'Analyste donnees avec experience BI, tres a l aise sur SQL, Power BI et automatisation de reporting operationnel.',
    'Data / BI',
    'Business Intelligence',
    'email',
    31,
    '["SQL", "Power BI", "Python", "Excel avance", "ETL", "Tableaux de bord"]'::json,
    '4 ans en reporting commercial et finance; creation de dashboards hebdomadaires pour directions regionales.',
    'Master BI - Universite de Sousse.',
    'Deficience auditive; prefere supports ecrits et sous-titrage en reunion.',
    'Disponible sous 30 jours.',
    '2600-3200 TND',
    '{"sous_titrage": true, "support_ecrit": true, "chat": true}'::json,
    '{"profil": true, "soft_skills": true, "cv": true}'::json,
    '/uploads/photo2.png'
  ),
  (
    '33333333-3333-4333-8333-000000000303',
    '33333333-3333-4333-8333-333333333303',
    'visuel',
    'HC-TUN-2026-303',
    '2028-05-20',
    'BTS',
    'Chargee support client et QA manuelle, attentive aux details, avec forte culture service et documentation.',
    'Support client / QA',
    'Gestion et qualite',
    'telephone',
    29,
    '["Support client", "Jira", "Tests manuels", "Documentation", "CRM", "Accessibilite"]'::json,
    '3 ans en support niveau 1 et recette fonctionnelle dans un centre de services.',
    'BTS Gestion qualite - Tunis.',
    'Basse vision; utilise agrandissement ecran et contraste eleve.',
    'Immediate, presentiel accessible ou hybride.',
    '1700-2200 TND',
    '{"contraste_eleve": true, "lecteur_ecran": true, "documents_accessibles": true}'::json,
    '{"profil": true, "soft_skills": false, "cv": true}'::json,
    '/uploads/photo3.png'
  )
ON CONFLICT (id) DO UPDATE SET
  type_handicap = EXCLUDED.type_handicap,
  niveau_academique = EXCLUDED.niveau_academique,
  description = EXCLUDED.description,
  secteur = EXCLUDED.secteur,
  competences = EXCLUDED.competences,
  experience = EXCLUDED.experience,
  formation = EXCLUDED.formation,
  handicap = EXCLUDED.handicap,
  disponibilite = EXCLUDED.disponibilite,
  salaire_souhaite = EXCLUDED.salaire_souhaite,
  preferences_accessibilite = EXCLUDED.preferences_accessibilite,
  visibilite = EXCLUDED.visibilite,
  updated_at = NOW();

INSERT INTO profil_candidat (id, id_utilisateur, competences, experience, formation, handicap, disponibilite, salaire_souhaite, cv_url)
SELECT
  gen_random_uuid(),
  c.id_utilisateur,
  c.competences,
  c.experience,
  c.formation,
  c.handicap,
  c.disponibilite,
  c.salaire_souhaite,
  '/uploads/cv-demo.pdf'
FROM candidat c
WHERE c.id IN (
  '33333333-3333-4333-8333-000000000301',
  '33333333-3333-4333-8333-000000000302',
  '33333333-3333-4333-8333-000000000303'
)
ON CONFLICT (id_utilisateur) DO UPDATE SET
  competences = EXCLUDED.competences,
  experience = EXCLUDED.experience,
  formation = EXCLUDED.formation,
  handicap = EXCLUDED.handicap,
  disponibilite = EXCLUDED.disponibilite,
  salaire_souhaite = EXCLUDED.salaire_souhaite,
  cv_url = EXCLUDED.cv_url,
  updated_at = NOW();

INSERT INTO candidate_matching_consent (id_candidat, allow_accessibility_matching, allow_semantic_embedding)
VALUES
  ('33333333-3333-4333-8333-000000000301', TRUE, TRUE),
  ('33333333-3333-4333-8333-000000000302', TRUE, TRUE),
  ('33333333-3333-4333-8333-000000000303', TRUE, TRUE)
ON CONFLICT (id_candidat) DO UPDATE SET
  allow_accessibility_matching = EXCLUDED.allow_accessibility_matching,
  allow_semantic_embedding = EXCLUDED.allow_semantic_embedding,
  updated_at = NOW();

INSERT INTO test_psychologique (
  id_test, titre, description, type_test, score_total, duree_minutes, statut,
  date_debut_validite, date_fin_validite, instructions, created_by
)
VALUES
  (
    '88888888-8888-4888-8888-000000000801',
    'Soft Skills - Communication inclusive',
    'Evalue la clarte des messages, l ecoute active, la reformulation et la capacite a demander des amenagements sans tension.',
    'soft_skills',
    25,
    18,
    'actif',
    '2026-01-01',
    '2027-12-31',
    'Lisez chaque situation et choisissez la reaction la plus proche de votre comportement habituel.',
    '11111111-1111-4111-8111-111111111111'
  ),
  (
    '88888888-8888-4888-8888-000000000802',
    'Soft Skills - Collaboration et adaptation',
    'Mesure la collaboration en equipe, la gestion du changement, la demande d aide et la contribution aux rituels de travail.',
    'soft_skills',
    25,
    20,
    'actif',
    '2026-01-01',
    '2027-12-31',
    'Repondez spontanement. Il n y a pas de bonne image a donner, seulement des pratiques a identifier.',
    '11111111-1111-4111-8111-111111111111'
  ),
  (
    '88888888-8888-4888-8888-000000000803',
    'Soft Skills - Priorisation et autonomie',
    'Evalue l organisation personnelle, la priorisation, l alerte en cas de blocage et la fiabilite dans les delais.',
    'soft_skills',
    25,
    16,
    'actif',
    '2026-01-01',
    '2027-12-31',
    'Choisissez l option qui decrit le mieux votre reaction dans un contexte professionnel.',
    '11111111-1111-4111-8111-111111111111'
  )
ON CONFLICT (id_test) DO UPDATE SET
  titre = EXCLUDED.titre,
  description = EXCLUDED.description,
  type_test = EXCLUDED.type_test,
  score_total = EXCLUDED.score_total,
  duree_minutes = EXCLUDED.duree_minutes,
  statut = EXCLUDED.statut,
  date_debut_validite = EXCLUDED.date_debut_validite,
  date_fin_validite = EXCLUDED.date_fin_validite,
  instructions = EXCLUDED.instructions,
  updated_at = NOW();

WITH question_seed(id_question, id_test, contenu_question, ordre) AS (
  VALUES
    ('90000000-0000-4000-8000-000000000101'::uuid, '88888888-8888-4888-8888-000000000801'::uuid, 'Un collegue vous donne une consigne ambigue avant une livraison. Que faites-vous en premier ?', 1),
    ('90000000-0000-4000-8000-000000000102'::uuid, '88888888-8888-4888-8888-000000000801'::uuid, 'En reunion, une personne coupe souvent la parole. Quelle reaction privilegiez-vous ?', 2),
    ('90000000-0000-4000-8000-000000000103'::uuid, '88888888-8888-4888-8888-000000000801'::uuid, 'Vous avez besoin d un amenagement pour travailler efficacement. Comment l exprimez-vous ?', 3),
    ('90000000-0000-4000-8000-000000000104'::uuid, '88888888-8888-4888-8888-000000000801'::uuid, 'Un client est insatisfait d une reponse. Quelle posture adoptez-vous ?', 4),
    ('90000000-0000-4000-8000-000000000105'::uuid, '88888888-8888-4888-8888-000000000801'::uuid, 'Vous recevez un feedback critique mais utile. Que faites-vous ?', 5),
    ('90000000-0000-4000-8000-000000000201'::uuid, '88888888-8888-4888-8888-000000000802'::uuid, 'Une priorite change au dernier moment. Quelle attitude choisissez-vous ?', 1),
    ('90000000-0000-4000-8000-000000000202'::uuid, '88888888-8888-4888-8888-000000000802'::uuid, 'Un membre de l equipe semble bloque. Comment contribuez-vous ?', 2),
    ('90000000-0000-4000-8000-000000000203'::uuid, '88888888-8888-4888-8888-000000000802'::uuid, 'Vous devez collaborer avec une personne au style tres different. Que faites-vous ?', 3),
    ('90000000-0000-4000-8000-000000000204'::uuid, '88888888-8888-4888-8888-000000000802'::uuid, 'Vous detectez une erreur dans un livrable collectif. Quelle action est la plus constructive ?', 4),
    ('90000000-0000-4000-8000-000000000205'::uuid, '88888888-8888-4888-8888-000000000802'::uuid, 'Un nouvel outil est impose a l equipe. Comment vous adaptez-vous ?', 5),
    ('90000000-0000-4000-8000-000000000301'::uuid, '88888888-8888-4888-8888-000000000803'::uuid, 'Vous avez trois taches urgentes dans la journee. Que faites-vous ?', 1),
    ('90000000-0000-4000-8000-000000000302'::uuid, '88888888-8888-4888-8888-000000000803'::uuid, 'Vous prenez du retard sur une mission. Quelle reaction est la plus fiable ?', 2),
    ('90000000-0000-4000-8000-000000000303'::uuid, '88888888-8888-4888-8888-000000000803'::uuid, 'Vous travaillez seul sur une tache nouvelle. Quelle methode utilisez-vous ?', 3),
    ('90000000-0000-4000-8000-000000000304'::uuid, '88888888-8888-4888-8888-000000000803'::uuid, 'Une demande arrive sans deadline claire. Que faites-vous ?', 4),
    ('90000000-0000-4000-8000-000000000305'::uuid, '88888888-8888-4888-8888-000000000803'::uuid, 'Vous terminez une tache plus tot que prevu. Quelle suite donnez-vous ?', 5)
)
INSERT INTO question (id_question, id_test, contenu_question, type_question, score_question, ordre, obligatoire)
SELECT id_question, id_test, contenu_question, 'echelle_likert'::type_question, 5, ordre, TRUE
FROM question_seed
ON CONFLICT (id_question) DO UPDATE SET
  contenu_question = EXCLUDED.contenu_question,
  type_question = EXCLUDED.type_question,
  score_question = EXCLUDED.score_question,
  ordre = EXCLUDED.ordre,
  obligatoire = EXCLUDED.obligatoire;

WITH options_seed(question_id, label, score, ordre) AS (
  SELECT q.id_question, v.label, v.score, v.ordre
  FROM question q
  CROSS JOIN (
    VALUES
      ('Pas du tout d accord', 1, 1),
      ('Plutot pas d accord', 2, 2),
      ('Neutre', 3, 3),
      ('Plutot d accord', 4, 4),
      ('Tout a fait d accord', 5, 5)
  ) AS v(label, score, ordre)
  WHERE q.id_question::text LIKE '90000000-0000-4000-8000-000000000%'
)
INSERT INTO option_reponse (id_option, id_question, texte_option, est_correcte, score_option, ordre)
SELECT
  md5(question_id::text || '-' || ordre::text)::uuid,
  question_id,
  label,
  score >= 4,
  score,
  ordre
FROM options_seed
ON CONFLICT (id_option) DO UPDATE SET
  texte_option = EXCLUDED.texte_option,
  est_correcte = EXCLUDED.est_correcte,
  score_option = EXCLUDED.score_option,
  ordre = EXCLUDED.ordre;

INSERT INTO resultat_test (id_resultat, id_test, id_candidat, score_obtenu, pourcentage, temps_passe_minutes, est_visible, date_passage, reponses)
VALUES
  ('88000000-0000-4000-8000-000000000901', '88888888-8888-4888-8888-000000000801', '33333333-3333-4333-8333-333333333301', 22, 88, 14, TRUE, NOW() - INTERVAL '18 days', '{"profil": "communication claire", "commentaire": "Bonne reformulation et demande d amenagement explicite."}'::json),
  ('88000000-0000-4000-8000-000000000902', '88888888-8888-4888-8888-000000000802', '33333333-3333-4333-8333-333333333302', 20, 80, 16, TRUE, NOW() - INTERVAL '25 days', '{"profil": "collaboration stable", "commentaire": "Bon niveau d adaptation et soutien equipe."}'::json),
  ('88000000-0000-4000-8000-000000000903', '88888888-8888-4888-8888-000000000803', '33333333-3333-4333-8333-333333333303', 18, 72, 13, FALSE, NOW() - INTERVAL '11 days', '{"profil": "autonomie en progression", "commentaire": "Priorisation correcte, visibilite volontairement masquee."}'::json)
ON CONFLICT (id_resultat) DO UPDATE SET
  score_obtenu = EXCLUDED.score_obtenu,
  pourcentage = EXCLUDED.pourcentage,
  temps_passe_minutes = EXCLUDED.temps_passe_minutes,
  est_visible = EXCLUDED.est_visible,
  date_passage = EXCLUDED.date_passage,
  reponses = EXCLUDED.reponses;

INSERT INTO offre_emploi (
  id, id_entreprise, titre, description, localisation, type_poste,
  salaire_min, salaire_max, competences_requises, experience_requise, niveau_etude,
  statut, date_limite, accessibilite_handicap, amenagements_possibles, created_at, updated_at
)
VALUES
  (
    '44444444-4444-4444-8444-000000000401',
    '22222222-2222-4222-8222-000000000201',
    'Developpeur Frontend React accessible',
    'Concevoir des interfaces React/Next.js accessibles pour un portail RH inclusif. Collaboration avec UX, QA et referent accessibilite.',
    'Tunis - Hybride',
    'cdi',
    '2200',
    '3200',
    'React, TypeScript, Next.js, CSS, WCAG, tests utilisateurs',
    '2 ans minimum en developpement frontend',
    'Licence ou equivalent',
    'active',
    '2026-08-30',
    TRUE,
    'Teletravail 3 jours/semaine, horaires flexibles, locaux accessibles, materiel ergonomique.',
    NOW() - INTERVAL '16 days',
    NOW()
  ),
  (
    '44444444-4444-4444-8444-000000000402',
    '22222222-2222-4222-8222-000000000202',
    'Data Analyst BI sante',
    'Analyser les indicateurs operationnels, automatiser les rapports Power BI et produire des tableaux de bord pour equipes medicales.',
    'Sousse - Hybride',
    'cdi',
    '2600',
    '3800',
    'SQL, Power BI, Python, ETL, data quality, Excel avance',
    '3 ans en BI ou reporting',
    'Master ou equivalent',
    'active',
    '2026-09-10',
    TRUE,
    'Sous-titrage reunion, comptes rendus ecrits, teletravail partiel, bureau calme.',
    NOW() - INTERVAL '12 days',
    NOW()
  ),
  (
    '44444444-4444-4444-8444-000000000403',
    '22222222-2222-4222-8222-000000000203',
    'Charge support client digital',
    'Accompagner les utilisateurs du portail retail, documenter les incidents et participer aux recettes fonctionnelles.',
    'Sfax - Presentiel accessible',
    'cdd',
    '1700',
    '2400',
    'Support client, CRM, Jira, documentation, tests manuels',
    '2 ans en support ou QA',
    'BTS ou licence',
    'active',
    '2026-08-20',
    TRUE,
    'Poste back-office accessible, contraste eleve, documents numeriques accessibles.',
    NOW() - INTERVAL '9 days',
    NOW()
  ),
  (
    '55555555-5555-4555-8555-000000000501',
    '22222222-2222-4222-8222-000000000201',
    'QA Analyst accessibilite web',
    'Executer des campagnes de recette fonctionnelle et accessibilite, remonter les anomalies et contribuer aux criteres d acceptation.',
    'Tunis - Hybride',
    'cdd',
    '1900',
    '2700',
    'Tests manuels, WCAG, Playwright, Jira, redaction anomalies',
    '1 a 3 ans en QA',
    'Bac+3',
    'inactive',
    '2026-09-05',
    TRUE,
    'Teletravail partiel, environnement calme, supports ecrits et outils compatibles lecteur ecran.',
    NOW() - INTERVAL '2 days',
    NOW()
  ),
  (
    '55555555-5555-4555-8555-000000000502',
    '22222222-2222-4222-8222-000000000202',
    'Assistant chef de projet e-sante',
    'Suivre les plannings de deploiement, coordonner les retours clients et preparer les comptes rendus d avancement.',
    'Sousse - Hybride',
    'stage',
    '900',
    '1200',
    'Gestion projet, Excel, communication, documentation, sante numerique',
    'Stage de fin d etudes ou premiere experience',
    'Licence ou master en gestion/projet',
    'inactive',
    '2026-08-25',
    TRUE,
    'Horaires adaptes, mentor dedie, reunions avec ordre du jour ecrit.',
    NOW() - INTERVAL '1 day',
    NOW()
  ),
  (
    '55555555-5555-4555-8555-000000000503',
    '22222222-2222-4222-8222-000000000203',
    'Coordinateur operations e-commerce',
    'Piloter le suivi commandes, analyser les incidents logistiques et ameliorer les procedures back-office.',
    'Sfax - Hybride',
    'cdi',
    '2100',
    '3000',
    'Operations, Excel avance, CRM, reporting, amelioration continue',
    '2 ans en operations ou support e-commerce',
    'Bac+3',
    'inactive',
    '2026-09-15',
    TRUE,
    'Back-office accessible, horaires flexibles, outils avec zoom et contraste eleve.',
    NOW() - INTERVAL '3 days',
    NOW()
  )
ON CONFLICT (id) DO UPDATE SET
  titre = EXCLUDED.titre,
  description = EXCLUDED.description,
  localisation = EXCLUDED.localisation,
  type_poste = EXCLUDED.type_poste,
  salaire_min = EXCLUDED.salaire_min,
  salaire_max = EXCLUDED.salaire_max,
  competences_requises = EXCLUDED.competences_requises,
  experience_requise = EXCLUDED.experience_requise,
  niveau_etude = EXCLUDED.niveau_etude,
  statut = EXCLUDED.statut,
  date_limite = EXCLUDED.date_limite,
  accessibilite_handicap = EXCLUDED.accessibilite_handicap,
  amenagements_possibles = EXCLUDED.amenagements_possibles,
  updated_at = NOW();

INSERT INTO offre_publication_review (id, id_offre, status, rejection_reason, reviewed_by, reviewed_at, created_at, updated_at)
VALUES
  ('55555555-5555-4555-8555-100000000501', '55555555-5555-4555-8555-000000000501', 'pending', NULL, NULL, NULL, NOW() - INTERVAL '2 days', NOW()),
  ('55555555-5555-4555-8555-100000000502', '55555555-5555-4555-8555-000000000502', 'pending', NULL, NULL, NULL, NOW() - INTERVAL '1 day', NOW()),
  ('55555555-5555-4555-8555-100000000503', '55555555-5555-4555-8555-000000000503', 'pending', NULL, NULL, NULL, NOW() - INTERVAL '3 days', NOW())
ON CONFLICT (id_offre) DO UPDATE SET
  status = 'pending',
  rejection_reason = NULL,
  reviewed_by = NULL,
  reviewed_at = NULL,
  updated_at = NOW();

INSERT INTO offre_statistiques (id, id_offre, vues_count, candidatures_count)
VALUES
  ('44444444-4444-4444-8444-100000000401', '44444444-4444-4444-8444-000000000401', 148, 2),
  ('44444444-4444-4444-8444-100000000402', '44444444-4444-4444-8444-000000000402', 97, 2),
  ('44444444-4444-4444-8444-100000000403', '44444444-4444-4444-8444-000000000403', 76, 1),
  ('55555555-5555-4555-8555-100000000601', '55555555-5555-4555-8555-000000000501', 21, 0),
  ('55555555-5555-4555-8555-100000000602', '55555555-5555-4555-8555-000000000502', 14, 0),
  ('55555555-5555-4555-8555-100000000603', '55555555-5555-4555-8555-000000000503', 18, 0)
ON CONFLICT (id_offre) DO UPDATE SET
  vues_count = EXCLUDED.vues_count,
  candidatures_count = EXCLUDED.candidatures_count;

INSERT INTO candidature (
  id, id_candidat, id_offre, date_postulation, statut, score_test,
  lettre_motivation, cv_url, notes_entreprise, created_at, updated_at
)
VALUES
  (
    '66666666-6666-4666-8666-000000000601',
    '33333333-3333-4333-8333-000000000301',
    '44444444-4444-4444-8444-000000000401',
    NOW() - INTERVAL '8 days',
    'interview_scheduled',
    88,
    'Je souhaite contribuer a des interfaces utiles et accessibles. Mes experiences React et WCAG correspondent au poste.',
    '/uploads/cv-amira-demo.pdf',
    'Profil tres coherent avec le besoin frontend accessible.',
    NOW() - INTERVAL '8 days',
    NOW()
  ),
  (
    '66666666-6666-4666-8666-000000000602',
    '33333333-3333-4333-8333-000000000302',
    '44444444-4444-4444-8444-000000000402',
    NOW() - INTERVAL '7 days',
    'interview_scheduled',
    80,
    'Mon experience BI et SQL me permettrait de contribuer rapidement aux dashboards cliniques.',
    '/uploads/cv-karim-demo.pdf',
    'Bon niveau SQL/Power BI; entretien technique a confirmer.',
    NOW() - INTERVAL '7 days',
    NOW()
  ),
  (
    '66666666-6666-4666-8666-000000000603',
    '33333333-3333-4333-8333-000000000303',
    '44444444-4444-4444-8444-000000000403',
    NOW() - INTERVAL '6 days',
    'shortlisted',
    72,
    'Je peux apporter une bonne rigueur de suivi client et de documentation QA.',
    '/uploads/cv-yasmine-demo.pdf',
    'Shortlist RH, entretien a planifier apres validation manager.',
    NOW() - INTERVAL '6 days',
    NOW()
  ),
  (
    '66666666-6666-4666-8666-000000000604',
    '33333333-3333-4333-8333-000000000301',
    '44444444-4444-4444-8444-000000000402',
    NOW() - INTERVAL '5 days',
    'pending',
    76,
    'Interessee par la sante numerique et les interfaces accessibles cote donnees.',
    '/uploads/cv-amira-demo.pdf',
    'A evaluer pour un role transverse UI/data.',
    NOW() - INTERVAL '5 days',
    NOW()
  )
ON CONFLICT (id) DO UPDATE SET
  statut = EXCLUDED.statut,
  score_test = EXCLUDED.score_test,
  lettre_motivation = EXCLUDED.lettre_motivation,
  cv_url = EXCLUDED.cv_url,
  notes_entreprise = EXCLUDED.notes_entreprise,
  updated_at = NOW();

INSERT INTO entretien (
  id, id_candidature, date_heure, type, lieu_visio, lieu, statut,
  notes, duree_prevue, contact_entreprise, created_at, updated_at
)
VALUES
  (
    '77777777-7777-4777-8777-000000000701',
    '66666666-6666-4666-8666-000000000601',
    '2026-06-11 10:30:00',
    'visio',
    'https://meet.example.tn/techaccess-amira-react',
    NULL,
    'confirme',
    'Entretien RH + technique React. Prevoir questions sur accessibilite clavier et composants Next.js.',
    '60 minutes',
    'Nadia Gharbi - nadia.gharbi@techaccess.example.tn',
    NOW() - INTERVAL '4 days',
    NOW()
  ),
  (
    '77777777-7777-4777-8777-000000000702',
    '66666666-6666-4666-8666-000000000602',
    '2026-06-13 14:00:00',
    'visio',
    'https://meet.example.tn/medsoft-karim-bi',
    NULL,
    'planifie',
    'Entretien data case study: indicateurs adoption patient et qualite donnees.',
    '75 minutes',
    'Sami Kallel - sami.kallel@medsoft.example.tn',
    NOW() - INTERVAL '3 days',
    NOW()
  )
ON CONFLICT (id) DO UPDATE SET
  date_heure = EXCLUDED.date_heure,
  type = EXCLUDED.type,
  lieu_visio = EXCLUDED.lieu_visio,
  lieu = EXCLUDED.lieu,
  statut = EXCLUDED.statut,
  notes = EXCLUDED.notes,
  duree_prevue = EXCLUDED.duree_prevue,
  contact_entreprise = EXCLUDED.contact_entreprise,
  updated_at = NOW();

INSERT INTO session_bien_etre_entretien (
  id, id_entretien, id_utilisateur, notification_envoyee_le, points_forts_json,
  source_points_forts, created_at, updated_at
)
VALUES
  (
    '77777777-7777-4777-8777-100000000701',
    '77777777-7777-4777-8777-000000000701',
    '33333333-3333-4333-8333-333333333301',
    NOW() - INTERVAL '1 day',
    '{"points": ["Communication claire", "Experience React concrete", "Sensibilite accessibilite"]}'::text,
    'seed',
    NOW() - INTERVAL '1 day',
    NOW()
  ),
  (
    '77777777-7777-4777-8777-100000000702',
    '77777777-7777-4777-8777-000000000702',
    '33333333-3333-4333-8333-333333333302',
    NOW() - INTERVAL '1 day',
    '{"points": ["SQL solide", "Reporting operationnel", "Preference supports ecrits claire"]}'::text,
    'seed',
    NOW() - INTERVAL '1 day',
    NOW()
  )
ON CONFLICT (id_entretien, id_utilisateur) DO UPDATE SET
  notification_envoyee_le = EXCLUDED.notification_envoyee_le,
  points_forts_json = EXCLUDED.points_forts_json,
  source_points_forts = EXCLUDED.source_points_forts,
  updated_at = NOW();

INSERT INTO test_entretien (id, id_offre, titre)
VALUES
  ('77000000-0000-4000-8000-000000000801', '44444444-4444-4444-8444-000000000401', 'Mini test React et accessibilite'),
  ('77000000-0000-4000-8000-000000000802', '44444444-4444-4444-8444-000000000402', 'Cas pratique BI sante')
ON CONFLICT (id) DO UPDATE SET
  titre = EXCLUDED.titre;

INSERT INTO test_entretien_question (id, id_test, texte, type, options, ordre)
VALUES
  ('77000000-0000-4000-8000-000000000811', '77000000-0000-4000-8000-000000000801', 'Expliquez comment rendre un bouton React accessible au clavier et au lecteur ecran.', 'texte', NULL, '1'),
  ('77000000-0000-4000-8000-000000000812', '77000000-0000-4000-8000-000000000801', 'Quel attribut utilisez-vous pour relier un label a un champ ?', 'qcm', '["aria-hidden", "htmlFor/id", "role=button", "tabindex=-1"]'::json, '2'),
  ('77000000-0000-4000-8000-000000000821', '77000000-0000-4000-8000-000000000802', 'Proposez trois indicateurs pour suivre l adoption d une application patient.', 'texte', NULL, '1'),
  ('77000000-0000-4000-8000-000000000822', '77000000-0000-4000-8000-000000000802', 'Quel outil est le plus adapte pour visualiser un tableau de bord interactif ?', 'qcm', '["Power BI", "Bloc-notes", "Paint", "WinRAR"]'::json, '2')
ON CONFLICT (id) DO UPDATE SET
  texte = EXCLUDED.texte,
  type = EXCLUDED.type,
  options = EXCLUDED.options,
  ordre = EXCLUDED.ordre;

INSERT INTO interview_questions_dossier (
  id, id_candidature, id_candidat, id_offre, questions_json, handicap_block_json,
  gaps_analysis_json, source, cache_key, generation_status, created_at, updated_at
)
VALUES
  (
    '76000000-0000-4000-8000-000000000601',
    '66666666-6666-4666-8666-000000000601',
    '33333333-3333-4333-8333-000000000301',
    '44444444-4444-4444-8444-000000000401',
    '{"questions": ["Decrivez un composant accessible que vous avez construit.", "Comment testez-vous la navigation clavier ?", "Comment gerez-vous un feedback UX contradictoire ?"]}'::text,
    '{"amenagements": ["Verifier lien visio accessible", "Autoriser pauses courtes", "Partager questions principales a l ecrit"]}'::text,
    '{"gaps": ["Experience Playwright a approfondir", "Exemples WCAG a preparer"]}'::text,
    'seed',
    'seed-amira-react',
    'ready',
    NOW() - INTERVAL '2 days',
    NOW()
  ),
  (
    '76000000-0000-4000-8000-000000000602',
    '66666666-6666-4666-8666-000000000602',
    '33333333-3333-4333-8333-000000000302',
    '44444444-4444-4444-8444-000000000402',
    '{"questions": ["Expliquez une mesure de qualite de donnees.", "Comment priorisez-vous les demandes metier ?", "Comment presentez-vous un dashboard a un public non technique ?"]}'::text,
    '{"amenagements": ["Supports ecrits", "Sous-titrage automatique", "Compte rendu apres entretien"]}'::text,
    '{"gaps": ["Contexte sante a illustrer", "ETL a detailler"]}'::text,
    'seed',
    'seed-karim-bi',
    'ready',
    NOW() - INTERVAL '2 days',
    NOW()
  )
ON CONFLICT (id_candidature) DO UPDATE SET
  questions_json = EXCLUDED.questions_json,
  handicap_block_json = EXCLUDED.handicap_block_json,
  gaps_analysis_json = EXCLUDED.gaps_analysis_json,
  source = EXCLUDED.source,
  cache_key = EXCLUDED.cache_key,
  generation_status = EXCLUDED.generation_status,
  updated_at = NOW();

INSERT INTO notification (id, id_utilisateur, type, titre, message, lu, data, created_at)
VALUES
  ('99000000-0000-4000-8000-000000000701', '33333333-3333-4333-8333-333333333301', 'interview_scheduled', 'Entretien confirme', 'Votre entretien avec TechAccess Tunisie est confirme pour le 11 juin 2026 a 10:30.', FALSE, '{"href":"/candidat/entretiens"}', NOW() - INTERVAL '1 day'),
  ('99000000-0000-4000-8000-000000000702', '33333333-3333-4333-8333-333333333302', 'interview_scheduled', 'Entretien planifie', 'Votre entretien avec MedSoft Solutions est planifie pour le 13 juin 2026 a 14:00.', FALSE, '{"href":"/candidat/entretiens"}', NOW() - INTERVAL '1 day'),
  ('99000000-0000-4000-8000-000000000703', '22222222-2222-4222-8222-222222222201', 'system', 'Offre en attente de validation', 'Votre offre QA Analyst accessibilite web est en cours de validation admin.', FALSE, '{"href":"/entreprise/offres"}', NOW() - INTERVAL '2 days')
ON CONFLICT (id) DO UPDATE SET
  titre = EXCLUDED.titre,
  message = EXCLUDED.message,
  lu = EXCLUDED.lu,
  data = EXCLUDED.data,
  created_at = EXCLUDED.created_at;

COMMIT;
