import { Request, Response } from "express";
import { reponseSucces, reponseErreur } from "../utils/reponse";

export class OffreEmploiSimpleController {
  // POST /api/offres-emploi
  creerOffre = async (req: Request, res: Response) => {
    try {
      // Vérification simple de l'authentification
      if (!req.utilisateur) {
        return reponseErreur(res, 401, "Authentification requise");
      }

      if (req.utilisateur.role !== "entreprise") {
        return reponseErreur(res, 403, "Accès réservé aux entreprises");
      }

      // Pour l'instant, on retourne juste un succès
      // TODO: Implémenter la logique de création d'offre
      const offreTest = {
        id: "test-" + Date.now(),
        titre: req.body.titre || "Offre test",
        description: req.body.description || "Description test",
        entreprise: req.utilisateur.email, // Utiliser l'email à la place du nom
        created_at: new Date().toISOString()
      };

      return reponseSucces(res, 201, "Offre d'emploi créée avec succès", offreTest);
    } catch (error: any) {
      return reponseErreur(res, 500, error.message || "Erreur lors de la création de l'offre");
    }
  };

  // GET /api/offres-emploi
  obtenirOffres = async (req: Request, res: Response) => {
    try {
      // Retourner une liste d'offres test
      const offresTest = [
        {
          id: "1",
          titre: "Développeur Full Stack",
          description: "Poste de développeur dans une startup innovante",
          localisation: "Paris",
          type_poste: "cdi",
          entreprise: { nom: "TechCorp" },
          created_at: new Date().toISOString()
        },
        {
          id: "2", 
          titre: "Designer UX/UI",
          description: "Créer des expériences utilisateur exceptionnelles",
          localisation: "Lyon",
          type_poste: "cdd",
          entreprise: { nom: "DesignStudio" },
          created_at: new Date().toISOString()
        }
      ];

      return reponseSucces(res, 200, "Offres récupérées avec succès", offresTest);
    } catch (error: any) {
      return reponseErreur(res, 500, error.message || "Erreur lors de la récupération des offres");
    }
  };

  // GET /api/offres-emploi/:id
  obtenirOffreParId = async (req: Request, res: Response) => {
    try {
      const offreTest = {
        id: req.params.id,
        titre: "Développeur Full Stack",
        description: "Poste de développeur dans une startup innovante. Nous recherchons un profil passionné...",
        localisation: "Paris",
        type_poste: "cdi",
        salaire_min: "35000",
        salaire_max: "45000",
        competences_requises: "JavaScript, React, Node.js",
        accessibilite_handicap: true,
        entreprise: { 
          nom: "TechCorp",
          secteur_activite: "Informatique"
        },
        created_at: new Date().toISOString()
      };

      return reponseSucces(res, 200, "Offre récupérée avec succès", offreTest);
    } catch (error: any) {
      return reponseErreur(res, 500, error.message || "Erreur lors de la récupération de l'offre");
    }
  };
}