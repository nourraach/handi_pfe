import { Router } from "express";
import { AccountMemberController } from "../controllers/account-member.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { roleMiddleware } from "../middleware/role.middleware";
import { RoleUtilisateur } from "../types/enums";

const routeur = Router();
const controleur = new AccountMemberController();

routeur.use(authMiddleware, roleMiddleware([RoleUtilisateur.ENTREPRISE]));

routeur.get("/", controleur.lister);
routeur.post("/", controleur.creer);
routeur.put("/:id", controleur.mettreAJour);
routeur.delete("/:id", controleur.supprimer);

export const accountMemberRoutes = routeur;
