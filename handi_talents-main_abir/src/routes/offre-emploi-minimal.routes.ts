import { Router } from "express";
import { Request, Response } from "express";
import { reponseSucces, reponseErreur } from "../utils/reponse";

const router = Router();

// Simple test route for job offers
router.get("/", async (req: Request, res: Response) => {
  try {
    const offresTest = [
      {
        id: "1",
        titre: "Développeur Full Stack",
        description: "Poste de développeur dans une startup innovante",
        localisation: "Paris",
        type_poste: "cdi",
        entreprise: { nom: "TechCorp" },
        created_at: new Date().toISOString()
      }
    ];

    return reponseSucces(res, 200, "Offres récupérées avec succès", offresTest);
  } catch (error: any) {
    return reponseErreur(res, 500, error.message || "Erreur lors de la récupération des offres");
  }
});

export default router;