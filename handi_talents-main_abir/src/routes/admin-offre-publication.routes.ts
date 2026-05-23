import { Router } from "express";
import { AdminOffrePublicationController } from "../controllers/admin-offre-publication.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { roleMiddleware } from "../middleware/role.middleware";
import { RoleUtilisateur } from "../types/enums";

const routeur = Router();
const controleur = new AdminOffrePublicationController();

routeur.use(authMiddleware);
routeur.use(roleMiddleware([RoleUtilisateur.ADMIN]));

routeur.get("/offres/publication/en-attente", controleur.listerEnAttente);
routeur.post("/offres/publication/:id/approuver", controleur.approuver);
routeur.post("/offres/publication/:id/refuser", controleur.refuser);

export default routeur;

