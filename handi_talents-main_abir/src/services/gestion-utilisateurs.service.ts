import crypto from "crypto";
import { sql } from "drizzle-orm";
import { env } from "../config/env";
import { db } from "../db";
import {
  ChangerStatutDto,
  CreerUtilisateurDto,
  ExportQueryDto,
  ListeUtilisateursQueryDto,
  ModifierUtilisateurDto,
  RechercheAvanceeDto,
  StatistiquesQueryDto,
} from "../dto/gestion-utilisateurs.dto";
import { GestionUtilisateursRepository } from "../repositories/gestion-utilisateurs.repository";
import { RoleUtilisateur, StatutUtilisateur } from "../types/enums";
import { ErreurApi } from "../utils/erreur-api";
import { hacherMotDePasse } from "../utils/securite";
import { CourrielService } from "./courriel.service";

export class GestionUtilisateursService {
  constructor(
    private readonly repository = new GestionUtilisateursRepository(),
    private readonly courrielService = new CourrielService(),
  ) {}

  private roleExigeTerritoire(role: string) {
    return role === RoleUtilisateur.INSPECTEUR || role === RoleUtilisateur.ANETI;
  }

  private normaliserChampTexte(valeur?: string | null) {
    const texte = valeur?.trim();
    return texte ? texte : null;
  }

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

  async listerUtilisateurs(query: ListeUtilisateursQueryDto) {
    const result = await this.repository.listerUtilisateurs(query);
    const statistiques = await this.repository.obtenirStatistiques();

    return {
      message: "Utilisateurs recuperes avec succes",
      donnees: {
        utilisateurs: result.utilisateurs.map((u) => ({
          id_utilisateur: u.id_utilisateur,
          nom: u.nom,
          email: u.email,
          role: u.role,
          statut: u.statut,
          telephone: u.telephone,
          addresse: u.addresse,
          region: u.region || undefined,
          gouvernorat: u.gouvernorat || undefined,
          delegation: u.delegation || undefined,
          created_at: u.created_at.toISOString(),
          updated_at: u.updated_at.toISOString(),
        })),
        pagination: result.pagination,
        statistiques,
      },
    };
  }

  async obtenirUtilisateur(id_utilisateur: string) {
    const utilisateur = await this.repository.obtenirUtilisateurParId(id_utilisateur);

    if (!utilisateur) {
      throw new ErreurApi("Utilisateur non trouve", 404);
    }

    return {
      message: "Utilisateur recupere avec succes",
      donnees: {
        id_utilisateur: utilisateur.id_utilisateur,
        nom: utilisateur.nom,
        email: utilisateur.email,
        role: utilisateur.role,
        statut: utilisateur.statut,
        telephone: utilisateur.telephone,
        addresse: utilisateur.addresse,
        region: utilisateur.region || undefined,
        gouvernorat: utilisateur.gouvernorat || undefined,
        delegation: utilisateur.delegation || undefined,
        created_at: utilisateur.created_at.toISOString(),
        updated_at: utilisateur.updated_at.toISOString(),
        derniere_connexion: utilisateur.derniere_connexion?.toISOString(),
        profil_complete: utilisateur.profil_complete,
      },
    };
  }

