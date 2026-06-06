# Requirements Document

## Introduction

Ce document définit les règles de validation du contrôle d'accès et de la confidentialité pour la plateforme HandiTalents. L'objectif est de garantir que les interactions entre les différents acteurs (entreprises, candidats, inspecteurs, administrateurs) respectent des règles strictes de confidentialité et d'accès aux données. Ces règles visent à protéger la vie privée des candidats tout en permettant aux entreprises d'accéder aux informations nécessaires dans le cadre du processus de recrutement, et aux inspecteurs d'exercer leur mission de supervision.

## Glossary

- **Enterprise**: Une organisation inscrite sur la plateforme HandiTalents qui publie des offres d'emploi et recherche des candidats
- **Candidate**: Un utilisateur handicapé inscrit sur la plateforme qui recherche des opportunités d'emploi et peut postuler aux offres
- **Inspector**: Un utilisateur ayant un rôle de supervision qui peut consulter les statistiques et activités des entreprises sans accéder aux données personnelles des candidats
- **Admin**: Un administrateur de la plateforme ayant tous les droits d'accès et de gestion
- **CV**: Le curriculum vitae d'un candidat contenant ses informations personnelles, expériences professionnelles et compétences
- **Application**: Une candidature soumise par un candidat à une offre d'emploi publiée par une entreprise
- **Communication_Service**: Le microservice gérant les échanges de messages entre utilisateurs
- **User_Service**: Le microservice gérant les profils et données des utilisateurs
- **Application_Service**: Le microservice gérant les candidatures et le processus de recrutement
- **Reporting_Service**: Le microservice gérant les statistiques et rapports de supervision
- **API_Gateway**: Le point d'entrée unique qui route les requêtes vers les microservices appropriés
- **Recruited_Candidate**: Un candidat qui a été embauché par une entreprise suite à une candidature
- **View_Count**: Le nombre de fois qu'une offre d'emploi a été consultée par des candidats
- **Contact_Request**: Une demande d'initiation de conversation entre deux utilisateurs

## Requirements

### Requirement 1: Restriction de Contact Entre Entreprises

**User Story:** En tant qu'administrateur de la plateforme, je veux empêcher les entreprises de se contacter entre elles, afin de maintenir un environnement professionnel orienté recrutement et éviter les sollicitations commerciales non souhaitées.

#### Acceptance Criteria

1. WHEN une entreprise tente d'initier un contact avec une autre entreprise, THE Communication_Service SHALL rejeter la requête avec un code d'erreur 403
2. WHEN une entreprise tente d'envoyer un message à une autre entreprise, THE Communication_Service SHALL rejeter la requête avec un code d'erreur 403
3. THE API_Gateway SHALL valider le rôle des participants avant de router une requête de contact vers THE Communication_Service
4. WHEN une entreprise recherche des destinataires pour un nouveau message, THE Communication_Service SHALL exclure toutes les entreprises de la liste des résultats
5. WHEN une entreprise initie un contact avec un candidat, THE Communication_Service SHALL autoriser la requête
6. WHEN une entreprise initie un contact avec un admin, THE Communication_Service SHALL autoriser la requête

### Requirement 2: Confidentialité des CV des Candidats

**User Story:** En tant que candidat, je veux que mon CV reste confidentiel et ne soit accessible aux entreprises que si j'ai postulé à leurs offres, afin de protéger mes données personnelles et contrôler qui peut voir mes informations.

#### Acceptance Criteria

1. WHEN une entreprise tente d'accéder au CV d'un candidat qui n'a pas postulé à ses offres, THE User_Service SHALL rejeter la requête avec un code d'erreur 403
2. WHEN une entreprise tente d'accéder au CV d'un candidat qui a postulé à au moins une de ses offres, THE User_Service SHALL autoriser l'accès et retourner le CV
3. THE User_Service SHALL vérifier l'existence d'une candidature active ou passée entre le candidat et l'entreprise avant d'autoriser l'accès au CV
4. WHEN un admin tente d'accéder au CV d'un candidat, THE User_Service SHALL autoriser l'accès sans vérification de candidature
5. WHEN un candidat tente d'accéder à son propre CV, THE User_Service SHALL autoriser l'accès sans vérification supplémentaire
6. THE API_Gateway SHALL transmettre l'identifiant de l'utilisateur demandeur et son rôle dans chaque requête vers THE User_Service

### Requirement 3: Droits d'Accès de l'Inspecteur

**User Story:** En tant qu'inspecteur, je veux pouvoir consulter les informations agrégées sur les entreprises, leurs offres et leurs activités de recrutement, afin d'exercer ma mission de supervision sans accéder aux données personnelles des candidats.

#### Acceptance Criteria

