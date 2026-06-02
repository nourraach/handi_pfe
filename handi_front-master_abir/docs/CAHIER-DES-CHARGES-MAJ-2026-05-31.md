# Cahier des Charges MAJ - HandiTalents

Date de MAJ: 2026-05-31  
Source: CDC initial + perimetre reel observe dans le projet (routes/pages/components).

## 1) Roles et perimetre

Roles couverts:
- Candidat
- Entreprise
- Admin
- Inspecteur / ANETI (espace supervision)

## 2) Echelle de statut

- `Implante`: visible et exploitable dans le projet (UI + flux principal).
- `Partiel`: present mais incomplet (regles metier manquantes, backend/API incomplet, ou parcours non finalise).
- `Backlog`: non trouve dans le projet actuel.

---

## UC-0 - Roles, acces, regles (RBAC)

| Acteur | User Story | Priorite | Statut |
|---|---|---|---|
| Admin | Creer/editer des roles pour controler les acces | Haute | Partiel |
| Admin | Suspendre/reactiver des comptes | Haute | Implante |
| Admin | Historique des changements (packs/comptes) | Moyenne | Partiel |

---

## UC-1 - Authentification et compte

| Acteur | User Story | Priorite | Statut |
|---|---|---|---|
| Candidat/Entreprise | Inscription email/telephone + mot de passe | Haute | Implante |
| Tous | Connexion email/telephone + mot de passe | Haute | Implante |
| Tous | Reinitialiser mot de passe | Haute | Implante |
| Tous | Deconnexion | Haute | Implante |
| Tous | Changer mot de passe depuis compte | Haute | Partiel |
| Admin/Entreprise | 2FA | Moyenne | Backlog |
| Candidat/Entreprise | Suppression de compte | Haute | Partiel |
| Admin | Suspendre/reactiver compte | Haute | Implante |

Note: le parcours d activation par lien a evolue dans le projet (certaines pages indiquent que l activation n est plus systematique selon les cas).

---

## UC-2 - Profil Candidat

| Acteur | User Story | Priorite | Statut |
|---|---|---|---|
| Candidat | Consulter profil | Haute | Implante |
| Candidat | Modifier profil | Haute | Implante |
| Candidat | Definir preferences d accessibilite | Haute | Implante |
| Candidat | Gerer visibilite infos supplementaires | Haute | Partiel |
| Candidat | Deposer carte handicap non telechargeable | Haute | Partiel |
| Candidat | Uploader video CV visible non telechargeable | Moyenne | Partiel |
| Admin | Valider une demande d inscription | Haute | Implante |
| Admin | Refuser une demande d inscription avec motif | Haute | Implante |

---

## UC-3 - Profil Entreprise

### 3.1 Gestion profil
| Acteur | User Story | Priorite | Statut |
|---|---|---|---|
| Entreprise | Faire une demande d inscription | Haute | Implante |
| Entreprise | Modifier profil entreprise | Haute | Implante |
| Entreprise | Gerer account members / team members | Moyenne | Partiel |

### 3.2 Validation
| Acteur | User Story | Priorite | Statut |
|---|---|---|---|
| Entreprise | Deposer patente et RNE | Haute | Implante |

---

## UC-4 - Packs, abonnements, transactions, quotas

| Acteur | User Story | Priorite | Statut |
|---|---|---|---|
| Entreprise | Choisir un pack | Haute | Implante |
| Entreprise | Consulter pack actif | Haute | Implante |
| Entreprise | Historique abonnements | Haute | Partiel |
| Admin | Historique abonnements par entreprise | Haute | Partiel |
| Systeme | Paiement/transaction reelle | Haute | Backlog |

---

## UC-5 - Offres d emploi

### 5.1 Publication
| Acteur | User Story | Priorite | Statut |
|---|---|---|---|
| Entreprise (Pack 2/3) | Creer une offre | Haute | Implante |
| Entreprise (Pack 2/3) | Consulter ses offres | Haute | Implante |
| Entreprise (Pack 2/3) | Modifier ses offres | Haute | Implante |
| Candidat | Consulter liste offres | Haute | Implante |

### 5.2 Eligibilite et shortlist
| Acteur | User Story | Priorite | Statut |
|---|---|---|---|
| Entreprise | Definir criteres d eligibilite | Haute | Partiel |
| Entreprise | Shortlister intelligemment | Haute | Implante |

### 5.3 Conformite
| Acteur | User Story | Priorite | Statut |
|---|---|---|---|
| Entreprise | Generer rapport de conformite | Haute | Implante |
| Inspecteur / ANETI | Consulter/valider/refuser rapports + recommandations | Haute | Implante |

---

## UC-6 - Candidatures

### 6.1 Parcours candidat
| Acteur | User Story | Priorite | Statut |
|---|---|---|---|
| Candidat | Postuler a une offre | Haute | Implante |
| Candidat | Consulter ses candidatures | Haute | Implante |
| Candidat | Sauvegarder une offre en favoris | Moyenne | Implante |
| Candidat | Consulter ses favoris | Moyenne | Implante |
| Candidat | Recevoir notif changement statut | Haute | Implante |

### 6.2 Parcours entreprise/admin
| Acteur | User Story | Priorite | Statut |
|---|---|---|---|
| Entreprise | Voir toutes candidatures avec filtres | Haute | Implante |
| Entreprise | Export candidatures | Moyenne | Partiel |
| Entreprise | Refuser candidature avec motif obligatoire | Haute | Implante |
| Admin | Consulter candidatures et statuts | Haute | Implante |

---

## UC-7 - CV Manager