  async creerUtilisateur(donnees: CreerUtilisateurDto, adminId: string) {
    const utilisateursExistants = await this.repository.listerUtilisateurs({ recherche: donnees.email });
    const utilisateurExistant = utilisateursExistants.utilisateurs.find((u) => u.email === donnees.email);

    if (utilisateurExistant) {
      throw new ErreurApi("Un utilisateur avec cet email existe deja", 409);
    }

    if (!Object.values(RoleUtilisateur).includes(donnees.role as RoleUtilisateur)) {
      throw new ErreurApi("Role invalide", 400);
    }

    const roleExigeTerritoire = this.roleExigeTerritoire(donnees.role);
    if (roleExigeTerritoire && !donnees.gouvernorat?.trim()) {
      throw new ErreurApi("Le gouvernorat est obligatoire pour ce role", 400);
    }
    if (roleExigeTerritoire && !donnees.delegation?.trim()) {
      throw new ErreurApi("La delegation est obligatoire pour ce role", 400);
    }

    const statut = donnees.statut || StatutUtilisateur.ACTIF;
    if (!Object.values(StatutUtilisateur).includes(statut as StatutUtilisateur)) {
      throw new ErreurApi("Statut invalide", 400);
    }

    const motDePasseTemporaire = crypto.randomBytes(32).toString("hex");
    const mdpHache = await hacherMotDePasse(motDePasseTemporaire);

    const champsContact = {
      telephone: donnees.telephone?.trim() || "N/A",
      addresse: donnees.addresse?.trim() || "N/A",
    };

    const champsTerritoriaux = roleExigeTerritoire
      ? {
          region: this.normaliserChampTexte(donnees.delegation),
          gouvernorat: this.normaliserChampTexte(donnees.gouvernorat),
          delegation: this.normaliserChampTexte(donnees.delegation),
        }
      : {
          region: null,
          gouvernorat: null,
          delegation: null,
        };

    const nouvelUtilisateur = await this.repository.creerUtilisateur({
      nom: donnees.nom,
      email: donnees.email,
      mdp: mdpHache,
      role: donnees.role,
      statut,
      ...champsTerritoriaux,
      ...champsContact,
    });

    if (!nouvelUtilisateur) {
      throw new ErreurApi("Erreur lors de la creation de l'utilisateur", 500);
    }

    await this.repository.enregistrerActionAudit(adminId, nouvelUtilisateur.id_utilisateur, "creation", null, {
      nom: donnees.nom,
      email: donnees.email,
      role: donnees.role,
      statut,
      gouvernorat: champsTerritoriaux.gouvernorat,
      delegation: champsTerritoriaux.delegation,
    });

    await this.envoyerLienDefinitionMotDePasse({
      id_utilisateur: nouvelUtilisateur.id_utilisateur,
      email: nouvelUtilisateur.email,
      nom: nouvelUtilisateur.nom,
    });

    return {
      message: "Utilisateur cree avec succes. Un email lui a ete envoye pour definir son mot de passe.",
      donnees: {
        id_utilisateur: nouvelUtilisateur.id_utilisateur,
        nom: nouvelUtilisateur.nom,
        email: nouvelUtilisateur.email,
        role: nouvelUtilisateur.role,
        statut: nouvelUtilisateur.statut,
        gouvernorat: nouvelUtilisateur.gouvernorat || undefined,
        delegation: nouvelUtilisateur.delegation || undefined,
      },
    };
  }

