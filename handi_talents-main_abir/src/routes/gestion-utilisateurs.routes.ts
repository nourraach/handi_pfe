import { Router } from "express";
import { GestionUtilisateursController } from "../controllers/gestion-utilisateurs.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { roleMiddleware } from "../middleware/role.middleware";
import { RoleUtilisateur } from "../types/enums";

const routeur = Router();
const controleur = new GestionUtilisateursController();

// Toutes les routes nécessitent une authentification admin
routeur.use(authMiddleware);
routeur.use(roleMiddleware([RoleUtilisateur.ADMIN]));

// Routes spéciales en premier (pour éviter les conflits avec :id_utilisateur)
// 8. Exporter les utilisateurs (CSV)
routeur.get("/utilisateurs/export", controleur.exporterUtilisateurs);

// 9. Statistiques détaillées
routeur.get("/utilisateurs/statistiques", controleur.obtenirStatistiques);

// 10. Recherche avancée
routeur.post("/utilisateurs/recherche", controleur.rechercheAvancee);

// 1. Lister les utilisateurs (avec pagination et filtres)
routeur.get("/utilisateurs", controleur.listerUtilisateurs);

// 2. Récupérer un utilisateur spécifique
routeur.get("/utilisateurs/:id_utilisateur", controleur.obtenirUtilisateur);

// 3. Créer un nouvel utilisateur
routeur.post("/utilisateurs", controleur.creerUtilisateur);

// 4. Modifier un utilisateur
routeur.put("/utilisateurs/:id_utilisateur", controleur.modifierUtilisateur);

// 5. Supprimer un utilisateur
routeur.delete("/utilisateurs/:id_utilisateur", controleur.supprimerUtilisateur);

// 6. Changer le statut d'un utilisateur
routeur.patch("/utilisateurs/:id_utilisateur/statut", controleur.changerStatut);

// 7. Réinitialiser le mot de passe
routeur.post("/utilisateurs/:id_utilisateur/reset-password", controleur.reinitialiserMotDePasse);

// 11. Historique des actions
routeur.get("/utilisateurs/:id_utilisateur/historique", controleur.obtenirHistorique);

export const gestionUtilisateursRoutes = routeur;