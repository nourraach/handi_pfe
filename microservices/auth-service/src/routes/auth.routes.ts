import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { AuthController } from "../controllers/auth.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const routeur = Router();
const controleur = new AuthController();

const uploadDirCandidat = path.join(__dirname, "..", "..", "public", "uploads", "candidats");
const uploadDirEntreprise = path.join(__dirname, "..", "..", "public", "uploads", "entreprises");
for (const dir of [uploadDirCandidat, uploadDirEntreprise]) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

const stockageCandidat = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDirCandidat),
  filename: (_req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${unique}${ext}`);
  },
});

const stockageEntreprise = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDirEntreprise),
  filename: (_req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${unique}${ext}`);
  },
});

const uploadCandidat = multer({ storage: stockageCandidat });
const uploadEntreprise = multer({
  storage: stockageEntreprise,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const mimeAutorises = new Set(["image/png", "image/jpeg", "image/jpg", "image/webp"]);
    if (!mimeAutorises.has(file.mimetype)) {
      return cb(new Error("La patente doit etre une image (PNG, JPG ou WEBP)."));
    }
    cb(null, true);
  },
});

routeur.post("/inscription/candidat", uploadCandidat.single("carte_handicap"), controleur.inscriptionCandidat);
routeur.post("/inscription/entreprise", uploadEntreprise.single("patente"), controleur.inscriptionEntreprise);
routeur.post("/connexion", controleur.connexion);
routeur.post("/login", controleur.connexion);
routeur.post("/demander-reset", controleur.demanderReset);
routeur.post("/reset", controleur.resetMotDePasse);
routeur.post("/changer-mdp", authMiddleware, controleur.changerMotDePasse);
routeur.post("/logout", authMiddleware, controleur.logout);
routeur.delete("/supprimer", authMiddleware, controleur.supprimerCompte);

export const authRoutes = routeur;