  async modifierUtilisateur(id_utilisateur: string, donnees: ModifierUtilisateurDto, adminId: string) {
    const utilisateurExistant = await this.repository.obtenirUtilisateurParId(id_utilisateur);
    if (!utilisateurExistant) {
      throw new ErreurApi("Utilisateur non trouve", 404);
    }

    if (adminId === id_utilisateur && donnees.role && donnees.role !== utilisateurExistant.role) {
      throw new ErreurApi("Vous ne pouvez pas modifier votre propre role", 403);
    }

    if (donnees.role && !Object.values(RoleUtilisateur).includes(donnees.role as RoleUtilisateur)) {
      throw new ErreurApi("Role invalide", 400);
    }

    const roleFinal = (donnees.role || utilisateurExistant.role) as RoleUtilisateur;
    const roleExigeTerritoire = this.roleExigeTerritoire(roleFinal);
    const gouvernoratFinal = this.normaliserChampTexte(donnees.gouvernorat) ?? utilisateurExistant.gouvernorat ?? null;
    const delegationFinal =
      this.normaliserChampTexte(donnees.delegation) ??
      this.normaliserChampTexte(donnees.region) ??
      utilisateurExistant.delegation ??
      utilisateurExistant.region ??
      null;

    if (roleExigeTerritoire && !gouvernoratFinal) {
      throw new ErreurApi("Le gouvernorat est obligatoire pour ce role", 400);
    }

    if (roleExigeTerritoire && !delegationFinal) {
      throw new ErreurApi("La delegation est obligatoire pour ce role", 400);
    }

    if (donnees.statut && !Object.values(StatutUtilisateur).includes(donnees.statut as StatutUtilisateur)) {
      throw new ErreurApi("Statut invalide", 400);
    }

    const donneesNormalisees: Record<string, unknown> = {
      ...donnees,
      ...(roleExigeTerritoire
        ? {
            region: delegationFinal,
            gouvernorat: gouvernoratFinal,
            delegation: delegationFinal,
          }
        : {
            region: null,
            gouvernorat: null,
            delegation: null,
          }),
    };

    const utilisateurModifie = await this.repository.modifierUtilisateur(id_utilisateur, donneesNormalisees);

    if (!utilisateurModifie) {
      throw new ErreurApi("Erreur lors de la modification", 500);
    }

    await this.repository.enregistrerActionAudit(
      adminId,
      id_utilisateur,
      "modification",
      {
        nom: utilisateurExistant.nom,
        email: utilisateurExistant.email,
        role: utilisateurExistant.role,
        statut: utilisateurExistant.statut,
        gouvernorat: utilisateurExistant.gouvernorat,
        delegation: utilisateurExistant.delegation || utilisateurExistant.region,
      },
      donneesNormalisees,
    );

    return {
      message: "Utilisateur modifie avec succes",
      donnees: {
        id_utilisateur: utilisateurModifie.id_utilisateur,
        nom: utilisateurModifie.nom,
        email: utilisateurModifie.email,
      },
    };
  }

  async supprimerUtilisateur(id_utilisateur: string, adminId: string) {
    if (adminId === id_utilisateur) {
      throw new ErreurApi("Vous ne pouvez pas supprimer votre propre compte", 403);
    }

    const utilisateur = await this.repository.obtenirUtilisateurParId(id_utilisateur);
    if (!utilisateur) {
      throw new ErreurApi("Utilisateur non trouve", 404);
    }

    const utilisateurSupprime = await this.repository.supprimerUtilisateur(id_utilisateur);

    if (!utilisateurSupprime) {
      throw new ErreurApi("Erreur lors de la suppression", 500);
    }

    await this.repository.enregistrerActionAudit(
      adminId,
      id_utilisateur,
      "suppression",
      {
        nom: utilisateur.nom,
        email: utilisateur.email,
        role: utilisateur.role,
        statut: utilisateur.statut,
      },
      null,
    );

    return {
      message: "Utilisateur supprime avec succes",
      donnees: {
        id_utilisateur,
        supprime_le: new Date().toISOString(),
      },
    };
  }

  async changerStatut(id_utilisateur: string, donnees: ChangerStatutDto, adminId: string) {
    const utilisateur = await this.repository.obtenirUtilisateurParId(id_utilisateur);
    if (!utilisateur) {
      throw new ErreurApi("Utilisateur non trouve", 404);
    }

    if (!Object.values(StatutUtilisateur).includes(donnees.statut as StatutUtilisateur)) {
      throw new ErreurApi("Statut invalide", 400);
    }

    const ancienStatut = utilisateur.statut;
    const utilisateurModifie = await this.repository.changerStatut(id_utilisateur, donnees.statut as StatutUtilisateur);

    if (!utilisateurModifie) {
      throw new ErreurApi("Erreur lors du changement de statut", 500);
    }

    await this.repository.enregistrerActionAudit(
      adminId,
      id_utilisateur,
      "changement_statut",
      { statut: ancienStatut },
      { statut: donnees.statut },
    );

    return {
      message: "Statut modifie avec succes",
      donnees: {
        id_utilisateur,
        ancien_statut: ancienStatut,
        nouveau_statut: donnees.statut,
        modifie_le: new Date().toISOString(),
      },
    };
  }

