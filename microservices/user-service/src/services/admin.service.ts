import { DemandeEnAttenteDto } from "../dto/admin.dto";
import { UtilisateurRepository } from "../repositories/utilisateur.repository";
import { RoleUtilisateur, StatutUtilisateur } from "../types/enums";
import { ErreurApi } from "../utils/erreur-api";

export class AdminService {
  constructor(private readonly utilisateurRepository = new UtilisateurRepository()) {}

  async listerDemandesEnAttente(): Promise<DemandeEnAttenteDto[]> {
    const lignes = await this.utilisateurRepository.listerDemandesEnAttente();

    return lignes.map(({ utilisateur, candidat, entreprise }) => ({
      id_utilisateur: utilisateur.id_utilisateur,
      nom: utilisateur.nom,
      email: utilisateur.email,
      role: utilisateur.role as RoleUtilisateur,
      statut: utilisateur.statut as StatutUtilisateur,
      telephone: utilisateur.telephone,
      addresse: utilisateur.addresse,
      created_at: utilisateur.created_at,
      profil_candidat: candidat ? { ...candidat } : null,
      profil_entreprise: entreprise ? { ...entreprise } : null,
    }));
  }

  async approuverDemande(id_utilisateur: string) {
    const utilisateur = await this.utilisateurRepository.verifierStatut(id_utilisateur, StatutUtilisateur.EN_ATTENTE);

    if (!utilisateur) {
      throw new ErreurApi("Aucune demande en attente n'a ete trouvee pour cet utilisateur.", 404);
    }

    const utilisateurMisAJour = await this.utilisateurRepository.mettreAJourStatut(
      id_utilisateur,
      StatutUtilisateur.ACTIF,
      null,
    );

    if (!utilisateurMisAJour) {
      throw new ErreurApi("Impossible d'approuver cette demande.", 500);
    }

    return {
      message: "La demande a ete approuvee et le compte est maintenant actif.",
    };
  }

  async refuserDemande(id_utilisateur: string) {
    const utilisateur = await this.utilisateurRepository.verifierStatut(id_utilisateur, StatutUtilisateur.EN_ATTENTE);

    if (!utilisateur) {
      throw new ErreurApi("Aucune demande en attente n'a ete trouvee pour cet utilisateur.", 404);
    }

    await this.utilisateurRepository.mettreAJourStatut(id_utilisateur, StatutUtilisateur.REFUSE, null);

    return {
      message: "La demande a ete refusee.",
    };
  }
}
