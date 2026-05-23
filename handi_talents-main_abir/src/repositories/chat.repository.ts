import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "../db";
import { conversationTable, conversationParticipantTable, entrepriseTable, messageTable, utilisateurTable } from "../db/schema";

export class ChatRepository {
  async creerConversation(participantIds: string[]) {
    return await db.transaction(async (trx) => {
      const [conv] = await trx.insert(conversationTable).values({}).returning();
      await trx.insert(conversationParticipantTable).values(
        participantIds.map((id) => ({
          conversation_id: conv.id,
          id_utilisateur: id,
          role: "", // rempli plus haut, mais laissé vide si non fourni
        }))
      );
      return conv;
    });
  }

  async ajouterParticipants(conversationId: string, participantIds: { id: string; role: string }[]) {
    if (participantIds.length === 0) return;
    await db
      .insert(conversationParticipantTable)
      .values(
        participantIds.map((p) => ({
          conversation_id: conversationId,
          id_utilisateur: p.id,
          role: p.role,
        }))
      );
  }

  async listerConversationsPourUtilisateur(idUtilisateur: string) {
    const result = await db.execute(sql`
      SELECT
        c.id,
        c.created_at,
        COALESCE(
          string_agg(
            DISTINCT CASE
              WHEN other_cp.id_utilisateur <> ${idUtilisateur}
              THEN COALESCE(e.nom_entreprise, u.nom)
              ELSE NULL
            END,
            ', '
          ),
          'Conversation'
        ) AS participant_names,
        (
          SELECT m2.contenu
          FROM message m2
          WHERE m2.conversation_id = c.id
          ORDER BY m2.created_at DESC
          LIMIT 1
        ) AS last_message,
        (
          SELECT m3.created_at
          FROM message m3
          WHERE m3.conversation_id = c.id
          ORDER BY m3.created_at DESC
          LIMIT 1
        ) AS last_message_at
      FROM conversation c
      INNER JOIN conversation_participant self_cp
        ON self_cp.conversation_id = c.id
       AND self_cp.id_utilisateur = ${idUtilisateur}
      INNER JOIN conversation_participant other_cp
        ON other_cp.conversation_id = c.id
      INNER JOIN utilisateur u
        ON u.id_utilisateur = other_cp.id_utilisateur
      LEFT JOIN entreprise e
        ON e.id_utilisateur = u.id_utilisateur
      GROUP BY c.id, c.created_at
      ORDER BY COALESCE(
        (
          SELECT m4.created_at
          FROM message m4
          WHERE m4.conversation_id = c.id
          ORDER BY m4.created_at DESC
          LIMIT 1
        ),
        c.created_at
      ) DESC
    `);

    return result.rows;
  }

  async utilisateurDansConversation(conversationId: string, idUtilisateur: string) {
    const rows = await db
      .select({ id: conversationParticipantTable.id })
      .from(conversationParticipantTable)
      .where(
        and(eq(conversationParticipantTable.conversation_id, conversationId), eq(conversationParticipantTable.id_utilisateur, idUtilisateur))
      )
      .limit(1);
    return rows.length > 0;
  }

  async listerMessages(conversationId: string, limit = 100, offset = 0) {
    return await db
      .select()
      .from(messageTable)
      .where(eq(messageTable.conversation_id, conversationId))
      .orderBy(messageTable.created_at)
      .limit(limit)
      .offset(offset);
  }

  async listerMessagesDepuis(conversationId: string, since: Date) {
    return await db
      .select()
      .from(messageTable)
      .where(
        and(
          eq(messageTable.conversation_id, conversationId),
          sql`${messageTable.created_at} > ${since}`
        )
      )
      .orderBy(messageTable.created_at);
  }

  async ajouterMessage(conversationId: string, idUtilisateur: string, role: string, contenu: string) {
    const [msg] = await db
      .insert(messageTable)
      .values({
        conversation_id: conversationId,
        id_utilisateur: idUtilisateur,
        role,
        contenu,
      })
      .returning();
    return msg;
  }

  async rechercherDestinataires(
    idUtilisateurCourant: string,
    recherche?: string,
    roleFilter?: "admin" | "entreprise",
  ) {
    const filtre = recherche?.trim();
    const rolesAutorises = roleFilter ? [roleFilter] : ["admin", "entreprise"];

    return await db
      .select({
        id_utilisateur: utilisateurTable.id_utilisateur,
        nom: sql<string>`COALESCE(${entrepriseTable.nom_entreprise}, ${utilisateurTable.nom})`,
        role: utilisateurTable.role,
        email: utilisateurTable.email,
        subtitle: sql<string>`CASE
          WHEN ${utilisateurTable.role} = 'entreprise' THEN COALESCE(${entrepriseTable.secteur_activite}, ${utilisateurTable.email})
          ELSE ${utilisateurTable.email}
        END`,
      })
      .from(utilisateurTable)
      .leftJoin(entrepriseTable, eq(entrepriseTable.id_utilisateur, utilisateurTable.id_utilisateur))
      .where(
        and(
          inArray(utilisateurTable.role, rolesAutorises),
          sql`${utilisateurTable.id_utilisateur} <> ${idUtilisateurCourant}`,
          filtre
            ? sql`(
                ${utilisateurTable.nom} ILIKE ${`%${filtre}%`}
                OR ${utilisateurTable.email} ILIKE ${`%${filtre}%`}
                OR ${entrepriseTable.nom_entreprise} ILIKE ${`%${filtre}%`}
              )`
            : sql`TRUE`,
        ),
      )
      .limit(12);
  }
}
