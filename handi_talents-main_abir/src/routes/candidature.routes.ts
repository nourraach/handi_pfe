import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { CandidatureController } from "../controllers/candidature.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { roleMiddleware } from "../middleware/role.middleware";
import { RoleUtilisateur } from "../types/enums";

const router = Router();
const candidatureController = new CandidatureController();

const uploadDirCandidatures = path.join(__dirname, "..", "..", "public", "uploads", "candidatures");
if (!fs.existsSync(uploadDirCandidatures)) {
  fs.mkdirSync(uploadDirCandidatures, { recursive: true });
}

const stockageCandidature = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDirCandidatures),
  filename: (_req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `cv-${unique}${ext}`);
  },
});

const uploadCandidature = multer({ storage: stockageCandidature });

router.use(authMiddleware);

// Routes pour les candidats
router.post("/", roleMiddleware([RoleUtilisateur.CANDIDAT]), uploadCandidature.single("cv"), candidatureController.postuler); // alias
router.post("/postuler", roleMiddleware([RoleUtilisateur.CANDIDAT]), uploadCandidature.single("cv"), candidatureController.postuler);
router.get("/mes-candidatures", roleMiddleware([RoleUtilisateur.CANDIDAT]), candidatureController.obtenirMesCandidatures);

// Routes pour les entreprises
router.get("/", roleMiddleware([RoleUtilisateur.ENTREPRISE]), candidatureController.obtenirCandidaturesEntreprise); // alias entreprise
router.get("/entreprise", roleMiddleware([RoleUtilisateur.ENTREPRISE]), candidatureController.obtenirCandidaturesEntreprise);
router.get("/offre/:idOffre", roleMiddleware([RoleUtilisateur.ENTREPRISE]), candidatureController.obtenirCandidaturesParOffre);
router.get("/:id/details", roleMiddleware([RoleUtilisateur.ENTREPRISE]), candidatureController.obtenirDetailsCandidature);
router.put("/:id/statut", roleMiddleware([RoleUtilisateur.ENTREPRISE]), candidatureController.modifierStatut);
router.post("/:id/shortlist", roleMiddleware([RoleUtilisateur.ENTREPRISE]), candidatureController.shortlister);
router.post("/:id/refuser", roleMiddleware([RoleUtilisateur.ENTREPRISE]), candidatureController.refuser);
router.post("/:id/accepter", roleMiddleware([RoleUtilisateur.ENTREPRISE]), candidatureController.accepter);
router.get("/statistiques", roleMiddleware([RoleUtilisateur.ENTREPRISE]), candidatureController.obtenirStatistiques);
router.get("/mes-statistiques", roleMiddleware([RoleUtilisateur.CANDIDAT]), candidatureController.obtenirStatistiquesCandidat);

export default router;
