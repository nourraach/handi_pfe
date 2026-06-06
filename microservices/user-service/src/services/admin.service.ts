import crypto from "crypto";
import { sql } from "drizzle-orm";
import { env } from "../config/env";
import { db } from "../db";
import { DemandeEnAttenteDto } from "../dto/admin.dto";
import { UtilisateurRepository } from "../repositories/utilisateur.repository";
import { CourrielService } from "./courriel.service";
import { RoleUtilisateur, StatutUtilisateur } from "../types/enums";
import { ErreurApi } from "../utils/erreur-api";

export class AdminService {
  constructor(
    private readonly utilisateurRepository = new UtilisateurRepository(),
    private readonly courrielService = new CourrielService(),
  ) {}

  private async assurerTableResetToken() {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS reset_token (
        token TEXT PRIMARY KEY,
        user_id UUID REFERENCES utilisateur(id_utilisateur) ON DELETE CASCADE,
        expire_at TIMESTAMP NOT NULL,
        used BOOLEAN DEFAULT FALSE
      );
    `);
  }

  private async envoyerLienDefinitionMotDePasse(utilisateur: {
    id_utilisateur: string;
    email: string;
    nom: string;
  }) {
    await this.assurerTableResetToken();

    const token = crypto.randomBytes(24).toString("hex");

    await db.execute(sql`
      INSERT INTO reset_token (token, user_id, expire_at, used)
      VALUES (${token}, ${utilisateur.id_utilisateur}, NOW() + interval '72 hours', false)
    `);

    const lien = `${env.frontendUrl}/reset?token=${token}`;
    await this.courrielService.envoyerCourrielDefinitionMotDePasse(utilisateur.email, utilisateur.nom, lien);
  }

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

    if (utilisateur.role === RoleUtilisateur.ENTREPRISE) {
      await this.utilisateurRepository.validerEntreprise(id_utilisateur);
    }

    try {
      await this.envoyerLienDefinitionMotDePasse({
        id_utilisateur: utilisateurMisAJour.id_utilisateur,
        email: utilisateurMisAJour.email,
        nom: utilisateurMisAJour.nom,
      });
    } catch (_erreur) {
      return {
        message:
          "La demande a ete approuvee et le compte est actif, mais l'email de finalisation n'a pas pu etre envoye. Veuillez verifier la configuration email.",
      };
    }

    return {
      message: "La demande a ete approuvee, le compte est maintenant actif et un email de finalisation a ete envoye.",
    };
  }

  async refuserDemande(id_utilisateur: string, motifRefus: string) {
    const utilisateur = await this.utilisateurRepository.verifierStatut(id_utilisateur, StatutUtilisateur.EN_ATTENTE);

    if (!utilisateur) {
      throw new ErreurApi("Aucune demande en attente n'a ete trouvee pour cet utilisateur.", 404);
    }

    await this.utilisateurRepository.mettreAJourStatut(id_utilisateur, StatutUtilisateur.REFUSE, null);

    try {
      await this.courrielService.envoyerCourrielRefusInscription(utilisateur.email, utilisateur.nom, motifRefus);
    } catch (_erreur) {
      return {
        message:
          "La demande a ete refusee, mais l'email de refus n'a pas pu etre envoye. Veuillez verifier la configuration email.",
      };
    }

    return {
      message: "La demande a ete refusee et un email avec le motif de refus a ete envoye.",
    };
  }
}
