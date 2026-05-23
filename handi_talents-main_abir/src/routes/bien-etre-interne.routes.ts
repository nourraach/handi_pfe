import { Router } from "express";
import { env } from "../config/env";
import { BienEtreEntretienController } from "../controllers/bien-etre-entretien.controller";

const router = Router();
const controller = new BienEtreEntretienController();

router.use((req, res, next) => {
  const cle = req.header("x-internal-key");
  if (!cle || cle !== env.cleInterneBienEtre) {
    return res.status(401).json({
      message: "Cle interne invalide.",
      error: "Cle interne invalide.",
    });
  }
  return next();
});

router.post("/dispatch-j1", controller.dispatcherRappelJ1);

export default router;

