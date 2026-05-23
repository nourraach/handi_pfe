import { Request, Response } from "express";
import { OffreEmploiService } from "../services/offre-emploi.service";
import { MatchingService } from "../services/matching.service";
import { reponseSucces, reponseErreur } from "../utils/reponse";
import { asString } from "../utils/request-helpers";
import { CreerOffreDto, ModifierOffreDto, ChangerStatutOffreDto } from "../dto/offre-emploi.dto";
import { RoleUtilisateur } from "../types/enums";

export class OffreEmploiController {
  constructor(private readonly offreEmploiService = new OffreEmploiService()) {}
  private readonly matchingService = new MatchingService();

  private normaliserTypePoste(typePoste: unknown): string | undefined {
    if (typeof typePoste !== "string") return undefined;
    const brut = typePoste.trim().toLowerCase();
    const mapping: Record<string, string> = {
      cdi: "cdi",
      cdd: "cdd",
      stage: "stage",
      freelance: "freelance",
      "temps partiel": "temps_partiel",
      temps_partiel: "temps_partiel",
      "temps plein": "temps_plein",
      temps_plein: "temps_plein",
      alternance: "cdd",
    };
    return mapping[brut];
  }

  // GET /api/entreprise/offres
  obtenirOffresEntreprise = async (req: Request, res: Response) => {
    try {
      if (!req.utilisateur) {
        return reponseErreur(res, 401, "Authentification requise");
      }

      if (req.utilisateur.role !== RoleUtilisateur.ENTREPRISE) {
        return reponseErreur(res, 403, "Accès réservé aux entreprises");
      }

      const offres = await this.offreEmploiService.obtenirOffresParEntreprise(req.utilisateur.id_utilisateur);

      return reponseSucces(res, 200, "Offres récupérées avec succès", { offres });
    } catch (error: any) {
      console.error("Erreur lors de la récupération des offres:", error);
      return reponseErreur(res, 500, error.message || "Erreur lors de la récupération des offres");
    }
  };

  // POST /api/entreprise/offres
  creerOffre = async (req: Request, res: Response) => {
    try {
      if (!req.utilisateur) {
        return reponseErreur(res, 401, "Authentification requise");
      }

      if (req.utilisateur.role !== RoleUtilisateur.ENTREPRISE) {
        return reponseErreur(res, 403, "Accès réservé aux entreprises");
      }

      // Validation des données
      const erreurs = this.validerDonneesOffre(req.body);
      if (erreurs.length > 0) {
        return reponseErreur(res, 400, `Données invalides: ${erreurs.join(", ")}`);
      }

      const donneesOffre: CreerOffreDto = {
        ...req.body,
        type_poste: this.normaliserTypePoste(req.body?.type_poste) as CreerOffreDto["type_poste"],
        id_entreprise: req.utilisateur.id_utilisateur
      };

      const nouvelleOffre = await this.offreEmploiService.creerOffre(donneesOffre);

      return reponseSucces(res, 201, "Offre créée avec succès", nouvelleOffre);
    } catch (error: any) {
      console.error("Erreur lors de la création de l'offre:", error);
      return reponseErreur(res, 500, error.message || "Erreur lors de la création de l'offre");
    }
  };

  // PUT /api/entreprise/offres/:id
  modifierOffre = async (req: Request, res: Response) => {
    try {
      if (!req.utilisateur) {
        return reponseErreur(res, 401, "Authentification requise");
      }

      if (req.utilisateur.role !== RoleUtilisateur.ENTREPRISE) {
        return reponseErreur(res, 403, "Accès réservé aux entreprises");
      }

      const idOffre = asString(req.params.id);
      if (!idOffre) {
        return reponseErreur(res, 400, "ID de l'offre manquant");
      }
      
      // Vérifier que l'offre appartient à l'entreprise
      const offreExiste = await this.offreEmploiService.verifierProprietaireOffre(idOffre, req.utilisateur.id_utilisateur);
      if (!offreExiste) {
        return reponseErreur(res, 404, "Offre non trouvée ou accès non autorisé");
      }

      // Validation des données
      const erreurs = this.validerDonneesOffre(req.body, true);
      if (erreurs.length > 0) {
        return reponseErreur(res, 400, `Données invalides: ${erreurs.join(", ")}`);
      }

      const donneesModification: ModifierOffreDto = req.body;
      if (req.body?.type_poste !== undefined) {
        donneesModification.type_poste = this.normaliserTypePoste(req.body.type_poste) as ModifierOffreDto["type_poste"];
      }
      const offreModifiee = await this.offreEmploiService.modifierOffre(idOffre, donneesModification);

      return reponseSucces(res, 200, "Offre modifiée avec succès", offreModifiee);
    } catch (error: any) {
      console.error("Erreur lors de la modification de l'offre:", error);
      return reponseErreur(res, 500, error.message || "Erreur lors de la modification de l'offre");
    }
  };