| Acteur | User Story | Priorite | Statut |
|---|---|---|---|
| Candidat | Generer son CV (CV Builder) | Haute | Implante |
| Candidat | Uploader video CV | Moyenne | Implante |

---

## UC-8 - Messagerie / Chat

| Acteur | User Story | Priorite | Statut |
|---|---|---|---|
| Candidat | Envoyer messages aux entreprises | Haute | Implante |
| Entreprise | Contacter candidats | Haute | Implante |
| Admin | Echanger via chat avec candidats/entreprises | Moyenne | Implante |
| Tous | Pieces jointes, emoji, audio dans chat | Moyenne | Implante |

---

## UC-9 - Meetings / Entretiens

| Acteur | User Story | Priorite | Statut |
|---|---|---|---|
| Entreprise | Planifier entretien (visio/presentiel/telephone) | Haute | Implante |
| Entreprise | Replanifier/annuler/terminer entretien | Haute | Implante |
| Candidat | Consulter agenda d entretiens | Haute | Implante |
| Candidat | Confirmer un entretien | Haute | Implante |
| Tous | Ajout calendrier (Google Calendar) | Moyenne | Implante |
| Admin | Vue admin des entretiens | Haute | Implante |

---

## UC-10 - Tests et Soft Skills

| Acteur | User Story | Priorite | Statut |
|---|---|---|---|
| Entreprise | Creer test ecrit lie a une offre | Haute | Implante |
| Candidat | Passer test d entretien | Haute | Implante |
| Entreprise | Voir resultats test dans suivi candidat | Haute | Implante |
| Candidat | Passer test psychologique (fenetre 6 mois) | Haute | Partiel |
| Candidat | Choisir affichage score profil | Haute | Partiel |
| Admin | Gerer banque de tests psychologiques | Haute | Implante |

---

## UC-11 - Dashboards

| Acteur | User Story | Priorite | Statut |
|---|---|---|---|
| Entreprise | Stats offres et pipeline recrutement | Haute | Implante |
| Candidat | Stats candidatures | Haute | Implante |
| Inspecteur | Stats entreprises de sa delegation | Haute | Partiel |
| ANETI | Stats entreprises + shortlist/recrutes | Haute | Partiel |
| Inspecteur/ANETI | Export statistiques | Haute | Partiel |
| Admin | Dashboard global admin | Haute | Implante |

---

## UC-12 - Chatbot d assistance

| Acteur | User Story | Priorite | Statut |
|---|---|---|---|
| Candidat/Entreprise | Assistant chatbot | Haute | Partiel |

---

## UC-13 - Accessibilite avancee

| Acteur | User Story | Priorite | Statut |
|---|---|---|---|
| Candidat | Navigation clavier complete | Haute | Implante |
| Candidat | Lecture vocale des offres (TTS) | Haute | Implante |
| Candidat | Commandes vocales simples | Nice to Have | Partiel |
| Tous | Panneau accessibilite (contraste, police, curseur, animation, etc.) | Haute | Implante |

---

## 3) UC ajoutes depuis le CDC initial (nouveau perimetre)

### UC-14 - Notifications centralisees
| Acteur | User Story | Priorite | Statut |
|---|---|---|---|
| Tous | Consulter centre de notifications | Haute | Implante |
| Tous | Marquer lu / non lu | Haute | Implante |
| Tous | Acceder directement a l action liee (entretien, candidature, etc.) | Haute | Implante |

### UC-15 - Reports & Requests entreprise
| Acteur | User Story | Priorite | Statut |
|---|---|---|---|
| Entreprise | Construire rapport conformite avec assistant | Haute | Implante |
| Entreprise | Creer transfer request | Haute | Implante |
| Entreprise | Sauver brouillons / reouvrir / exporter | Haute | Implante |

### UC-16 - Supervision (Inspecteur / ANETI)
| Acteur | User Story | Priorite | Statut |
|---|---|---|---|
| Inspecteur/ANETI | Vue pipeline, offres, candidats, rapports | Haute | Implante |
| Inspecteur/ANETI | Validation/rejet avec recommandation | Haute | Implante |

### UC-17 - Parcours candidat assiste
| Acteur | User Story | Priorite | Statut |
|---|---|---|---|
| Candidat | Onboarding guide pendant inscription | Haute | Implante |
| Candidat | Preparation entretien + module bien-etre | Moyenne | Implante |

### UC-18 - Internationalisation
| Acteur | User Story | Priorite | Statut |
|---|---|---|---|
| Tous | Basculer langue (FR/EN/AR) et libelles metiers | Haute | Implante |

---

## 4) Decisions de cadrage recommandees (prochaine iteration)

1. Valider officiellement les UC `Partiel` pour decider: terminer ou deferer.
2. Geler les regles metier sensibles:
   - 2FA
   - suppression compte
   - non telechargement strict des documents sensibles
   - quotas packs et facturation reelle
3. Stabiliser une matrice de permissions role x fonctionnalite (RBAC complet).
4. Ajouter un tableau de tracabilite `UC -> pages -> API -> tests`.

---

## 5) Traces fonctionnelles observees dans le projet (exemples)

- Auth + inscription: `app/connexion`, `app/inscription`, `app/reset`
- Candidat: `app/candidat/*` (dashboard, candidatures, entretiens, tests, CV, avis)
- Entreprise: `app/entreprise/*` (offres, candidatures, shortlist, entretiens, reports-requests, profil)
- Admin: `app/admin/*` (utilisateurs, comptes, demandes, applications, entretiens, reports, stats, tests)
- Supervision: `app/supervision/*`
- Chat et notifications: `app/messages`, `app/notifications`
- Accessibilite: `components/accessibility-provider.tsx`, `components/accessibility-widget.tsx`

