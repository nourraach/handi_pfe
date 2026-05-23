import { Router } from "express";
import { AdminController } from "../controllers/admin.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { roleMiddleware } from "../middleware/role.middleware";
import { RoleUtilisateur } from "../types/enums";

const routeur = Router();
const controleur = new AdminController();

routeur.use(authMiddleware);
routeur.use(roleMiddleware([RoleUtilisateur.ADMIN]));

routeur.get("/demandes-en-attente", controleur.listerDemandesEnAttente);
routeur.post("/approuver/:id", controleur.approuver);
routeur.post("/refuser/:id", controleur.refuser);

export const adminRoutes = routeur;
