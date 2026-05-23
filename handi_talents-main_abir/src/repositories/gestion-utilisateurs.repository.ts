import { and, count, desc, eq, ilike, or, sql, gte, lte, inArray } from "drizzle-orm";
import { db } from "../db";
import { auditActionsAdminTable, candidatTable, entrepriseTable, utilisateurTable } from "../db/schema";
import { ListeUtilisateursQueryDto, RechercheAvanceeDto } from "../dto/gestion-utilisateurs.dto";
import { RoleUtilisateur, StatutUtilisateur } from "../types/enums";

export class GestionUtilisateursRepository {
  // Lister les utilisateurs avec pagination et filtres
  async listerUtilisateurs(query: ListeUtilisateursQueryDto) {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 10, 100);
    const offset = (page - 1) * limit;

    let whereConditions: any[] = [];

    // Filtres
    if (query.role) {
      whereConditions.push(eq(utilisateurTable.role, query.role as any));
    }
    if (query.statut) {
      whereConditions.push(eq(utilisateurTable.statut, query.statut as any));
    }
    if (query.dateDebut) {
      whereConditions.push(gte(utilisateurTable.created_at, new Date(query.dateDebut)));
    }
    if (query.dateFin) {
      whereConditions.push(lte(utilisateurTable.created_at, new Date(query.dateFin)));
    }
    if (query.recherche) {
      whereConditions.push(
        or(
          ilike(utilisateurTable.nom, `%${query.recherche}%`),
          ilike(utilisateurTable.email, `%${query.recherche}%`)
        )
      );
    }

    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

    // Récupérer les utilisateurs
    const utilisateurs = await db
      .select()
      .from(utilisateurTable)
      .where(whereClause)
      .orderBy(desc(utilisateurTable.created_at))
      .limit(limit)
      .offset(offset);

    // Compter le total
    const [totalResult] = await db
      .select({ count: count() })
      .from(utilisateurTable)
      .where(whereClause);

    const total = totalResult?.count || 0;
    const totalPages = Math.ceil(total / limit);

