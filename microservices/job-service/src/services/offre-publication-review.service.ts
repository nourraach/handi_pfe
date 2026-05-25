import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "../db";
import { entrepriseTable, offreEmploiTable, offrePublicationReviewTable, utilisateurTable } from "../db/schema";
import { ErreurApi } from "../utils/erreur-api";
import { MatchingService } from "./matching.service";
import { NotificationService } from "./notification.service";

type PublicationReviewStatus = "pending" | "approved" | "rejected";

export class OffrePublicationReviewService {
  private readonly notificationService = new NotificationService();
  private readonly matchingService = new MatchingService();
  private readonly ensureSchemaPromise = this.ensureSchema();

  private async ensureSchema() {
    try {
      await db.execute(sql`
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'publication_review_status') THEN
            CREATE TYPE publication_review_status AS ENUM ('pending', 'approved', 'rejected');
          END IF;
        END$$;
      `);

      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS offre_publication_review (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          id_offre UUID NOT NULL UNIQUE REFERENCES offre_emploi(id) ON DELETE CASCADE,
          status publication_review_status NOT NULL DEFAULT 'pending',
          rejection_reason TEXT NULL,
          reviewed_by UUID NULL REFERENCES utilisateur(id_utilisateur) ON DELETE SET NULL,
          reviewed_at TIMESTAMP NULL,
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        );
      `);
    } catch (error) {
      console.error("Offer publication review schema init failed:", error);
    }
  }

  async initialiserDemandePublication(idOffre: string) {
    await this.ensureSchemaPromise;

    await db
      .insert(offrePublicationReviewTable)
      .values({
        id_offre: idOffre,
        status: "pending",
        rejection_reason: null,
        reviewed_by: null,
        reviewed_at: null,
      })
      .onConflictDoUpdate({
        target: [offrePublicationReviewTable.id_offre],
        set: {
          status: "pending",
          rejection_reason: null,
          reviewed_by: null,
          reviewed_at: null,
          updated_at: new Date(),
        },
      });
  }

  async soumettrePourPublication(idOffre: string) {
    await this.ensureSchemaPromise;

    await db
      .update(offreEmploiTable)
      .set({
        statut: "inactive",
        updated_at: new Date(),
      })
      .where(eq(offreEmploiTable.id, idOffre));

    await this.initialiserDemandePublication(idOffre);
  }

  async obtenirStatutDemande(idOffre: string): Promise<PublicationReviewStatus | null> {
    await this.ensureSchemaPromise;

    const rows = await db
      .select({
        status: offrePublicationReviewTable.status,
      })
      .from(offrePublicationReviewTable)
      .where(eq(offrePublicationReviewTable.id_offre, idOffre))
      .limit(1);

    return (rows[0]?.status as PublicationReviewStatus | undefined) || null;
  }

  async listerOffresEnAttente(limit = 50) {
    await this.ensureSchemaPromise;

    return db
      .select({
        id_offre: offreEmploiTable.id,
        titre: offreEmploiTable.titre,
        description: offreEmploiTable.description,
        localisation: offreEmploiTable.localisation,
        type_poste: offreEmploiTable.type_poste,
        created_at: offreEmploiTable.created_at,
        entreprise_id: entrepriseTable.id,
        entreprise_nom: entrepriseTable.nom_entreprise,
        owner_user_id: entrepriseTable.id_utilisateur,
        review_status: offrePublicationReviewTable.status,
      })
      .from(offrePublicationReviewTable)
      .innerJoin(offreEmploiTable, eq(offrePublicationReviewTable.id_offre, offreEmploiTable.id))
      .innerJoin(entrepriseTable, eq(offreEmploiTable.id_entreprise, entrepriseTable.id))
      .where(eq(offrePublicationReviewTable.status, "pending"))
      .orderBy(desc(offreEmploiTable.created_at))
      .limit(limit);
  }

  private async getOfferOwnership(idOffre: string) {
    const rows = await db
      .select({
        id_offre: offreEmploiTable.id,
        titre: offreEmploiTable.titre,
        entreprise_id: entrepriseTable.id,
        owner_user_id: entrepriseTable.id_utilisateur,
      })
      .from(offreEmploiTable)
      .innerJoin(entrepriseTable, eq(offreEmploiTable.id_entreprise, entrepriseTable.id))
      .where(eq(offreEmploiTable.id, idOffre))
      .limit(1);

    return rows[0];
  }

  async approuverPublication(idOffre: string, adminUserId: string) {
    await this.ensureSchemaPromise;

    const ownership = await this.getOfferOwnership(idOffre);
    if (!ownership) {
      throw new ErreurApi("Offre non trouvee.", 404);
    }

    const now = new Date();

    await db
      .insert(offrePublicationReviewTable)
      .values({
        id_offre: idOffre,
        status: "approved",
        rejection_reason: null,
        reviewed_by: adminUserId,
        reviewed_at: now,
      })
      .onConflictDoUpdate({
        target: [offrePublicationReviewTable.id_offre],
        set: {
          status: "approved",
          rejection_reason: null,
          reviewed_by: adminUserId,
          reviewed_at: now,
          updated_at: now,
        },
      });

    await db
      .update(offreEmploiTable)
      .set({
        statut: "active",
        updated_at: now,
      })
      .where(eq(offreEmploiTable.id, idOffre));

    await this.notificationService.creerNotification({
      id_utilisateur: ownership.owner_user_id,
      type: "system",
      titre: "Publication de l'offre approuvee",
      message: `Votre offre "${ownership.titre}" a ete validee et publiee.`,
      data: JSON.stringify({
        category: "offer_publication_review",
        decision: "approved",
        id_offre: idOffre,
      }),
    });

    try {
      await this.matchingService.matchPublishedJob(idOffre);
    } catch (error) {
      console.error(`Erreur de matching automatique pour l'offre ${idOffre}:`, error);
    }

    return {
      id_offre: idOffre,
      statut: "active",
      publication_review_status: "approved" as const,
      reviewed_at: now.toISOString(),
    };
  }