  async reinitialiserMotDePasse(id_utilisateur: string, adminId: string) {
    const utilisateur = await this.repository.obtenirUtilisateurParId(id_utilisateur);
    if (!utilisateur) {
      throw new ErreurApi("Utilisateur non trouve", 404);
    }

    const nouveauMotDePasse = `Temp${crypto.randomBytes(4).toString("hex")}!`;
    const mdpHache = await hacherMotDePasse(nouveauMotDePasse);

    await this.repository.modifierUtilisateur(id_utilisateur, { mdp: mdpHache });

    await this.repository.enregistrerActionAudit(adminId, id_utilisateur, "reset_password", null, {
      nouveau_mot_de_passe_genere: true,
    });

    return {
      message: "Mot de passe reinitialise avec succes",
      donnees: {
        id_utilisateur,
        nouveauMotDePasse,
        expire_le: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      },
    };
  }

  async rechercheAvancee(criteres: RechercheAvanceeDto) {
    const result = await this.repository.rechercheAvancee(criteres);

    return {
      message: "Recherche effectuee avec succes",
      donnees: {
        utilisateurs: result.utilisateurs.map((u) => ({
          id_utilisateur: u.id_utilisateur,
          nom: u.nom,
          email: u.email,
          role: u.role,
          statut: u.statut,
          telephone: u.telephone,
          addresse: u.addresse,
          region: u.region || undefined,
          gouvernorat: u.gouvernorat || undefined,
          delegation: u.delegation || undefined,
          created_at: u.created_at.toISOString(),
          updated_at: u.updated_at.toISOString(),
        })),
        pagination: result.pagination,
        criteres_appliques: criteres.criteres,
      },
    };
  }

  async obtenirStatistiquesDetaillees(query: StatistiquesQueryDto) {
    const stats = await this.repository.obtenirStatistiquesDetaillees(query.periode, query.dateDebut, query.dateFin);

    return {
      message: "Statistiques recuperees avec succes",
      donnees: stats,
    };
  }

  async obtenirHistoriqueActions(id_utilisateur: string) {
    const actions = await this.repository.obtenirHistoriqueActions(id_utilisateur);

    return {
      message: "Historique recupere avec succes",
      donnees: {
        actions: actions.map((a) => ({
          id_action: a.action.id_action,
          type_action: a.action.type_action,
          ancien_statut: (a.action.anciennes_valeurs as any)?.statut,
          nouveau_statut: (a.action.nouvelles_valeurs as any)?.statut,
          admin_id: a.action.admin_id,
          admin_nom: a.admin?.nom || "Admin supprime",
          date_action: a.action.date_action.toISOString(),
          commentaire: a.action.commentaire,
        })),
      },
    };
  }

  async exporterUtilisateurs(query: ExportQueryDto) {
    const utilisateurs = await this.repository.exporterUtilisateurs(query);

    if (query.format === "csv" || !query.format) {
      const headers = ["id_utilisateur", "nom", "email", "role", "statut", "telephone", "gouvernorat", "delegation", "created_at"];
      const csvContent = [
        headers.join(","),
        ...utilisateurs.map((u) =>
          [
            u.id_utilisateur,
            `"${u.nom}"`,
            `"${u.email}"`,
            u.role,
            u.statut,
            `"${u.telephone}"`,
            `"${u.gouvernorat || ""}"`,
            `"${u.delegation || ""}"`,
            u.created_at.toISOString().split("T")[0],
          ].join(","),
        ),
      ].join("\n");

      return {
        content: csvContent,
        filename: `utilisateurs_${new Date().toISOString().split("T")[0]}.csv`,
        contentType: "text/csv",
      };
    }

    return {
      data: utilisateurs,
      filename: `utilisateurs_${new Date().toISOString().split("T")[0]}.xlsx`,
      contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    };
  }
}