1. WHEN un inspecteur tente d'accéder à la liste des entreprises, THE User_Service SHALL autoriser l'accès et retourner les profils des entreprises
2. WHEN un inspecteur tente d'accéder aux offres d'une entreprise, THE Reporting_Service SHALL autoriser l'accès et retourner la liste des offres avec leurs statistiques
3. WHEN un inspecteur tente d'accéder au nombre de vues d'une offre, THE Reporting_Service SHALL autoriser l'accès et retourner le View_Count
4. WHEN un inspecteur tente d'accéder à la liste des candidats recrutés par une entreprise, THE Reporting_Service SHALL autoriser l'accès et retourner les informations des Recruited_Candidate sans inclure les CV
5. WHEN un inspecteur tente d'accéder au CV d'un candidat, THE User_Service SHALL rejeter la requête avec un code d'erreur 403
6. WHEN un inspecteur tente d'accéder aux candidatures d'une offre, THE Reporting_Service SHALL autoriser l'accès aux statistiques agrégées uniquement, sans détails personnels des candidats
7. THE API_Gateway SHALL vérifier que l'utilisateur a le rôle inspecteur avant de router les requêtes vers THE Reporting_Service

### Requirement 4: Validation des Rôles au Niveau de l'API Gateway

**User Story:** En tant qu'architecte système, je veux que l'API Gateway effectue une validation préliminaire des rôles et permissions, afin de réduire la charge sur les microservices et bloquer les requêtes non autorisées le plus tôt possible.

#### Acceptance Criteria

1. WHEN une requête arrive à l'API Gateway, THE API_Gateway SHALL extraire et valider le token JWT contenant le rôle de l'utilisateur
2. IF le token JWT est invalide ou expiré, THEN THE API_Gateway SHALL rejeter la requête avec un code d'erreur 401 avant de router vers un microservice
3. THE API_Gateway SHALL transmettre le rôle utilisateur et l'identifiant utilisateur en tant que headers à tous les microservices en aval
4. WHEN une requête nécessite une validation de rôle spécifique documentée dans la configuration de routing, THE API_Gateway SHALL vérifier le rôle avant de router
5. THE API_Gateway SHALL journaliser toutes les tentatives d'accès refusées avec l'identifiant utilisateur, le rôle, la route demandée et l'horodatage

### Requirement 5: Autorisation d'Accès aux Applications

**User Story:** En tant qu'entreprise, je veux pouvoir accéder aux détails des candidatures soumises à mes offres, afin de pouvoir évaluer les candidats et progresser dans le processus de recrutement.

#### Acceptance Criteria

1. WHEN une entreprise tente d'accéder aux applications d'une offre qu'elle a publiée, THE Application_Service SHALL autoriser l'accès et retourner la liste des applications avec les CV des candidats
2. WHEN une entreprise tente d'accéder aux applications d'une offre publiée par une autre entreprise, THE Application_Service SHALL rejeter la requête avec un code d'erreur 403
3. THE Application_Service SHALL vérifier que l'offre appartient bien à l'entreprise demandant l'accès avant de retourner les applications
4. WHEN un admin tente d'accéder aux applications d'une offre, THE Application_Service SHALL autoriser l'accès sans vérification de propriété
5. WHEN un candidat tente d'accéder à ses propres applications, THE Application_Service SHALL autoriser l'accès et retourner uniquement les applications du candidat

### Requirement 6: Journalisation des Accès pour Audit

**User Story:** En tant qu'administrateur système, je veux que tous les accès aux données sensibles soient journalisés, afin de pouvoir auditer les activités et détecter les tentatives d'accès non autorisées.

#### Acceptance Criteria

1. WHEN un utilisateur tente d'accéder à un CV, THE User_Service SHALL journaliser la tentative avec l'identifiant utilisateur, le rôle, l'identifiant du CV, le résultat de l'autorisation et l'horodatage
2. WHEN un utilisateur tente d'initier un contact, THE Communication_Service SHALL journaliser la tentative avec les identifiants de l'émetteur et du destinataire, leurs rôles, le résultat et l'horodatage
3. WHEN un utilisateur tente d'accéder aux applications d'une offre, THE Application_Service SHALL journaliser la tentative avec l'identifiant utilisateur, le rôle, l'identifiant de l'offre, le résultat et l'horodatage
4. THE Reporting_Service SHALL fournir une API permettant aux admins d'interroger les journaux d'accès avec des filtres par utilisateur, date et type d'accès
5. THE Reporting_Service SHALL conserver les journaux d'accès pendant une durée minimum de 12 mois
6. WHEN un inspecteur accède aux données d'une entreprise, THE Reporting_Service SHALL journaliser l'accès avec l'identifiant de l'inspecteur, l'entreprise consultée et l'horodatage

## Notes Techniques

- Les microservices doivent implémenter une validation locale des permissions même si l'API Gateway effectue une validation préliminaire (défense en profondeur)
- La vérification de l'existence d'une candidature pour l'accès au CV peut nécessiter une communication inter-services entre User_Service et Application_Service
- Les journaux d'accès doivent être stockés de manière sécurisée et conformément aux réglementations RGPD
- L'implémentation devra gérer les cas où un candidat supprime sa candidature après que l'entreprise ait déjà accédé au CV
