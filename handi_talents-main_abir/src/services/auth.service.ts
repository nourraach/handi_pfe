// @ts-nocheck
import crypto from "crypto";
import { eq, sql } from "drizzle-orm";
import { env } from "../config/env";
import { db } from "../db";
import { candidatTable, entrepriseTable, utilisateurTable } from "../db/schema";
import {
  ChangerMdpDto,
  ConnexionDto,
  DemandeResetMdpDto,
  InscriptionCandidatDto,
  InscriptionEntrepriseDto,
  ReponseAuthentificationDto,
  ResetMdpDto,
} from "../dto/auth.dto";
import { UtilisateurRepository } from "../repositories/utilisateur.repository";
import { RoleUtilisateur, StatutUtilisateur, StatutValidationEntreprise } from "../types/enums";
import { ErreurApi } from "../utils/erreur-api";
import { comparerMotDePasse, genererJwt, hacherMotDePasse } from "../utils/securite";
import { CourrielService } from "./courriel.service";

export class AuthService {
  constructor(
    private readonly utilisateurRepository = new UtilisateurRepository(),
    private readonly courrielService = new CourrielService(),
  ) {
    this.initialiserTables();
  }

  private async initialiserTables() {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS reset_token (
        token TEXT PRIMARY KEY,
        user_id UUID REFERENCES utilisateur(id_utilisateur) ON DELETE CASCADE,
        expire_at TIMESTAMP NOT NULL,
        used BOOLEAN DEFAULT FALSE
      );
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS login_attempt (
        email TEXT PRIMARY KEY,
        count INTEGER NOT NULL DEFAULT 0,
        locked_until TIMESTAMP,
        alert_sent BOOLEAN NOT NULL DEFAULT FALSE
      );
    `);
    await db.execute(sql`ALTER TABLE login_attempt ADD COLUMN IF NOT EXISTS alert_sent BOOLEAN NOT NULL DEFAULT FALSE;`);
  }

  private validerCarteHandicapObligatoire(carteHandicapUrl?: string) {
    if (!carteHandicapUrl) {
      throw new ErreurApi("La carte de handicap est obligatoire lors de l'inscription.", 400);
    }
  }

  private async resoudreIdentifiantsRole(
    userId: string,
    role: RoleUtilisateur,
  ): Promise<{ candidatId?: string; entrepriseId?: string }> {
    if (role === RoleUtilisateur.CANDIDAT) {
      const row = await db
        .select({ id: candidatTable.id })
        .from(candidatTable)
        .where(eq(candidatTable.id_utilisateur, userId))
        .limit(1);
      return { candidatId: row[0]?.id };
    }

    if (role === RoleUtilisateur.ENTREPRISE) {
      const row = await db
        .select({ id: entrepriseTable.id })
        .from(entrepriseTable)
        .where(eq(entrepriseTable.id_utilisateur, userId))
        .limit(1);
      return { entrepriseId: row[0]?.id };
    }

    return {};
  }

  async inscrireCandidat(donnees: InscriptionCandidatDto): Promise<ReponseAuthentificationDto> {
    this.validerCarteHandicapObligatoire(donnees.carte_handicap_url);
    const emailExiste = await this.utilisateurRepository.emailExiste(donnees.email);

    if (emailExiste) {
      throw new ErreurApi("Un compte avec cet email existe deja.", 409);
    }

    const mdpHache = await hacherMotDePasse(donnees.mdp);

    await db.transaction(async (transaction) => {
      const lignesUtilisateur = await transaction
        .insert(utilisateurTable)
        .values({
          nom: donnees.nom,
          email: donnees.email,
          mdp: mdpHache,
          telephone: donnees.telephone,
          addresse: donnees.addresse,
          role: RoleUtilisateur.CANDIDAT,
          statut: StatutUtilisateur.EN_ATTENTE,
          genre: donnees.genre,
        })
        .returning();

      const utilisateur = lignesUtilisateur[0];

      if (!utilisateur) {
        throw new ErreurApi("La creation du compte candidat a echoue.", 500);
      }

      await transaction.insert(candidatTable).values({
        id_utilisateur: utilisateur.id_utilisateur,
        type_handicap: donnees.type_handicap,
        num_carte_handicap: donnees.num_carte_handicap,
        date_expiration_carte_handicap: new Date(donnees.date_expiration_carte_handicap),
        carte_handicap_url: donnees.carte_handicap_url,
        niveau_academique: donnees.niveau_academique,
        description: donnees.description,
        secteur: donnees.secteur,
        type_licence: donnees.type_licence,
        preference_communication: donnees.preference_communication,
        age: Number(donnees.age),
      });
    });

    return {
      message: "Votre demande d'inscription a ete envoyee et sera verifiee par un administrateur.",
    };
  }

  async inscrireEntreprise(donnees: InscriptionEntrepriseDto): Promise<ReponseAuthentificationDto> {
    const emailExiste = await this.utilisateurRepository.emailExiste(donnees.email);

    if (emailExiste) {
      throw new ErreurApi("Un compte avec cet email existe deja.", 409);
    }

    const mdpHache = await hacherMotDePasse(donnees.mdp);

    await db.transaction(async (transaction) => {
      const lignesUtilisateur = await transaction
        .insert(utilisateurTable)
        .values({
          nom: donnees.nom,
          email: donnees.email,
          mdp: mdpHache,
          telephone: donnees.telephone,
          addresse: donnees.addresse,
          role: RoleUtilisateur.ENTREPRISE,
          statut: StatutUtilisateur.EN_ATTENTE,
        })
        .returning();

      const utilisateur = lignesUtilisateur[0];

      if (!utilisateur) {
        throw new ErreurApi("La creation du compte entreprise a echoue.", 500);
      }

      await transaction.insert(entrepriseTable).values({
        id_utilisateur: utilisateur.id_utilisateur,
        nom_entreprise: donnees.nom_entreprise,
        patente: donnees.patente,
        rne: donnees.rne,
        statut_validation: StatutValidationEntreprise.INVALIDE,
        profil_publique: donnees.profil_publique,
        url_site: donnees.url_site || null,
        date_fondation: new Date(donnees.date_fondation),
        description: donnees.description,
        nbr_employe: donnees.nbr_employe,
        nbr_employe_handicape: donnees.nbr_employe_handicape,
      });
    });

    return {
      message: "Votre demande d'inscription a ete envoyee et sera verifiee par un administrateur.",
    };
  }

  async connecter(donnees: ConnexionDto): Promise<ReponseAuthentificationDto> {
    const utilisateur = await this.utilisateurRepository.trouverParEmail(donnees.email);

    if (!utilisateur) {
      throw new ErreurApi("Email ou mot de passe invalide.", 401);
    }

    const now = Date.now();
    const tentativeDb = await db.execute(
      sql`SELECT count, locked_until, alert_sent FROM login_attempt WHERE email = ${donnees.email}`,
    );
    const tentativeRow = tentativeDb.rows[0];

    if (tentativeRow?.locked_until && new Date(tentativeRow.locked_until).getTime() > now) {
      throw new ErreurApi("Compte verrouille temporairement apres trop de tentatives. Reessayez plus tard.", 429);
    }

    const motDePasseValide = await comparerMotDePasse(donnees.mdp, utilisateur.mdp);

    if (!motDePasseValide) {
      const count = Number(tentativeRow?.count || 0) + 1;
      const lockTs = count >= 5 ? sql`NOW() + interval '15 minutes'` : null;
      const shouldSendEnterpriseAlert =
        utilisateur.role === RoleUtilisateur.ENTREPRISE && count > 3 && !Boolean(tentativeRow?.alert_sent);
      const nextAlertSent = shouldSendEnterpriseAlert ? true : Boolean(tentativeRow?.alert_sent);

      await db.execute(sql`
        INSERT INTO login_attempt(email, count, locked_until, alert_sent)
        VALUES (${donnees.email}, ${count}, ${lockTs}, ${nextAlertSent})
        ON CONFLICT(email) DO UPDATE SET count = ${count}, locked_until = ${lockTs}, alert_sent = ${nextAlertSent};
      `);

      if (shouldSendEnterpriseAlert) {
        await this.courrielService.envoyerAlerteTentativesConnexionEntreprise(
          utilisateur.email,
          utilisateur.nom,
          count,
        );
      }

      throw new ErreurApi("Email ou mot de passe invalide.", 401);
    }

    await db.execute(sql`DELETE FROM login_attempt WHERE email = ${donnees.email};`);

    if (utilisateur.statut === StatutUtilisateur.EN_ATTENTE) {
      throw new ErreurApi("Votre compte est en attente de validation par un administrateur.", 403);
    }

    if (utilisateur.statut === StatutUtilisateur.REFUSE) {
      throw new ErreurApi("Votre demande d'inscription a ete refusee.", 403);
    }

    if (utilisateur.statut === StatutUtilisateur.SUSPENDU) {
      throw new ErreurApi("Votre compte a ete suspendu.", 403);
    }

    if (utilisateur.statut === StatutUtilisateur.INACTIF) {
      throw new ErreurApi("Votre compte est inactif.", 403);
    }

    if (utilisateur.statut === StatutUtilisateur.APPROUVE) {
      const utilisateurActive = await this.utilisateurRepository.mettreAJourStatut(
        utilisateur.id_utilisateur,
        StatutUtilisateur.ACTIF,
        null,
      );
      if (utilisateurActive) {
        utilisateur.statut = StatutUtilisateur.ACTIF;
      }
    }

    const estAutorise = utilisateur.statut === StatutUtilisateur.ACTIF;
    if (!estAutorise) {
      throw new ErreurApi("Votre compte n'est pas autorise a se connecter.", 403);
    }

    const roleUtilisateur = utilisateur.role as RoleUtilisateur;
    const statutUtilisateur = utilisateur.statut as StatutUtilisateur;
    const idsRole = await this.resoudreIdentifiantsRole(utilisateur.id_utilisateur, roleUtilisateur);
    const token = genererJwt({
      id_utilisateur: utilisateur.id_utilisateur,
      email: utilisateur.email,
      role: roleUtilisateur,
      ...(utilisateur.region ? { region: utilisateur.region } : {}),
      ...(idsRole.candidatId ? { candidat: { id: idsRole.candidatId } } : {}),
      ...(idsRole.entrepriseId ? { entreprise: { id: idsRole.entrepriseId } } : {}),
    });

    return {
      message: "Connexion reussie.",
      token,
      utilisateur: {
        id_utilisateur: utilisateur.id_utilisateur,
        nom: utilisateur.nom,
        email: utilisateur.email,
        role: roleUtilisateur,
        statut: statutUtilisateur,
        ...(utilisateur.region ? { region: utilisateur.region } : {}),
        ...(idsRole.candidatId ? { candidat: { id: idsRole.candidatId } } : {}),
        ...(idsRole.entrepriseId ? { entreprise: { id: idsRole.entrepriseId } } : {}),
      },
    };
  }

  async demanderReset(dto: DemandeResetMdpDto) {
    const utilisateur = await this.utilisateurRepository.trouverParEmail(dto.email);
    if (!utilisateur) {
      return { message: "Si un compte existe, un email de reinitialisation a ete envoye." };
    }

    const token = crypto.randomBytes(24).toString("hex");
    await db.execute(sql`
      INSERT INTO reset_token (token, user_id, expire_at, used)
      VALUES (${token}, ${utilisateur.id_utilisateur}, NOW() + interval '30 minutes', false)
    `);

    const lien = `${env.frontendUrl}/reset?token=${token}`;
    await this.courrielService.envoyerCourrielReset(utilisateur.email, utilisateur.nom, lien);
    return { message: "Un email de reinitialisation a ete envoye." };
  }

  async resetMotDePasse(dto: ResetMdpDto) {
    const rows = await db.execute(sql`SELECT user_id, expire_at, used FROM reset_token WHERE token = ${dto.token}`);
    const info = rows.rows[0];

    if (!info || info.used || new Date(info.expire_at).getTime() < Date.now()) {
      throw new ErreurApi("Token invalide ou expire.", 400);
    }

    const mdpHache = await hacherMotDePasse(dto.nouveau_mdp);
    const user = await this.utilisateurRepository.mettreAJourMotDePasse(info.user_id as string, mdpHache);
    await db.execute(sql`UPDATE reset_token SET used = true WHERE token = ${dto.token}`);

    if (!user) {
      throw new ErreurApi("Utilisateur introuvable.", 404);
    }

    return { message: "Mot de passe reinitialise." };
  }

  async changerMotDePasse(id_utilisateur: string, dto: ChangerMdpDto) {
    const rows = await db.select().from(utilisateurTable).where(eq(utilisateurTable.id_utilisateur, id_utilisateur));
    const utilisateur = rows[0];

    if (!utilisateur) {
      throw new ErreurApi("Utilisateur introuvable.", 404);
    }

    const ok = await comparerMotDePasse(dto.ancien_mdp, utilisateur.mdp);
    if (!ok) {
      throw new ErreurApi("Ancien mot de passe incorrect.", 400);
    }

    const mdpHache = await hacherMotDePasse(dto.nouveau_mdp);
    await this.utilisateurRepository.mettreAJourMotDePasse(id_utilisateur, mdpHache);
    return { message: "Mot de passe change." };
  }

  async supprimerCompte(id_utilisateur: string) {
    await this.utilisateurRepository.supprimerUtilisateur(id_utilisateur);
    return { message: "Compte supprime." };
  }

  async logout() {
    return { message: "Deconnexion effectuee cote client." };
  }
}
