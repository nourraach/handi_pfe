import { ErreurApi } from "../utils/erreur-api";
import { BienEtreEntretienRepository } from "../repositories/bien-etre-entretien.repository";
import { NotificationService } from "./notification.service";
import { PointsFortsProvider } from "./points-forts.provider";

export class BienEtreEntretienService {
  private readonly repository = new BienEtreEntretienRepository();
  private readonly notificationService = new NotificationService();
  private readonly pointsFortsProvider = new PointsFortsProvider();

  async obtenirContexte(idEntretien: string, idCandidat: string) {
    const contexte = await this.repository.obtenirContexteEntretienCandidat(idEntretien, idCandidat);
    if (!contexte) {
      throw new ErreurApi(403, "Vous n'etes pas autorise a acceder a ce module.");
    }

    if (["annule", "termine"].includes(contexte.entretien.statut)) {
      throw new ErreurApi(409, "Ce module n'est pas disponible pour un entretien annule ou termine.");
    }

    const session = await this.repository.creerSessionSiAbsente(idEntretien, contexte.candidat.id_utilisateur);

    let pointsForts: string[] = [];
    let source = (session?.source_points_forts as "claude" | "fallback" | undefined) ?? "fallback";

    if (session?.points_forts_json) {
      try {
        const parsed = JSON.parse(session.points_forts_json);
        pointsForts = Array.isArray(parsed) ? parsed.map((p) => String(p)).slice(0, 3) : [];
      } catch (_error) {
        pointsForts = [];
      }
    }

    if (pointsForts.length !== 3) {
      const profil = await this.repository.obtenirDonneesProfilPointsForts(idCandidat);
      const resultat = await this.pointsFortsProvider.genererTroisPointsForts({
        nom: profil?.utilisateur?.nom,
        competences: Array.isArray(profil?.candidat?.competences)
          ? (profil?.candidat?.competences as string[])
          : [],
        experience: profil?.candidat?.experience ?? null,
        formation: profil?.candidat?.formation ?? null,
        description: profil?.candidat?.description ?? null,
        secteur: profil?.candidat?.secteur ?? null,
        disponibilite: profil?.candidat?.disponibilite ?? null,
      });
      pointsForts = resultat.pointsForts;
      source = resultat.source;
      await this.repository.enregistrerPointsForts(idEntretien, contexte.candidat.id_utilisateur, pointsForts, source);
    }

    return {
      entretien: {
        id: contexte.entretien.id,
        date_heure: contexte.entretien.date_heure,
        offre_titre: contexte.offre.titre,
      },
      module: {
        estimated_minutes: 5,
        breathing_pattern: "4-7-8",
        visualization_prompt:
          "Imaginez votre entree en entretien: respiration stable, idees claires et exemples concrets de vos experiences.",
      },
      points_forts: pointsForts,
      source_points_forts: source,
    };
  }

  async demarrerSession(idEntretien: string, idCandidat: string, idUtilisateur: string) {
    const contexte = await this.repository.obtenirContexteEntretienCandidat(idEntretien, idCandidat);
    if (!contexte || contexte.candidat.id_utilisateur !== idUtilisateur) {
      throw new ErreurApi(403, "Vous n'etes pas autorise a demarrer cette session.");
    }

    await this.repository.creerSessionSiAbsente(idEntretien, idUtilisateur);
    await this.repository.demarrerSession(idEntretien, idUtilisateur);
    const session = await this.repository.obtenirSessionParEntretienEtUtilisateur(idEntretien, idUtilisateur);

    return { demarre_le: session?.demarre_le ?? new Date() };
  }

  async terminerSession(idEntretien: string, idCandidat: string, idUtilisateur: string, dureeSecondes?: number) {
    const contexte = await this.repository.obtenirContexteEntretienCandidat(idEntretien, idCandidat);
    if (!contexte || contexte.candidat.id_utilisateur !== idUtilisateur) {
      throw new ErreurApi(403, "Vous n'etes pas autorise a terminer cette session.");
    }

    await this.repository.creerSessionSiAbsente(idEntretien, idUtilisateur);
    await this.repository.terminerSession(idEntretien, idUtilisateur, dureeSecondes);
    const session = await this.repository.obtenirSessionParEntretienEtUtilisateur(idEntretien, idUtilisateur);

    return { termine_le: session?.termine_le ?? new Date() };
  }

  async dispatcherRappelJ1(dryRun = false) {
    const maintenant = new Date();
    const debutDemain = new Date(maintenant);
    debutDemain.setDate(debutDemain.getDate() + 1);
    debutDemain.setHours(0, 0, 0, 0);

    const finDemain = new Date(debutDemain);
    finDemain.setHours(23, 59, 59, 999);

    const eligibles = await this.repository.obtenirEntretiensEligiblesRappelJ1(debutDemain, finDemain);
    let envoyees = 0;
    let ignoreesDejaEnvoyees = 0;
    let erreurs = 0;

    for (const item of eligibles) {
      try {
        const idEntretien = item.entretien.id;
        const idUtilisateur = item.candidat.id_utilisateur;

        const session = await this.repository.creerSessionSiAbsente(idEntretien, idUtilisateur);
        if (session?.notification_envoyee_le) {
          ignoreesDejaEnvoyees += 1;
          continue;
        }

        if (!dryRun) {
          await this.notificationService.notifierRappelPreparationEntretien(
            idUtilisateur,
            idEntretien,
            item.offre.titre,
            item.entretien.date_heure,
          );
          await this.repository.marquerNotificationEnvoyee(idEntretien, idUtilisateur);
        }

        envoyees += 1;
      } catch (_error) {
        erreurs += 1;
      }
    }

    return {
      eligible: eligibles.length,
      envoyees,
      ignorees_deja_envoyees: ignoreesDejaEnvoyees,
      erreurs,
      dry_run: dryRun,
    };
  }
}

