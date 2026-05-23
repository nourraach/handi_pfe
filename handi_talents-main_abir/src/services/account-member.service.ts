import { AccountMemberRepository } from "../repositories/account-member.repository";
import { ErreurApi } from "../utils/erreur-api";

export class AccountMemberService {
  constructor(private readonly repo = new AccountMemberRepository()) {}

  async listerPourUtilisateur(id_utilisateur: string) {
    const entrepriseId = await this.repo.trouverEntrepriseIdParUtilisateur(id_utilisateur);
    if (!entrepriseId) throw new ErreurApi("Entreprise introuvable pour cet utilisateur.", 404);
    return this.repo.listerPourEntreprise(entrepriseId);
  }

  async creerPourUtilisateur(
    id_utilisateur: string,
    donnees: { nom: string; email: string; role?: string; telephone?: string }
  ) {
    if (!donnees.nom || !donnees.email) {
      throw new ErreurApi("Nom et email sont requis.", 400);
    }
    const entrepriseId = await this.repo.trouverEntrepriseIdParUtilisateur(id_utilisateur);
    if (!entrepriseId) throw new ErreurApi("Entreprise introuvable pour cet utilisateur.", 404);
    return this.repo.creer(entrepriseId, donnees);
  }

  async mettreAJourPourUtilisateur(
    id_utilisateur: string,
    id: string,
    donnees: { nom?: string; email?: string; role?: string; telephone?: string }
  ) {
    const entrepriseId = await this.repo.trouverEntrepriseIdParUtilisateur(id_utilisateur);
    if (!entrepriseId) throw new ErreurApi("Entreprise introuvable pour cet utilisateur.", 404);
    const maj = await this.repo.mettreAJour(entrepriseId, id, donnees);
    if (!maj) throw new ErreurApi("Membre introuvable.", 404);
    return maj;
  }

  async supprimerPourUtilisateur(id_utilisateur: string, id: string) {
    const entrepriseId = await this.repo.trouverEntrepriseIdParUtilisateur(id_utilisateur);
    if (!entrepriseId) throw new ErreurApi("Entreprise introuvable pour cet utilisateur.", 404);
    await this.repo.supprimer(entrepriseId, id);
  }
}
