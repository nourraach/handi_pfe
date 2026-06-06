import { Request, Response, NextFunction } from "express";
import { GestionUtilisateursService } from "../services/gestion-utilisateurs.service";
import { reponseSucces } from "../utils/reponse";
import { ErreurApi } from "../utils/erreur-api";
import { StatistiquesQueryDto } from "../dto/gestion-utilisateurs.dto";

export class GestionUtilisateursController {
  constructor(private readonly service = new GestionUtilisateursService()) {}

  listerUtilisateurs = async (requete: Request, reponse: Response, suivant: NextFunction) => {
    try {
      const query = {
        page: parseInt(requete.query.page as string) || 1,
        limit: parseInt(requete.query.limit as string) || 10,
        role: requete.query.role as string,
        statut: requete.query.statut as string,
        dateDebut: requete.query.dateDebut as string,
        dateFin: requete.query.dateFin as string,
        recherche: requete.query.recherche as string,
      };

      const resultat = await this.service.listerUtilisateurs(query);
      return reponseSucces(reponse, 200, resultat.message, resultat.donnees);
    } catch (erreur) {
      return suivant(erreur);
    }
  };

  obtenirUtilisateur = async (requete: Request, reponse: Response, suivant: NextFunction) => {
    try {
      const id_utilisateur = requete.params.id_utilisateur as string;

      if (!id_utilisateur) {
        throw new ErreurApi("ID utilisateur manquant", 400);
      }

      const resultat = await this.service.obtenirUtilisateur(id_utilisateur);
      return reponseSucces(reponse, 200, resultat.message, resultat.donnees);
    } catch (erreur) {
      return suivant(erreur);
    }
  };

  creerUtilisateur = async (requete: Request, reponse: Response, suivant: NextFunction) => {
    try {
      const adminId = requete.utilisateur?.id_utilisateur;
      if (!adminId) {
        throw new ErreurApi("Utilisateur non authentifie", 401);
      }

      const resultat = await this.service.creerUtilisateur(requete.body, adminId);
      return reponseSucces(reponse, 201, resultat.message, resultat.donnees);
    } catch (erreur) {
      return suivant(erreur);
    }
  };

  modifierUtilisateur = async (requete: Request, reponse: Response, suivant: NextFunction) => {
    try {
      const id_utilisateur = requete.params.id_utilisateur as string;
      const adminId = requete.utilisateur?.id_utilisateur;

      if (!id_utilisateur) {
        throw new ErreurApi("ID utilisateur manquant", 400);
      }
      if (!adminId) {
        throw new ErreurApi("Utilisateur non authentifie", 401);
      }

      const resultat = await this.service.modifierUtilisateur(id_utilisateur, requete.body, adminId);
      return reponseSucces(reponse, 200, resultat.message, resultat.donnees);
    } catch (erreur) {
      return suivant(erreur);
    }
  };

  supprimerUtilisateur = async (requete: Request, reponse: Response, suivant: NextFunction) => {
    try {
      const id_utilisateur = requete.params.id_utilisateur as string;
      const adminId = requete.utilisateur?.id_utilisateur;

      if (!id_utilisateur) {
        throw new ErreurApi("ID utilisateur manquant", 400);
      }
      if (!adminId) {
        throw new ErreurApi("Utilisateur non authentifie", 401);
      }

      const resultat = await this.service.supprimerUtilisateur(id_utilisateur, adminId);
      return reponseSucces(reponse, 200, resultat.message, resultat.donnees);
    } catch (erreur) {
      return suivant(erreur);
    }
  };

  changerStatut = async (requete: Request, reponse: Response, suivant: NextFunction) => {
    try {
      const id_utilisateur = requete.params.id_utilisateur as string;
      const adminId = requete.utilisateur?.id_utilisateur;

      if (!id_utilisateur) {
        throw new ErreurApi("ID utilisateur manquant", 400);
      }
      if (!adminId) {
        throw new ErreurApi("Utilisateur non authentifie", 401);
      }

      const resultat = await this.service.changerStatut(id_utilisateur, requete.body, adminId);
      return reponseSucces(reponse, 200, resultat.message, resultat.donnees);
    } catch (erreur) {
      return suivant(erreur);
    }
  };

  reinitialiserMotDePasse = async (requete: Request, reponse: Response, suivant: NextFunction) => {
    try {
      const id_utilisateur = requete.params.id_utilisateur as string;
      const adminId = requete.utilisateur?.id_utilisateur;

      if (!id_utilisateur) {
        throw new ErreurApi("ID utilisateur manquant", 400);
      }
      if (!adminId) {
        throw new ErreurApi("Utilisateur non authentifie", 401);
      }

      const resultat = await this.service.reinitialiserMotDePasse(id_utilisateur, adminId);
      return reponseSucces(reponse, 200, resultat.message, resultat.donnees);
    } catch (erreur) {
      return suivant(erreur);
    }
  };

  rechercheAvancee = async (requete: Request, reponse: Response, suivant: NextFunction) => {
    try {
      const resultat = await this.service.rechercheAvancee(requete.body);
      return reponseSucces(reponse, 200, resultat.message, resultat.donnees);
    } catch (erreur) {
      return suivant(erreur);
    }
  };

  obtenirStatistiques = async (requete: Request, reponse: Response, suivant: NextFunction) => {
    try {
      const periode = requete.query.periode as string;
      const query: StatistiquesQueryDto = {
        dateDebut: requete.query.dateDebut as string,
        dateFin: requete.query.dateFin as string,
      };

      if (periode && ["jour", "semaine", "mois", "annee"].includes(periode)) {
        query.periode = periode as "jour" | "semaine" | "mois" | "annee";
      }

      const resultat = await this.service.obtenirStatistiquesDetaillees(query);
      return reponseSucces(reponse, 200, resultat.message, resultat.donnees);
    } catch (erreur) {
      return suivant(erreur);
    }
  };

  obtenirHistorique = async (requete: Request, reponse: Response, suivant: NextFunction) => {
    try {
      const id_utilisateur = requete.params.id_utilisateur as string;

      if (!id_utilisateur) {
        throw new ErreurApi("ID utilisateur manquant", 400);
      }

      const resultat = await this.service.obtenirHistoriqueActions(id_utilisateur);
      return reponseSucces(reponse, 200, resultat.message, resultat.donnees);
    } catch (erreur) {
      return suivant(erreur);
    }
  };

  exporterUtilisateurs = async (requete: Request, reponse: Response, suivant: NextFunction) => {
    try {
      const query = {
        role: requete.query.role as string,
        statut: requete.query.statut as string,
        dateDebut: requete.query.dateDebut as string,
        dateFin: requete.query.dateFin as string,
        format: ((requete.query.format as string) || "csv") as "csv" | "xlsx",
      };

      const resultat = await this.service.exporterUtilisateurs(query);

      if (query.format === "csv") {
        reponse.setHeader("Content-Type", "text/csv");
        reponse.setHeader("Content-Disposition", `attachment; filename="${resultat.filename}"`);
        return reponse.send(resultat.content);
      }

      return reponseSucces(reponse, 200, "Export Excel genere avec succes", resultat);
    } catch (erreur) {
      return suivant(erreur);
    }
  };
}
