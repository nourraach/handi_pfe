import { Request, Response, NextFunction } from "express";
import { ProfilService } from "../services/profil.service";
import { reponseSucces } from "../utils/reponse";
import { ErreurApi } from "../utils/erreur-api";

const estDemandeSuppression = (valeur: unknown) =>
  typeof valeur === "string" ? ["1", "true", "yes", "on"].includes(valeur.toLowerCase()) : valeur === true;

export class ProfilController {
  constructor(private readonly profilService = new ProfilService()) {}

  // Candidat
  obtenirProfilCandidat = async (requete: Request, reponse: Response, suivant: NextFunction) => {
    try {
      const id_utilisateur = requete.params.id_utilisateur as string;
      const utilisateurConnecte = requete.utilisateur;

      if (!id_utilisateur) {
        throw new ErreurApi("ID utilisateur manquant.", 400);
      }

      // Vérifier que l'utilisateur peut accéder à ce profil
      const estAdmin = utilisateurConnecte?.role === "admin";
      if (utilisateurConnecte?.id_utilisateur !== id_utilisateur && !estAdmin) {
        throw new ErreurApi("Accès non autorisé à ce profil.", 403);
      }

      const resultat = await this.profilService.obtenirProfilCandidat(id_utilisateur);
      return reponseSucces(reponse, 200, resultat.message, resultat.donnees);
    } catch (erreur) {
      return suivant(erreur);
    }
  };

  mettreAJourProfilCandidat = async (requete: Request, reponse: Response, suivant: NextFunction) => {
    try {
      const utilisateurConnecte = requete.utilisateur;

      if (!utilisateurConnecte) {
        throw new ErreurApi("Utilisateur non authentifié.", 401);
      }

      const resultat = await this.profilService.mettreAJourProfilCandidat(
        utilisateurConnecte.id_utilisateur,
        requete.body
      );
      return reponseSucces(reponse, 200, resultat.message, resultat.donnees);
    } catch (erreur) {
      return suivant(erreur);
    }
  };

  mettreAJourDocumentsCandidat = async (requete: Request, reponse: Response, suivant: NextFunction) => {
    try {
      const utilisateurConnecte = requete.utilisateur;
      if (!utilisateurConnecte) {
        throw new ErreurApi("Utilisateur non authentifié.", 401);
      }
      const cv = (requete as any).files?.cv?.[0];
      const carte = (requete as any).files?.carte?.[0];
      const video = (requete as any).files?.video?.[0];
      const photo = (requete as any).files?.photo?.[0];

      const donneesDocuments: Record<string, string> = {};

      if (cv?.path) {
        donneesDocuments.cv_url = cv.path.replace(/^.*public[\\/]/, "/");
      } else if (estDemandeSuppression(requete.body?.remove_cv)) {
        donneesDocuments.cv_url = "";
      }

      if (carte?.path) {
        donneesDocuments.carte_handicap_url = carte.path.replace(/^.*public[\\/]/, "/");
      } else if (estDemandeSuppression(requete.body?.remove_carte)) {
        donneesDocuments.carte_handicap_url = "";
      }

      if (video?.path) {
        donneesDocuments.video_cv_url = video.path.replace(/^.*public[\\/]/, "/");
      } else if (estDemandeSuppression(requete.body?.remove_video)) {
        donneesDocuments.video_cv_url = "";
      }

      if (photo?.path) {
        donneesDocuments.photo_profil_url = photo.path.replace(/^.*public[\\/]/, "/");
      } else if (estDemandeSuppression(requete.body?.remove_photo)) {
        donneesDocuments.photo_profil_url = "";
      }

      if (Object.keys(donneesDocuments).length === 0) {
        throw new ErreurApi("Aucun document à mettre à jour.", 400);
      }

      const resultat = await this.profilService.mettreAJourProfilCandidat(utilisateurConnecte.id_utilisateur, donneesDocuments as any);

      return reponseSucces(reponse, 200, resultat.message, resultat.donnees);
    } catch (erreur) {
      return suivant(erreur);
    }
  };