  async refuserPublication(idOffre: string, adminUserId: string, motif: string) {
    await this.ensureSchemaPromise;

    const raison = String(motif || "").trim();
    if (raison.length < 5) {
      throw new ErreurApi("Le motif de refus doit contenir au moins 5 caracteres.", 400);
    }

    const ownership = await this.getOfferOwnership(idOffre);
    if (!ownership) {
      throw new ErreurApi("Offre non trouvee.", 404);
    }

    const now = new Date();

    await db
      .insert(offrePublicationReviewTable)
      .values({
        id_offre: idOffre,
        status: "rejected",
        rejection_reason: raison,
        reviewed_by: adminUserId,
        reviewed_at: now,
      })
      .onConflictDoUpdate({
        target: [offrePublicationReviewTable.id_offre],
        set: {
          status: "rejected",
          rejection_reason: raison,
          reviewed_by: adminUserId,
          reviewed_at: now,
          updated_at: now,
        },
      });

    await db
      .update(offreEmploiTable)
      .set({
        statut: "inactive",
        updated_at: now,
      })
      .where(eq(offreEmploiTable.id, idOffre));

    await this.notificationService.creerNotification({
      id_utilisateur: ownership.owner_user_id,
      type: "system",
      titre: "Publication de l'offre refusee",
      message: `Votre offre "${ownership.titre}" a ete refusee. Motif: ${raison}`,
      data: JSON.stringify({
        category: "offer_publication_review",
        decision: "rejected",
        id_offre: idOffre,
        motif: raison,
      }),
    });

    return {
      id_offre: idOffre,
      statut: "inactive",
      publication_review_status: "rejected" as const,
      publication_rejection_reason: raison,
      reviewed_at: now.toISOString(),
    };
  }
}

