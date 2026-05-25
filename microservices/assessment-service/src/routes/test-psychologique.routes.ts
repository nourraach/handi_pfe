import { Router } from "express";
import { TestPsychologiqueController } from "../controllers/test-psychologique.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { roleMiddleware } from "../middleware/role.middleware";
import { RoleUtilisateur } from "../types/enums";

const routeur = Router();
const controleur = new TestPsychologiqueController();

// Routes ADMIN - Gestion des tests
const adminRoutes = Router();
adminRoutes.use(authMiddleware);
adminRoutes.use(roleMiddleware([RoleUtilisateur.ADMIN]));

// CRUD des tests
adminRoutes.post("/tests", controleur.creerTest);
adminRoutes.get("/tests", controleur.listerTests);
adminRoutes.get("/tests/:id_test", controleur.obtenirTest);
adminRoutes.put("/tests/:id_test", controleur.modifierTest);
adminRoutes.delete("/tests/:id_test", controleur.supprimerTest);

// Statistiques et résultats
adminRoutes.get("/tests/:id_test/statistiques", controleur.obtenirStatistiquesTest);
adminRoutes.get("/tests/:id_test/resultats", controleur.obtenirResultatsTest);

// Routes CANDIDAT - Passage des tests
const candidatRoutes = Router();
candidatRoutes.use(authMiddleware);
candidatRoutes.use(roleMiddleware([RoleUtilisateur.CANDIDAT]));

// Tests disponibles et passage
candidatRoutes.get("/tests-disponibles", controleur.obtenirTestsDisponibles);
candidatRoutes.get("/tests/:id_test/commencer", controleur.commencerTest);
candidatRoutes.post("/tests/:id_test/soumettre", controleur.soumettreTest);

// Résultats du candidat
candidatRoutes.get("/mes-resultats", controleur.obtenirMesResultats);
candidatRoutes.patch("/resultats/:id_resultat/visibilite", controleur.modifierVisibiliteResultat);
candidatRoutes.put("/resultats/:id_resultat/visibilite", controleur.modifierVisibiliteResultat);

// Monter les routes
routeur.use("/admin", adminRoutes);
routeur.use("/candidat", candidatRoutes);

export const testPsychologiqueRoutes = routeur;