  // Entreprise
  obtenirProfilEntreprise = async (requete: Request, reponse: Response, suivant: NextFunction) => {
    try {
      const id_utilisateur = requete.params.id_utilisateur as string;
      const utilisateurConnecte = requete.utilisateur;

      if (!id_utilisateur) {
        throw new ErreurApi("ID utilisateur manquant.", 400);
      }

      // Vérifier que l'utilisateur peut accéder à ce profil
      if (utilisateurConnecte?.id_utilisateur !== id_utilisateur && utilisateurConnecte?.role !== "admin") {
        throw new ErreurApi("Accès non autorisé à ce profil.", 403);
      }

      const resultat = await this.profilService.obtenirProfilEntreprise(id_utilisateur);
      return reponseSucces(reponse, 200, resultat.message, resultat.donnees);
    } catch (erreur) {
      return suivant(erreur);
    }
  };

  mettreAJourProfilEntreprise = async (requete: Request, reponse: Response, suivant: NextFunction) => {
    try {
      const utilisateurConnecte = requete.utilisateur;

      if (!utilisateurConnecte) {
        throw new ErreurApi("Utilisateur non authentifié.", 401);
      }

      const resultat = await this.profilService.mettreAJourProfilEntreprise(
        utilisateurConnecte.id_utilisateur,
        requete.body
      );
      return reponseSucces(reponse, 200, resultat.message, resultat.donnees);
    } catch (erreur) {
      return suivant(erreur);
    }
  };

  mettreAJourDocumentsEntreprise = async (requete: Request, reponse: Response, suivant: NextFunction) => {
    try {
      const utilisateurConnecte = requete.utilisateur;
      if (!utilisateurConnecte) {
        throw new ErreurApi("Utilisateur non authentifié.", 401);
      }

      const patenteFile = (requete as any).files?.patente?.[0];
      const rneFile = (requete as any).files?.rne?.[0];
      const logoFile = (requete as any).files?.logo?.[0];
      const removeLogo = estDemandeSuppression(requete.body?.remove_logo);

      const resultat = await this.profilService.mettreAJourDocumentsEntreprise(utilisateurConnecte.id_utilisateur, {
        patente: patenteFile?.path ? patenteFile.path.replace(/^.*public[\\/]/, "/") : undefined,
        rne: rneFile?.path ? rneFile.path.replace(/^.*public[\\/]/, "/") : undefined,
        logo_url: logoFile?.path ? logoFile.path.replace(/^.*public[\\/]/, "/") : removeLogo ? "" : undefined,
      });

      return reponseSucces(reponse, 200, resultat.message, resultat.donnees);
    } catch (erreur) {
      return suivant(erreur);
    }
  };

  choisirPackEntreprise = async (requete: Request, reponse: Response, suivant: NextFunction) => {
    try {
      const utilisateurConnecte = requete.utilisateur;
      if (!utilisateurConnecte) {
        throw new ErreurApi("Utilisateur non authentifiÃ©.", 401);
      }

      const resultat = await this.profilService.choisirPackEntreprise(utilisateurConnecte.id_utilisateur, requete.body);
      return reponseSucces(reponse, 200, resultat.message, resultat.donnees);
    } catch (erreur) {
      return suivant(erreur);
    }
  };

  // Admin
  obtenirProfilAdmin = async (requete: Request, reponse: Response, suivant: NextFunction) => {
    try {
      const id_utilisateur = requete.params.id_utilisateur as string;
      const utilisateurConnecte = requete.utilisateur;

      if (!id_utilisateur) {
        throw new ErreurApi("ID utilisateur manquant.", 400);
      }

      // Vérifier que l'utilisateur peut accéder à ce profil
      if (utilisateurConnecte?.id_utilisateur !== id_utilisateur && utilisateurConnecte?.role !== "admin") {
        throw new ErreurApi("Accès non autorisé à ce profil.", 403);
      }

      const resultat = await this.profilService.obtenirProfilAdmin(id_utilisateur);
      return reponseSucces(reponse, 200, resultat.message, resultat.donnees);
    } catch (erreur) {
      return suivant(erreur);
    }
  };

  mettreAJourProfilAdmin = async (requete: Request, reponse: Response, suivant: NextFunction) => {
    try {
      const utilisateurConnecte = requete.utilisateur;

      if (!utilisateurConnecte) {
        throw new ErreurApi("Utilisateur non authentifié.", 401);
      }

      const resultat = await this.profilService.mettreAJourProfilAdmin(
        utilisateurConnecte.id_utilisateur,
        requete.body
      );
      return reponseSucces(reponse, 200, resultat.message, resultat.donnees);
    } catch (erreur) {
      return suivant(erreur);
    }
  };
}