    return {
      utilisateurs,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  // Obtenir les statistiques
  async obtenirStatistiques() {
    const [stats] = await db
      .select({
        total: count(),
        actifs: count(sql`CASE WHEN ${utilisateurTable.statut} = 'actif' THEN 1 END`),
        en_attente: count(sql`CASE WHEN ${utilisateurTable.statut} = 'en_attente' THEN 1 END`),
        suspendus: count(sql`CASE WHEN ${utilisateurTable.statut} = 'suspendu' THEN 1 END`),
      })
      .from(utilisateurTable);

    const statsParRole = await db
      .select({
        role: utilisateurTable.role,
        count: count(),
      })
      .from(utilisateurTable)
      .groupBy(utilisateurTable.role);

    const par_role = statsParRole.reduce((acc, stat) => {
      acc[stat.role] = stat.count;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: stats?.total || 0,
      actifs: stats?.actifs || 0,
      en_attente: stats?.en_attente || 0,
      suspendus: stats?.suspendus || 0,
      par_role,
    };
  }

  // Récupérer un utilisateur par ID
  async obtenirUtilisateurParId(id_utilisateur: string) {
    const [utilisateur] = await db
      .select()
      .from(utilisateurTable)
      .where(eq(utilisateurTable.id_utilisateur, id_utilisateur));

    return utilisateur ?? null;
  }

  // Créer un utilisateur
  async creerUtilisateur(donnees: any) {
    const [utilisateur] = await db
      .insert(utilisateurTable)
      .values(donnees)
      .returning();

    return utilisateur;
  }

  // Modifier un utilisateur
  async modifierUtilisateur(id_utilisateur: string, donnees: any) {
    const [utilisateur] = await db
      .update(utilisateurTable)
      .set({
        ...donnees,
        updated_at: new Date(),
      })
      .where(eq(utilisateurTable.id_utilisateur, id_utilisateur))
      .returning();

    return utilisateur ?? null;
  }

  // Supprimer un utilisateur
  async supprimerUtilisateur(id_utilisateur: string) {
    const [utilisateur] = await db
      .delete(utilisateurTable)
      .where(eq(utilisateurTable.id_utilisateur, id_utilisateur))
      .returning();

    return utilisateur ?? null;
  }

  // Changer le statut d'un utilisateur
  async changerStatut(id_utilisateur: string, nouveauStatut: StatutUtilisateur) {
    const [utilisateur] = await db
      .update(utilisateurTable)
      .set({
        statut: nouveauStatut,
        updated_at: new Date(),
      })
      .where(eq(utilisateurTable.id_utilisateur, id_utilisateur))
      .returning();

    return utilisateur ?? null;
  }

  // Recherche avancée
  async rechercheAvancee(criteres: RechercheAvanceeDto) {
    const page = criteres.pagination?.page || 1;
    const limit = Math.min(criteres.pagination?.limit || 10, 100);
    const offset = (page - 1) * limit;

    let whereConditions: any[] = [];

    // Appliquer les critères de recherche
    if (criteres.criteres.nom) {
      whereConditions.push(ilike(utilisateurTable.nom, `%${criteres.criteres.nom}%`));
    }
    if (criteres.criteres.email_domaine) {
      whereConditions.push(ilike(utilisateurTable.email, `%@${criteres.criteres.email_domaine}`));
    }
    if (criteres.criteres.role && criteres.criteres.role.length > 0) {
      whereConditions.push(inArray(utilisateurTable.role, criteres.criteres.role as any[]));
    }
    if (criteres.criteres.statut && criteres.criteres.statut.length > 0) {
      whereConditions.push(inArray(utilisateurTable.statut, criteres.criteres.statut as any[]));
    }
    if (criteres.criteres.date_creation_apres) {
      whereConditions.push(gte(utilisateurTable.created_at, new Date(criteres.criteres.date_creation_apres)));
    }
    if (criteres.criteres.date_creation_avant) {
      whereConditions.push(lte(utilisateurTable.created_at, new Date(criteres.criteres.date_creation_avant)));
    }
    if (criteres.criteres.ville) {
      whereConditions.push(ilike(utilisateurTable.addresse, `%${criteres.criteres.ville}%`));
    }

    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

    // Tri
    let orderBy = desc(utilisateurTable.created_at);
    if (criteres.tri) {
      const champ = criteres.tri.champ as keyof typeof utilisateurTable;
      if (utilisateurTable[champ]) {
        orderBy = criteres.tri.ordre === 'asc' 
          ? sql`${utilisateurTable[champ]} ASC`
          : sql`${utilisateurTable[champ]} DESC`;
      }
    }

    const utilisateurs = await db
      .select()
      .from(utilisateurTable)
      .where(whereClause)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    const [totalResult] = await db
      .select({ count: count() })
      .from(utilisateurTable)
      .where(whereClause);

    return {
      utilisateurs,
      pagination: {
        page,
        limit,
        total: totalResult?.count || 0,
        totalPages: Math.ceil((totalResult?.count || 0) / limit),
      },
    };
  }

  // Enregistrer une action d'audit
  async enregistrerActionAudit(
    adminId: string,
    utilisateurCibleId: string,
    typeAction: string,
    anciennesValeurs?: any,
    nouvellesValeurs?: any,
    commentaire?: string
  ) {
    const [action] = await db
      .insert(auditActionsAdminTable)
      .values({
        admin_id: adminId,
        utilisateur_cible_id: utilisateurCibleId,
        type_action: typeAction as any,
        anciennes_valeurs: anciennesValeurs,
        nouvelles_valeurs: nouvellesValeurs,
        commentaire,
      })
      .returning();

    return action;
  }

  // Obtenir l'historique des actions pour un utilisateur
  async obtenirHistoriqueActions(utilisateurId: string) {
    const actions = await db
      .select({
        action: auditActionsAdminTable,
        admin: {
          nom: utilisateurTable.nom,
        },
      })
      .from(auditActionsAdminTable)
      .leftJoin(utilisateurTable, eq(auditActionsAdminTable.admin_id, utilisateurTable.id_utilisateur))
      .where(eq(auditActionsAdminTable.utilisateur_cible_id, utilisateurId))
      .orderBy(desc(auditActionsAdminTable.date_action));

    return actions;
  }

  // Obtenir les statistiques détaillées
  async obtenirStatistiquesDetaillees(periode?: string, dateDebut?: string, dateFin?: string) {
    let whereConditions: any[] = [];

    if (dateDebut) {
      whereConditions.push(gte(utilisateurTable.created_at, new Date(dateDebut)));
    }
    if (dateFin) {
      whereConditions.push(lte(utilisateurTable.created_at, new Date(dateFin)));
    }

    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

    // Statistiques générales
    const [stats] = await db
      .select({
        total: count(),
        actifs: count(sql`CASE WHEN ${utilisateurTable.statut} = 'actif' THEN 1 END`),
        en_attente: count(sql`CASE WHEN ${utilisateurTable.statut} = 'en_attente' THEN 1 END`),
        suspendus: count(sql`CASE WHEN ${utilisateurTable.statut} = 'suspendu' THEN 1 END`),
      })
      .from(utilisateurTable)
      .where(whereClause);

    // Répartition par rôle
    const statsParRole = await db
      .select({
        role: utilisateurTable.role,
        count: count(),
      })
      .from(utilisateurTable)
      .where(whereClause)
      .groupBy(utilisateurTable.role);

    // Répartition par statut
    const statsParStatut = await db
      .select({
        statut: utilisateurTable.statut,
        count: count(),
      })
      .from(utilisateurTable)
      .where(whereClause)
      .groupBy(utilisateurTable.statut);

    // Top domaines email
    const domainesEmail = await db
      .select({
        domaine: sql<string>`SUBSTRING(${utilisateurTable.email} FROM '@(.*)$')`,
        count: count(),
      })
      .from(utilisateurTable)
      .where(whereClause)
      .groupBy(sql`SUBSTRING(${utilisateurTable.email} FROM '@(.*)$')`)
      .orderBy(desc(count()))
      .limit(10);

    return {
      total_utilisateurs: stats?.total || 0,
      nouveaux_utilisateurs_periode: stats?.total || 0,
      utilisateurs_actifs_periode: stats?.actifs || 0,
      repartition_roles: statsParRole.reduce((acc, stat) => {
        acc[stat.role] = stat.count;
        return acc;
      }, {} as Record<string, number>),
      repartition_statuts: statsParStatut.reduce((acc, stat) => {
        acc[stat.statut] = stat.count;
        return acc;
      }, {} as Record<string, number>),
      top_domaines_email: domainesEmail.map(d => ({
        domaine: d.domaine,
        count: d.count,
      })),
    };
  }

  // Exporter les utilisateurs
  async exporterUtilisateurs(filtres: any) {
    let whereConditions: any[] = [];

    if (filtres.role) {
      whereConditions.push(eq(utilisateurTable.role, filtres.role as any));
    }
    if (filtres.statut) {
      whereConditions.push(eq(utilisateurTable.statut, filtres.statut as any));
    }
    if (filtres.dateDebut) {
      whereConditions.push(gte(utilisateurTable.created_at, new Date(filtres.dateDebut)));
    }
    if (filtres.dateFin) {
      whereConditions.push(lte(utilisateurTable.created_at, new Date(filtres.dateFin)));
    }

    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

    const utilisateurs = await db
      .select({
        id_utilisateur: utilisateurTable.id_utilisateur,
        nom: utilisateurTable.nom,
        email: utilisateurTable.email,
        role: utilisateurTable.role,
        statut: utilisateurTable.statut,
        telephone: utilisateurTable.telephone,
        addresse: utilisateurTable.addresse,
        region: utilisateurTable.region,
        gouvernorat: utilisateurTable.gouvernorat,
        delegation: utilisateurTable.delegation,
        created_at: utilisateurTable.created_at,
      })
      .from(utilisateurTable)
      .where(whereClause)
      .orderBy(desc(utilisateurTable.created_at));

    return utilisateurs;
  }
}