  // DELETE /api/entreprise/offres/:id
  supprimerOffre = async (req: Request, res: Response) => {
    try {
      if (!req.utilisateur) {
        return reponseErreur(res, 401, "Authentification requise");
      }

      if (req.utilisateur.role !== RoleUtilisateur.ENTREPRISE) {
        return reponseErreur(res, 403, "Accès réservé aux entreprises");
      }

      const idOffre = asString(req.params.id);
      if (!idOffre) {
        return reponseErreur(res, 400, "ID de l'offre manquant");
      }
      
      // Vérifier que l'offre appartient à l'entreprise
      const offreExiste = await this.offreEmploiService.verifierProprietaireOffre(idOffre, req.utilisateur.id_utilisateur);
      if (!offreExiste) {
        return reponseErreur(res, 404, "Offre non trouvée ou accès non autorisé");
      }

      await this.offreEmploiService.supprimerOffre(idOffre);

      return reponseSucces(res, 200, "Offre supprimée avec succès");
    } catch (error: any) {
      console.error("Erreur lors de la suppression de l'offre:", error);
      return reponseErreur(res, 500, error.message || "Erreur lors de la suppression de l'offre");
    }
  };

  // PATCH /api/entreprise/offres/:id/statut
  changerStatutOffre = async (req: Request, res: Response) => {
    try {
      if (!req.utilisateur) {
        return reponseErreur(res, 401, "Authentification requise");
      }

      if (req.utilisateur.role !== RoleUtilisateur.ENTREPRISE) {
        return reponseErreur(res, 403, "Accès réservé aux entreprises");
      }

      const idOffre = asString(req.params.id);
      if (!idOffre) {
        return reponseErreur(res, 400, "ID de l'offre manquant");
      }

      const { statut } = req.body;

      if (!statut || !["active", "inactive", "pourvue", "expiree"].includes(statut)) {
        return reponseErreur(res, 400, "Statut invalide. Valeurs acceptées: active, inactive, pourvue, expiree");
      }

      // Vérifier que l'offre appartient à l'entreprise
      const offreExiste = await this.offreEmploiService.verifierProprietaireOffre(idOffre, req.utilisateur.id_utilisateur);
      if (!offreExiste) {
        return reponseErreur(res, 404, "Offre non trouvée ou accès non autorisé");
      }

      const donneesStatut: ChangerStatutOffreDto = { statut };
      const offreModifiee = await this.offreEmploiService.changerStatutOffre(idOffre, donneesStatut);

      if (statut === "active") {
        void this.matchingService.matchPublishedJob(idOffre).catch((error) => {
          console.error(`Erreur de matching automatique pour l'offre ${idOffre}:`, error);
        });
      }

      return reponseSucces(res, 200, "Statut de l'offre modifié avec succès", offreModifiee);
    } catch (error: any) {
      console.error("Erreur lors du changement de statut:", error);
      return reponseErreur(res, 500, error.message || "Erreur lors du changement de statut");
    }
  };

  private validerDonneesOffre(donnees: any, modification = false): string[] {
    const erreurs: string[] = [];

    if (!modification || donnees.titre !== undefined) {
      if (!donnees.titre || donnees.titre.length < 3) {
        erreurs.push("Le titre doit contenir au moins 3 caractères");
      }
    }

    if (!modification || donnees.description !== undefined) {
      if (!donnees.description || donnees.description.length < 50) {
        erreurs.push("La description doit contenir au moins 50 caractères");
      }
    }

    if (!modification || donnees.localisation !== undefined) {
      if (!donnees.localisation) {
        erreurs.push("La localisation est obligatoire");
      }
    }

    if (!modification || donnees.type_poste !== undefined) {
      const typePosteNormalise = this.normaliserTypePoste(donnees.type_poste);
      if (!typePosteNormalise) {
        erreurs.push("Type de poste invalide");
      } else {
        donnees.type_poste = typePosteNormalise;
      }
    }

    if (donnees.salaire_min && donnees.salaire_max) {
      const salaireMin = parseFloat(donnees.salaire_min);
      const salaireMax = parseFloat(donnees.salaire_max);
      if (salaireMin > salaireMax) {
        erreurs.push("Le salaire minimum ne peut pas être supérieur au salaire maximum");
      }
    }

    if (donnees.date_limite) {
      const dateLimite = new Date(donnees.date_limite);
      const maintenant = new Date();
      if (dateLimite <= maintenant) {
        erreurs.push("La date limite doit être dans le futur");
      }
    }

    return erreurs;
  }
}
