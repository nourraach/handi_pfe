import { and, desc, eq, inArray, ilike } from "drizzle-orm";
import { db } from "../db";
import { candidatureTable, candidatTable, entrepriseTable, entretienTable, offreEmploiTable, utilisateurTable } from "../db/schema";
import { ModifierEntretienDto, PlanifierEntretienDto } from "../dto/entretien.dto";

export class EntretienRepository {
  async planifierEntretien(donnees: PlanifierEntretienDto) {
    const [entretien] = await db.insert(entretienTable).values(donnees).returning();
    return entretien;
  }

  async obtenirEntretiensEntreprise(idEntreprise: string) {
    return await db
      .select({
        entretien: entretienTable,
        candidature: {
          id: candidatureTable.id,
          statut: candidatureTable.statut,
        },
        candidat: {
          id: candidatTable.id,
          id_utilisateur: utilisateurTable.id_utilisateur,
          nom: utilisateurTable.nom,
          email: utilisateurTable.email,
          telephone: utilisateurTable.telephone,
        },
        offre: {
          id: offreEmploiTable.id,
          titre: offreEmploiTable.titre,
        },
        entreprise: {
          id: entrepriseTable.id,
          id_utilisateur: entrepriseTable.id_utilisateur,
          nom: entrepriseTable.nom_entreprise,
          contact_rh_nom: entrepriseTable.contact_rh_nom,
          contact_rh_email: entrepriseTable.contact_rh_email,
          contact_rh_telephone: entrepriseTable.contact_rh_telephone,
        },
      })
      .from(entretienTable)
      .innerJoin(candidatureTable, eq(entretienTable.id_candidature, candidatureTable.id))
      .innerJoin(candidatTable, eq(candidatureTable.id_candidat, candidatTable.id))
      .innerJoin(utilisateurTable, eq(candidatTable.id_utilisateur, utilisateurTable.id_utilisateur))
      .innerJoin(offreEmploiTable, eq(candidatureTable.id_offre, offreEmploiTable.id))
      .innerJoin(entrepriseTable, eq(offreEmploiTable.id_entreprise, entrepriseTable.id))
      .where(eq(offreEmploiTable.id_entreprise, idEntreprise))
      .orderBy(entretienTable.date_heure);
  }

  async obtenirEntretiensCandidat(idCandidat: string) {
    return await db
      .select({
        entretien: entretienTable,
        candidature: {
          id: candidatureTable.id,
          statut: candidatureTable.statut,
        },
        offre: {
          id: offreEmploiTable.id,
          titre: offreEmploiTable.titre,
        },
        entreprise: {
          id: entrepriseTable.id,
          id_utilisateur: entrepriseTable.id_utilisateur,
          nom: entrepriseTable.nom_entreprise,
          contact_rh_nom: entrepriseTable.contact_rh_nom,
          contact_rh_email: entrepriseTable.contact_rh_email,
          contact_rh_telephone: entrepriseTable.contact_rh_telephone,
        },
      })
      .from(entretienTable)
      .innerJoin(candidatureTable, eq(entretienTable.id_candidature, candidatureTable.id))
      .innerJoin(offreEmploiTable, eq(candidatureTable.id_offre, offreEmploiTable.id))
      .innerJoin(entrepriseTable, eq(offreEmploiTable.id_entreprise, entrepriseTable.id))
      .where(eq(candidatureTable.id_candidat, idCandidat))
      .orderBy(entretienTable.date_heure);
  }

  async obtenirTous(region?: string) {
    const baseQuery = db
      .select({
        entretien: entretienTable,
        candidature: {
          id: candidatureTable.id,
          statut: candidatureTable.statut,
        },
        candidat: {
          id: candidatTable.id,
          id_utilisateur: utilisateurTable.id_utilisateur,
          nom: utilisateurTable.nom,
          email: utilisateurTable.email,
        },
        entreprise: {
          id: entrepriseTable.id,
          id_utilisateur: entrepriseTable.id_utilisateur,
          nom: entrepriseTable.nom_entreprise,
        },
        offre: {
          id: offreEmploiTable.id,
          titre: offreEmploiTable.titre,
        },
      })
      .from(entretienTable)
      .leftJoin(candidatureTable, eq(entretienTable.id_candidature, candidatureTable.id))
      .leftJoin(candidatTable, eq(candidatureTable.id_candidat, candidatTable.id))
      .leftJoin(utilisateurTable, eq(utilisateurTable.id_utilisateur, candidatTable.id_utilisateur))
      .leftJoin(offreEmploiTable, eq(candidatureTable.id_offre, offreEmploiTable.id))
      .leftJoin(entrepriseTable, eq(offreEmploiTable.id_entreprise, entrepriseTable.id));

    const query = region
      ? baseQuery.where(ilike(utilisateurTable.addresse, `%${region}%`))
      : baseQuery;

    return await query.orderBy(desc(entretienTable.date_heure));
  }

  async modifierEntretien(id: string, donnees: ModifierEntretienDto) {
    const [entretien] = await db
      .update(entretienTable)
      .set({
        ...donnees,
        updated_at: new Date(),
      })
      .where(eq(entretienTable.id, id))
      .returning();

    return entretien;
  }

  async obtenirEntretienParId(id: string) {
    const [entretien] = await db
      .select({
        entretien: entretienTable,
        candidature: {
          id: candidatureTable.id,
          statut: candidatureTable.statut,
        },
        candidat: {
          id: candidatTable.id,
          id_utilisateur: utilisateurTable.id_utilisateur,
          nom: utilisateurTable.nom,
          email: utilisateurTable.email,
          telephone: utilisateurTable.telephone,
        },
        offre: {
          id: offreEmploiTable.id,
          titre: offreEmploiTable.titre,
        },
        entreprise: {
          id: entrepriseTable.id,
          id_utilisateur: entrepriseTable.id_utilisateur,
          nom: entrepriseTable.nom_entreprise,
          contact_rh_nom: entrepriseTable.contact_rh_nom,
          contact_rh_email: entrepriseTable.contact_rh_email,
          contact_rh_telephone: entrepriseTable.contact_rh_telephone,
        },
      })
      .from(entretienTable)
      .innerJoin(candidatureTable, eq(entretienTable.id_candidature, candidatureTable.id))
      .innerJoin(candidatTable, eq(candidatureTable.id_candidat, candidatTable.id))
      .innerJoin(utilisateurTable, eq(candidatTable.id_utilisateur, utilisateurTable.id_utilisateur))
      .innerJoin(offreEmploiTable, eq(candidatureTable.id_offre, offreEmploiTable.id))
      .innerJoin(entrepriseTable, eq(offreEmploiTable.id_entreprise, entrepriseTable.id))
      .where(eq(entretienTable.id, id));

    return entretien;
  }

  async obtenirEntretienActifParCandidature(idCandidature: string) {
    const [entretien] = await db
      .select()
      .from(entretienTable)
      .where(
        and(
          eq(entretienTable.id_candidature, idCandidature),
          inArray(entretienTable.statut, ["planifie", "confirme", "reporte"])
        )
      )
      .orderBy(desc(entretienTable.created_at))
      .limit(1);

    return entretien;
  }

  async supprimerEntretien(id: string) {
    await db.delete(entretienTable).where(eq(entretienTable.id, id));
  }
}
