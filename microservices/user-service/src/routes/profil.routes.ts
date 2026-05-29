import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { ProfilController } from "../controllers/profil.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { roleMiddleware } from "../middleware/role.middleware";
import { RoleUtilisateur } from "../types/enums";

const routeur = Router();
const controleur = new ProfilController();

const uploadDirEntreprise = path.join(__dirname, "..", "..", "public", "uploads", "entreprises");
const uploadDirCandidat = path.join(__dirname, "..", "..", "public", "uploads", "candidats");
for (const dir of [uploadDirEntreprise, uploadDirCandidat]) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

const stockageEntreprise = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDirEntreprise),
  filename: (_req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${unique}${ext}`);
  },
});
const stockageCandidat = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDirCandidat),
  filename: (_req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${unique}${ext}`);
  },
});

const uploadEntreprise = multer({ storage: stockageEntreprise });
const uploadCandidat = multer({ storage: stockageCandidat });
const uploadEntrepriseDocuments = multer({
  storage: stockageEntreprise,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.fieldname === "logo") {
      const allowed = new Set(["image/png", "image/jpeg", "image/jpg", "image/webp", "image/svg+xml"]);
      if (!allowed.has(file.mimetype)) {
        return cb(new Error("Format logo invalide. Utilisez PNG, JPG, WEBP ou SVG."));
      }
    }
    cb(null, true);
  },
});

// Routes candidat
routeur.get(
  "/candidats/profil/:id_utilisateur",
  authMiddleware,
  controleur.obtenirProfilCandidat
);

routeur.put(
  "/candidats/profil",
  authMiddleware,
  roleMiddleware([RoleUtilisateur.CANDIDAT]),
  controleur.mettreAJourProfilCandidat
);

routeur.post(
  "/candidats/profil/documents",
  authMiddleware,
  roleMiddleware([RoleUtilisateur.CANDIDAT]),
  uploadCandidat.fields([
    { name: "cv", maxCount: 1 },
    { name: "carte", maxCount: 1 },
    { name: "video", maxCount: 1 },
    { name: "photo", maxCount: 1 },
  ]),
  controleur.mettreAJourDocumentsCandidat
);

// Routes entreprise
routeur.get(
  "/entreprises/profil/:id_utilisateur",
  authMiddleware,
  controleur.obtenirProfilEntreprise
);

routeur.put(
  "/entreprises/profil",
  authMiddleware,
  roleMiddleware([RoleUtilisateur.ENTREPRISE]),
  controleur.mettreAJourProfilEntreprise
);

routeur.post(
  "/entreprises/profil/documents",
  authMiddleware,
  roleMiddleware([RoleUtilisateur.ENTREPRISE]),
  uploadEntrepriseDocuments.fields([
    { name: "patente", maxCount: 1 },
    { name: "rne", maxCount: 1 },
    { name: "logo", maxCount: 1 },
  ]),
  controleur.mettreAJourDocumentsEntreprise
);

routeur.post(
  "/entreprises/profil/subscription",
  authMiddleware,
  roleMiddleware([RoleUtilisateur.ENTREPRISE]),
  controleur.choisirPackEntreprise
);

// Routes admin
routeur.get(
  "/admin/profil/:id_utilisateur",
  authMiddleware,
  roleMiddleware([RoleUtilisateur.ADMIN, RoleUtilisateur.INSPECTEUR, RoleUtilisateur.ANETI]),
  controleur.obtenirProfilAdmin
);

routeur.put(
  "/admin/profil",
  authMiddleware,
  roleMiddleware([RoleUtilisateur.ADMIN, RoleUtilisateur.INSPECTEUR, RoleUtilisateur.ANETI]),
  controleur.mettreAJourProfilAdmin
);

routeur.get(
  "/admin/entreprises/:id_utilisateur",
  authMiddleware,
  roleMiddleware([RoleUtilisateur.ADMIN]),
  controleur.obtenirEntrepriseAdmin
);

routeur.post(
  "/admin/entreprises",
  authMiddleware,
  roleMiddleware([RoleUtilisateur.ADMIN]),
  controleur.creerEntrepriseAdmin
);

routeur.put(
  "/admin/entreprises/:id_utilisateur",
  authMiddleware,
  roleMiddleware([RoleUtilisateur.ADMIN]),
  controleur.mettreAJourEntrepriseAdmin
);

export const profilRoutes = routeur;
