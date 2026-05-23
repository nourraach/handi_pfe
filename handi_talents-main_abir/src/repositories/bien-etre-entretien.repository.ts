import { and, eq, gte, inArray, lte } from "drizzle-orm";
import { db } from "../db";
import {
  candidatureTable,
  candidatTable,
  entretienTable,
  offreEmploiTable,
  sessionBienEtreEntretienTable,
  utilisateurTable,
} from "../db/schema";

type SourcePointsForts = "claude" | "fallback";

export class BienEtreEntretienRepository {
  async obtenirSessionParEntretienEtUtilisateur(idEntretien: string, idUtilisateur: string) {
    const [session] = await db
      .select()
      .from(sessionBienEtreEntretienTable)
      .where(
        and(
          eq(sessionBienEtreEntretienTable.id_entretien, idEntretien),
          eq(sessionBienEtreEntretienTable.id_utilisateur, idUtilisateur),
        ),
      )
      .limit(1);

    return session;
  }

  async creerSessionSiAbsente(idEntretien: string, idUtilisateur: string) {
    await db
      .insert(sessionBienEtreEntretienTable)
      .values({
        id_entretien: idEntretien,
        id_utilisateur: idUtilisateur,
      })
      .onConflictDoNothing({
        target: [sessionBienEtreEntretienTable.id_entretien, sessionBienEtreEntretienTable.id_utilisateur],
      });

    return this.obtenirSessionParEntretienEtUtilisateur(idEntretien, idUtilisateur);
  }

  async marquerNotificationEnvoyee(idEntretien: string, idUtilisateur: string) {
    await db
      .update(sessionBienEtreEntretienTable)
      .set({
        notification_envoyee_le: new Date(),
        updated_at: new Date(),
      })
      .where(
        and(
          eq(sessionBienEtreEntretienTable.id_entretien, idEntretien),
          eq(sessionBienEtreEntretienTable.id_utilisateur, idUtilisateur),
        ),
      );
  }

  async demarrerSession(idEntretien: string, idUtilisateur: string) {
    await db
      .update(sessionBienEtreEntretienTable)
      .set({
        demarre_le: new Date(),
        updated_at: new Date(),
      })
      .where(
        and(
          eq(sessionBienEtreEntretienTable.id_entretien, idEntretien),
          eq(sessionBienEtreEntretienTable.id_utilisateur, idUtilisateur),
        ),
      );
  }

  async terminerSession(idEntretien: string, idUtilisateur: string, dureeSecondes?: number) {
    await db
      .update(sessionBienEtreEntretienTable)
      .set({
        termine_le: new Date(),
        ...(typeof dureeSecondes === "number" ? { duree_secondes: dureeSecondes } : {}),
        updated_at: new Date(),
      })
      .where(
        and(
          eq(sessionBienEtreEntretienTable.id_entretien, idEntretien),
          eq(sessionBienEtreEntretienTable.id_utilisateur, idUtilisateur),
        ),
      );
  }

  async enregistrerPointsForts(
    idEntretien: string,
    idUtilisateur: string,
    pointsForts: string[],
    source: SourcePointsForts,
  ) {
    await db
      .update(sessionBienEtreEntretienTable)
      .set({
        points_forts_json: JSON.stringify(pointsForts),
        source_points_forts: source,
        updated_at: new Date(),
      })
      .where(
        and(
          eq(sessionBienEtreEntretienTable.id_entretien, idEntretien),
          eq(sessionBienEtreEntretienTable.id_utilisateur, idUtilisateur),
        ),
      );
  }

  async obtenirContexteEntretienCandidat(idEntretien: string, idCandidat: string) {
    const [row] = await db
      .select({
        entretien: entretienTable,
        candidature: {
          id: candidatureTable.id,
          statut: candidatureTable.statut,
        },
        candidat: {
          id: candidatTable.id,
          id_utilisateur: candidatTable.id_utilisateur,
        },
        offre: {
          id: offreEmploiTable.id,
          titre: offreEmploiTable.titre,
        },
      })
      .from(entretienTable)
      .innerJoin(candidatureTable, eq(entretienTable.id_candidature, candidatureTable.id))
      .innerJoin(candidatTable, eq(candidatureTable.id_candidat, candidatTable.id))
      .innerJoin(offreEmploiTable, eq(candidatureTable.id_offre, offreEmploiTable.id))
      .where(and(eq(entretienTable.id, idEntretien), eq(candidatureTable.id_candidat, idCandidat)))
      .limit(1);

    return row;
  }

  async obtenirEntretiensEligiblesRappelJ1(debut: Date, fin: Date) {
    return db
      .select({
        entretien: entretienTable,
        candidat: {
          id: candidatTable.id,
          id_utilisateur: candidatTable.id_utilisateur,
        },
        offre: {
          id: offreEmploiTable.id,
          titre: offreEmploiTable.titre,
        },
      })
      .from(entretienTable)
      .innerJoin(candidatureTable, eq(entretienTable.id_candidature, candidatureTable.id))
      .innerJoin(candidatTable, eq(candidatureTable.id_candidat, candidatTable.id))
      .innerJoin(offreEmploiTable, eq(candidatureTable.id_offre, offreEmploiTable.id))
      .where(
        and(
          inArray(entretienTable.statut, ["planifie", "confirme", "reporte"]),
          gte(entretienTable.date_heure, debut),
          lte(entretienTable.date_heure, fin),
        ),
      );
  }

  async obtenirDonneesProfilPointsForts(idCandidat: string) {
    const [row] = await db
      .select({
        utilisateur: {
          nom: utilisateurTable.nom,
        },
        candidat: {
          competences: candidatTable.competences,
          experience: candidatTable.experience,
          formation: candidatTable.formation,
          description: candidatTable.description,
          secteur: candidatTable.secteur,
          disponibilite: candidatTable.disponibilite,
        },
      })
      .from(candidatTable)
      .innerJoin(utilisateurTable, eq(candidatTable.id_utilisateur, utilisateurTable.id_utilisateur))
      .where(eq(candidatTable.id, idCandidat))
      .limit(1);

    return row;
  }
}

