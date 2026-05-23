// @ts-nocheck
import { Router } from "express";
import { Request, Response } from "express";

const router = Router();

// Simple middleware to check for Bearer token
const checkAuth = (req: Request, res: Response, next: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: "Token d'authentification manquant" });
  }
  next();
};

router.use(checkAuth);

// GET /api/entreprise/offres - List company's job offers
router.get("/", async (req: Request, res: Response) => {
  try {
    const offres = [
      {
        id_offre: 1,
        titre: "Développeur Full Stack",
        description: "Nous recherchons un développeur passionné pour rejoindre notre équipe dynamique.",
        localisation: "Paris",
        type_poste: "CDI",
        salaire_min: 45000,
        salaire_max: 55000,
        date_limite: "2024-04-15",
        competences_requises: "JavaScript, React, Node.js",
        experience_requise: "2-3 ans",
        niveau_etude: "Bac+3",
        statut: "active",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        candidatures_count: 12,
        vues_count: 156
      }
    ];

    res.status(200).json({
      message: "Offres récupérées avec succès",
      donnees: { offres }
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Erreur lors de la récupération des offres" });
  }
});

// POST /api/entreprise/offres - Create new job offer
router.post("/", async (req: Request, res: Response) => {
  try {
    const { titre, description, localisation, type_poste } = req.body;

    // Basic validation
    if (!titre || titre.length < 3) {
      return res.status(400).json({ message: "Le titre doit contenir au moins 3 caractères" });
    }
    if (!description || description.length < 50) {
      return res.status(400).json({ message: "La description doit contenir au moins 50 caractères" });
    }

    const nouvelleOffre = {
      id_offre: Date.now(),
      titre,
      description,
      localisation: localisation || "Paris",
      type_poste: type_poste || "CDI",
      statut: "active",
      created_at: new Date().toISOString(),
      candidatures_count: 0,
      vues_count: 0
    };

    res.status(201).json({
      message: "Offre créée avec succès",
      donnees: nouvelleOffre
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Erreur lors de la création de l'offre" });
  }
});

// PUT /api/entreprise/offres/:id - Update job offer
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const idOffre = req.params.id;
    const { titre, description, localisation, type_poste } = req.body;

    const offreModifiee = {
      id_offre: parseInt(idOffre),
      titre: titre || "Titre modifié",
      description: description || "Description modifiée",
      localisation: localisation || "Paris",
      type_poste: type_poste || "CDI",
      statut: "active",
      updated_at: new Date().toISOString()
    };

    res.status(200).json({
      message: "Offre modifiée avec succès",
      donnees: offreModifiee
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Erreur lors de la modification de l'offre" });
  }
});

// DELETE /api/entreprise/offres/:id - Delete job offer
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const idOffre = req.params.id;

    res.status(200).json({
      message: "Offre supprimée avec succès",
      donnees: {
        id_offre: parseInt(idOffre),
        supprime_le: new Date().toISOString()
      }
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Erreur lors de la suppression de l'offre" });
  }
});

// PATCH /api/entreprise/offres/:id/statut - Change job offer status
router.patch("/:id/statut", async (req: Request, res: Response) => {
  try {
    const idOffre = req.params.id;
    const { statut } = req.body;

    if (!statut || !["active", "inactive", "pourvue", "expiree"].includes(statut)) {
      return res.status(400).json({ message: "Statut invalide" });
    }

    res.status(200).json({
      message: "Statut modifié avec succès",
      donnees: {
        id_offre: parseInt(idOffre),
        nouveau_statut: statut,
        modifie_le: new Date().toISOString()
      }
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Erreur lors du changement de statut" });
  }
});

export default router;
