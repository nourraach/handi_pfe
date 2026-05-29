import { ProfilRepository } from "../repositories/profil.repository";
import { ChoixPackEntrepriseDto, ProfilAdminDto, ProfilCandidatDto, ProfilEntrepriseDto, ReponseProfilDto } from "../dto/profil.dto";
import { ErreurApi } from "../utils/erreur-api";
import { RoleUtilisateur } from "../types/enums";
import { db } from "../db";
import { sql } from "drizzle-orm";
import { GestionUtilisateursService } from "./gestion-utilisateurs.service";

export class ProfilService {
  constructor(
    private readonly profilRepository = new ProfilRepository(),
    private readonly gestionUtilisateursService = new GestionUtilisateursService(),
  ) {}
  private ensureColumnsPromise = this.initialiserChampsSupplementaires();

  private resoudreChampOptionnel(
    donnees: ProfilCandidatDto,
    cle: "cv_url" | "carte_handicap_url" | "video_cv_url" | "photo_profil_url",
    valeurExistante?: string | null
  ) {
    if (Object.prototype.hasOwnProperty.call(donnees, cle)) {
      return donnees[cle] ?? "";
    }

    return valeurExistante ?? "";
  }

  private async initialiserChampsSupplementaires() {
    // Ajoute les colonnes manquantes pour les nouveaux besoins candidat
    try {
      await db.execute(sql`ALTER TABLE candidat ADD COLUMN IF NOT EXISTS preferences_accessibilite JSON;`);
      await db.execute(sql`ALTER TABLE candidat ADD COLUMN IF NOT EXISTS visibilite JSON;`);
      await db.execute(sql`ALTER TABLE candidat ADD COLUMN IF NOT EXISTS carte_handicap_url TEXT;`);
      await db.execute(sql`ALTER TABLE candidat ADD COLUMN IF NOT EXISTS video_cv_url TEXT;`);
      await db.execute(sql`ALTER TABLE candidat ADD COLUMN IF NOT EXISTS photo_profil_url TEXT;`);
      await db.execute(sql`ALTER TABLE entreprise ADD COLUMN IF NOT EXISTS subscription_pack TEXT;`);
      await db.execute(sql`ALTER TABLE entreprise ADD COLUMN IF NOT EXISTS subscription_status TEXT;`);
      await db.execute(sql`ALTER TABLE entreprise ADD COLUMN IF NOT EXISTS subscription_price_tnd INTEGER;`);
      await db.execute(sql`ALTER TABLE entreprise ADD COLUMN IF NOT EXISTS subscription_cycle TEXT;`);
      await db.execute(sql`ALTER TABLE entreprise ADD COLUMN IF NOT EXISTS subscribed_at TIMESTAMP;`);
      await db.execute(sql`ALTER TABLE entreprise ADD COLUMN IF NOT EXISTS logo_url TEXT;`);
    } catch {
      // silencieux si déjà présentes ou en environnement restreint
    }
  }

  private getPackCatalog() {
    return {
      essential: {
        code: "essential",
        name: "Pack 1 - Essential",
        price_tnd: 4000,
        cycle: "yearly",
        features: [
          "Unlimited access to validated candidates",
          "Video CV viewing",
          "Direct contact via HandiTalents messaging",
          "Interview scheduling via the platform",
          "Conducting online interviews",
          "Up to 8 positions job posting publication",
          "Sharing job offers on HandiSuccess & HandiTalents social media",
          "Sharing job offers with ANETI",
          "Interview preparation training via ANETI",
        ],
      },
      advanced: {
        code: "advanced",
        name: "Pack 2 - Advanced Recruitment",
        price_tnd: 7000,
        cycle: "yearly",
        features: [
          "Unlimited access to validated candidates",
          "Video CV viewing",
          "Direct contact via HandiTalents messaging",
          "Interview scheduling via the platform",
          "Conducting online interviews",
          "Up to 18 positions job posting publication",
          "Sharing job offers on HandiSuccess & HandiTalents social media",
          "Sharing job offers with ANETI",
          "Interview preparation training via ANETI",
          "Automatic candidate shortlisting",
          "Job posting publication report",
          "Compliance report with Law No. 41 of 2016",
        ],
      },
      compliance: {
        code: "compliance",
        name: "Pack 3 - Compliance Inclusion",
        price_tnd: 12000,
        cycle: "yearly",
        features: [
          "Unlimited access to validated candidates",
          "Video CV viewing",
          "Direct contact via HandiTalents messaging",
          "Interview scheduling via the platform",
          "Conducting online interviews",
          "Job posting publication",
          "Sharing job offers on HandiSuccess & HandiTalents social media",
          "Sharing job offers with ANETI",
          "Interview preparation training via ANETI",
          "Smart candidate shortlisting",
          "Job posting publication report",
          "Compliance report with Law No. 41 of 2016",
          "Support in defining and adjusting job offers",
          "Legal assistance for compliance with Law No. 41 of 2016",
          "Account management and application compliance support",
        ],
      },
    } as const;
  }

  // Candidat
  async obtenirProfilCandidat(id_utilisateur: string): Promise<ReponseProfilDto> {
    await this.ensureColumnsPromise;
    const profil = await this.profilRepository.obtenirProfilCandidat(id_utilisateur);

    if (!profil || !profil.utilisateur) {
      throw new ErreurApi("Profil candidat non trouvé.", 404);
    }

    if (profil.utilisateur.role !== RoleUtilisateur.CANDIDAT) {
      throw new ErreurApi("L'utilisateur n'est pas un candidat.", 403);
    }

    const donnees = {
      nom: profil.utilisateur.nom,
      email: profil.utilisateur.email,
      telephone: profil.utilisateur.telephone,
      addresse: profil.utilisateur.addresse,
      competences: profil.candidat?.competences || [],
      experience: profil.candidat?.experience || "",
      formation: profil.candidat?.formation || "",
      handicap: profil.candidat?.handicap || profil.candidat?.type_handicap || "",
      disponibilite: profil.candidat?.disponibilite || "",
      salaire_souhaite: profil.candidat?.salaire_souhaite || "",
      cv_url: profil.candidat?.cv_url || "",
      preferences_accessibilite: profil.candidat?.preferences_accessibilite || [],
      visibilite: profil.candidat?.visibilite || {},
      carte_handicap_url: profil.candidat?.carte_handicap_url || "",
      video_cv_url: profil.candidat?.video_cv_url || "",
      photo_profil_url: profil.candidat?.photo_profil_url || "",
      // Données existantes
      type_handicap: profil.candidat?.type_handicap,
      niveau_academique: profil.candidat?.niveau_academique,
      description: profil.candidat?.description,
      secteur: profil.candidat?.secteur,
      age: profil.candidat?.age,
    };

    return {
      message: "Profil récupéré avec succès",
      donnees,
    };
  }

  async mettreAJourProfilCandidat(id_utilisateur: string, donnees: ProfilCandidatDto): Promise<ReponseProfilDto> {
    await this.ensureColumnsPromise;
    const profilExistant = await this.profilRepository.obtenirProfilCandidat(id_utilisateur);

    if (!profilExistant || !profilExistant.utilisateur) {
      throw new ErreurApi("Profil candidat non trouvé.", 404);
    }

    if (profilExistant.utilisateur.role !== RoleUtilisateur.CANDIDAT) {
      throw new ErreurApi("L'utilisateur n'est pas un candidat.", 403);
    }

    const donneesUtilisateur = {
      nom: donnees.nom,
      telephone: donnees.telephone,
      addresse: donnees.addresse,
    };

    const donneesCandidat = {
      competences: donnees.competences,
      experience: donnees.experience,
      formation: donnees.formation,
      handicap: donnees.handicap,
      disponibilite: donnees.disponibilite,
      salaire_souhaite: donnees.salaire_souhaite,
      preferences_accessibilite: donnees.preferences_accessibilite,
      visibilite: donnees.visibilite,
      cv_url: this.resoudreChampOptionnel(donnees, "cv_url", profilExistant.candidat?.cv_url),
      carte_handicap_url: this.resoudreChampOptionnel(donnees, "carte_handicap_url", profilExistant.candidat?.carte_handicap_url),
      video_cv_url: this.resoudreChampOptionnel(donnees, "video_cv_url", profilExistant.candidat?.video_cv_url),
      photo_profil_url: this.resoudreChampOptionnel(donnees, "photo_profil_url", profilExistant.candidat?.photo_profil_url),
      // Conserver les données existantes si non fournies
      type_handicap: donnees.type_handicap ?? profilExistant.candidat?.type_handicap,
      niveau_academique: donnees.niveau_academique ?? profilExistant.candidat?.niveau_academique,
      description: donnees.description ?? profilExistant.candidat?.description,
      secteur: donnees.secteur ?? profilExistant.candidat?.secteur,
      age: donnees.age ?? profilExistant.candidat?.age,
    };

    const resultat = await this.profilRepository.mettreAJourProfilCandidat(
      id_utilisateur,
      donneesUtilisateur,
      donneesCandidat
    );

    return {
      message: "Profil mis à jour avec succès",
      donnees: {
        id_utilisateur: resultat.utilisateur?.id_utilisateur,
        nom: resultat.utilisateur?.nom,
        email: resultat.utilisateur?.email,
      },
    };
  }

  // Entreprise
  async obtenirProfilEntreprise(id_utilisateur: string): Promise<ReponseProfilDto> {
    await this.ensureColumnsPromise;
    const profil = await this.profilRepository.obtenirProfilEntreprise(id_utilisateur);

    if (!profil || !profil.utilisateur) {
      throw new ErreurApi("Profil entreprise non trouvé.", 404);
    }

    if (profil.utilisateur.role !== RoleUtilisateur.ENTREPRISE) {
      throw new ErreurApi("L'utilisateur n'est pas une entreprise.", 403);
    }

    const donnees = {
      nom: profil.utilisateur.nom,
      email: profil.utilisateur.email,
      telephone: profil.utilisateur.telephone,
      addresse: profil.utilisateur.addresse,
      region: profil.utilisateur.region,
      gouvernorat: profil.utilisateur.gouvernorat,
      delegation: profil.utilisateur.delegation,
      nom_entreprise: profil.entreprise?.nom_entreprise || "",
      patente: profil.entreprise?.patente || "",
      rne: profil.entreprise?.rne || "",
      profil_publique: profil.entreprise?.profil_publique || false,
      date_fondation: profil.entreprise?.date_fondation?.toISOString?.() || "",
      secteur_activite: profil.entreprise?.secteur_activite || "",
      taille_entreprise: profil.entreprise?.taille_entreprise || "",
      siret: profil.entreprise?.siret || profil.entreprise?.rne || "",
      site_web: profil.entreprise?.site_web || profil.entreprise?.url_site || "",
      description: profil.entreprise?.description || "",
      nbr_employe: profil.entreprise?.nbr_employe ?? 0,
      nbr_employe_handicape: profil.entreprise?.nbr_employe_handicape ?? 0,
      politique_handicap: profil.entreprise?.politique_handicap || "",
      contact_rh_nom: profil.entreprise?.contact_rh_nom || "",
      contact_rh_email: profil.entreprise?.contact_rh_email || "",
      contact_rh_telephone: profil.entreprise?.contact_rh_telephone || "",
      logo_url: profil.entreprise?.logo_url || "",
      subscription_pack: profil.entreprise?.subscription_pack || "",
      subscription_status: profil.entreprise?.subscription_status || "inactive",
      subscription_price_tnd: profil.entreprise?.subscription_price_tnd || 0,
      subscription_cycle: profil.entreprise?.subscription_cycle || "yearly",
      subscribed_at: profil.entreprise?.subscribed_at || null,
      available_packs: Object.values(this.getPackCatalog()),
    };

    return {
      message: "Profil récupéré avec succès",
      donnees,
    };
  }

  async mettreAJourProfilEntreprise(id_utilisateur: string, donnees: ProfilEntrepriseDto): Promise<ReponseProfilDto> {
    await this.ensureColumnsPromise;
    const profilExistant = await this.profilRepository.obtenirProfilEntreprise(id_utilisateur);

    if (!profilExistant || !profilExistant.utilisateur) {
      throw new ErreurApi("Profil entreprise non trouvé.", 404);
    }

    if (profilExistant.utilisateur.role !== RoleUtilisateur.ENTREPRISE) {
      throw new ErreurApi("L'utilisateur n'est pas une entreprise.", 403);
    }

    const donneesUtilisateur = {
      nom: donnees.nom,
      telephone: donnees.telephone,
      addresse: donnees.addresse,
    };

    const donneesEntreprise = {
      secteur_activite: donnees.secteur_activite,
      taille_entreprise: donnees.taille_entreprise,
      siret: donnees.siret,
      site_web: donnees.site_web,
      politique_handicap: donnees.politique_handicap,
      contact_rh_nom: donnees.contact_rh_nom,
      contact_rh_email: donnees.contact_rh_email,
      contact_rh_telephone: donnees.contact_rh_telephone,
      logo_url: donnees.logo_url ?? profilExistant.entreprise?.logo_url,
      subscription_pack: donnees.subscription_pack ?? profilExistant.entreprise?.subscription_pack,
      subscription_status: donnees.subscription_status ?? profilExistant.entreprise?.subscription_status,
      subscription_price_tnd: donnees.subscription_price_tnd ?? profilExistant.entreprise?.subscription_price_tnd,
      subscription_cycle: donnees.subscription_cycle ?? profilExistant.entreprise?.subscription_cycle,
      subscribed_at: donnees.subscribed_at ? new Date(donnees.subscribed_at) : profilExistant.entreprise?.subscribed_at,
      // Conserver les données existantes si non fournies
      nom_entreprise: donnees.nom_entreprise || profilExistant.entreprise?.nom_entreprise,
      description: donnees.description || profilExistant.entreprise?.description,
    };

    const resultat = await this.profilRepository.mettreAJourProfilEntreprise(
      id_utilisateur,
      donneesUtilisateur,
      donneesEntreprise
    );

    return {
      message: "Profil mis à jour avec succès",
      donnees: {
        id_utilisateur: resultat.utilisateur?.id_utilisateur,
        nom: resultat.utilisateur?.nom,
        email: resultat.utilisateur?.email,
      },
    };
  }

  async obtenirEntrepriseAdmin(id_utilisateur: string): Promise<ReponseProfilDto> {
    return await this.obtenirProfilEntreprise(id_utilisateur);
  }

  async creerEntrepriseAdmin(adminId: string, donnees: ProfilEntrepriseDto): Promise<ReponseProfilDto> {
    await this.ensureColumnsPromise;

    if (!donnees.nom_entreprise?.trim()) {
      throw new ErreurApi("Le nom de l'entreprise est requis.", 400);
    }
    if (!donnees.patente?.trim()) {
      throw new ErreurApi("La patente est requise.", 400);
    }
    if (!donnees.rne?.trim()) {
      throw new ErreurApi("Le RNE est requis.", 400);
    }
    if (!donnees.date_fondation) {
      throw new ErreurApi("La date de fondation est requise.", 400);
    }
    if (!donnees.description?.trim()) {
      throw new ErreurApi("La description est requise.", 400);
    }

    const compte = await this.gestionUtilisateursService.creerUtilisateur(
      {
        nom: donnees.nom,
        email: donnees.email,
        role: RoleUtilisateur.ENTREPRISE,
        statut: "actif",
        telephone: donnees.telephone,
        addresse: donnees.addresse,
        region: donnees.delegation ?? donnees.region,
        gouvernorat: donnees.gouvernorat ?? donnees.region,
        delegation: donnees.delegation ?? donnees.region,
      },
      adminId,
    );

    const id_utilisateur = compte.donnees?.id_utilisateur;
    if (!id_utilisateur) {
      throw new ErreurApi("Impossible de creer le compte entreprise.", 500);
    }

    const entreprise = await this.profilRepository.creerProfilEntreprise(id_utilisateur, {
      nom_entreprise: donnees.nom_entreprise.trim(),
      patente: donnees.patente.trim(),
      rne: donnees.rne.trim(),
      date_fondation: new Date(donnees.date_fondation),
      description: donnees.description.trim(),
      nbr_employe: donnees.nbr_employe ?? 1,
      nbr_employe_handicape: donnees.nbr_employe_handicape ?? 0,
      profil_publique: donnees.profil_publique ?? false,
      secteur_activite: donnees.secteur_activite ?? null,
      taille_entreprise: donnees.taille_entreprise ?? null,
      siret: donnees.siret ?? null,
      site_web: donnees.site_web ?? donnees.url_site ?? null,
      url_site: donnees.site_web ?? donnees.url_site ?? null,
      politique_handicap: donnees.politique_handicap ?? null,
      contact_rh_nom: donnees.contact_rh_nom ?? null,
      contact_rh_email: donnees.contact_rh_email ?? null,
      contact_rh_telephone: donnees.contact_rh_telephone ?? null,
      logo_url: donnees.logo_url ?? null,
      subscription_pack: donnees.subscription_pack ?? null,
      subscription_status: donnees.subscription_status ?? null,
      subscription_price_tnd: donnees.subscription_price_tnd ?? null,
      subscription_cycle: donnees.subscription_cycle ?? null,
      subscribed_at: donnees.subscribed_at ? new Date(donnees.subscribed_at) : null,
    });

    return {
      message: "Entreprise creee avec succes",
      donnees: {
        utilisateur: compte.donnees,
        entreprise,
      },
    };
  }

  async mettreAJourEntrepriseAdmin(id_utilisateur: string, donnees: ProfilEntrepriseDto): Promise<ReponseProfilDto> {
    await this.ensureColumnsPromise;
    const profilExistant = await this.profilRepository.obtenirProfilEntreprise(id_utilisateur);

    if (!profilExistant || !profilExistant.utilisateur) {
      throw new ErreurApi("Profil entreprise non trouvé.", 404);
    }

    if (profilExistant.utilisateur.role !== RoleUtilisateur.ENTREPRISE) {
      throw new ErreurApi("L'utilisateur n'est pas une entreprise.", 403);
    }

    const resultat = await this.profilRepository.mettreAJourProfilEntreprise(
      id_utilisateur,
      {
        nom: donnees.nom,
        telephone: donnees.telephone,
        addresse: donnees.addresse,
      },
      {
        nom_entreprise: donnees.nom_entreprise?.trim() || profilExistant.entreprise?.nom_entreprise,
        secteur_activite: donnees.secteur_activite ?? profilExistant.entreprise?.secteur_activite,
        taille_entreprise: donnees.taille_entreprise ?? profilExistant.entreprise?.taille_entreprise,
        siret: donnees.siret ?? profilExistant.entreprise?.siret,
        site_web: donnees.site_web ?? donnees.url_site ?? profilExistant.entreprise?.site_web ?? profilExistant.entreprise?.url_site ?? null,
        url_site: donnees.site_web ?? donnees.url_site ?? profilExistant.entreprise?.site_web ?? profilExistant.entreprise?.url_site ?? null,
        politique_handicap: donnees.politique_handicap ?? profilExistant.entreprise?.politique_handicap,
        contact_rh_nom: donnees.contact_rh_nom ?? profilExistant.entreprise?.contact_rh_nom,
        contact_rh_email: donnees.contact_rh_email ?? profilExistant.entreprise?.contact_rh_email,
        contact_rh_telephone: donnees.contact_rh_telephone ?? profilExistant.entreprise?.contact_rh_telephone,
        logo_url: donnees.logo_url ?? profilExistant.entreprise?.logo_url,
        subscription_pack: donnees.subscription_pack ?? profilExistant.entreprise?.subscription_pack,
        subscription_status: donnees.subscription_status ?? profilExistant.entreprise?.subscription_status,
        subscription_price_tnd: donnees.subscription_price_tnd ?? profilExistant.entreprise?.subscription_price_tnd,
        subscription_cycle: donnees.subscription_cycle ?? profilExistant.entreprise?.subscription_cycle,
        subscribed_at: donnees.subscribed_at ? new Date(donnees.subscribed_at) : profilExistant.entreprise?.subscribed_at,
        patente: donnees.patente ?? profilExistant.entreprise?.patente,
        rne: donnees.rne ?? profilExistant.entreprise?.rne,
        date_fondation: donnees.date_fondation ? new Date(donnees.date_fondation) : profilExistant.entreprise?.date_fondation,
        description: donnees.description ?? profilExistant.entreprise?.description,
        nbr_employe: donnees.nbr_employe ?? profilExistant.entreprise?.nbr_employe,
        nbr_employe_handicape: donnees.nbr_employe_handicape ?? profilExistant.entreprise?.nbr_employe_handicape,
        profil_publique: donnees.profil_publique ?? profilExistant.entreprise?.profil_publique,
      }
    );

    return {
      message: "Entreprise mise a jour avec succes",
      donnees: resultat,
    };
  }

  async mettreAJourDocumentsEntreprise(
    id_utilisateur: string,
    fichiers: { patente?: string; rne?: string; logo_url?: string | null }
  ): Promise<ReponseProfilDto> {
    const profilExistant = await this.profilRepository.obtenirProfilEntreprise(id_utilisateur);

    if (!profilExistant || !profilExistant.utilisateur) {
      throw new ErreurApi("Profil entreprise non trouvé.", 404);
    }

    if (profilExistant.utilisateur.role !== RoleUtilisateur.ENTREPRISE) {
      throw new ErreurApi("L'utilisateur n'est pas une entreprise.", 403);
    }

    const donneesEntreprise: any = {};
    if (fichiers.patente) donneesEntreprise.patente = fichiers.patente;
    if (fichiers.rne) donneesEntreprise.rne = fichiers.rne;
    if (Object.prototype.hasOwnProperty.call(fichiers, "logo_url")) {
      donneesEntreprise.logo_url = fichiers.logo_url ?? "";
    }

    if (Object.keys(donneesEntreprise).length === 0) {
      throw new ErreurApi("Aucun fichier fourni.", 400);
    }

    const resultat = await this.profilRepository.mettreAJourProfilEntreprise(
      id_utilisateur,
      {},
      donneesEntreprise
    );

    return {
      message: "Documents mis à jour avec succès",
      donnees: resultat.entreprise,
    };
  }

  async choisirPackEntreprise(id_utilisateur: string, donnees: ChoixPackEntrepriseDto): Promise<ReponseProfilDto> {
    await this.ensureColumnsPromise;
    const profilExistant = await this.profilRepository.obtenirProfilEntreprise(id_utilisateur);

    if (!profilExistant || !profilExistant.utilisateur) {
      throw new ErreurApi("Profil entreprise non trouvÃ©.", 404);
    }

    if (profilExistant.utilisateur.role !== RoleUtilisateur.ENTREPRISE) {
      throw new ErreurApi("L'utilisateur n'est pas une entreprise.", 403);
    }

    const pack = this.getPackCatalog()[donnees.pack_code as keyof ReturnType<ProfilService["getPackCatalog"]>];
    if (!pack) {
      throw new ErreurApi("Pack d'abonnement invalide.", 400);
    }

    const resultat = await this.profilRepository.mettreAJourProfilEntreprise(id_utilisateur, {}, {
      subscription_pack: pack.code,
      subscription_status: "selected",
      subscription_price_tnd: pack.price_tnd,
      subscription_cycle: pack.cycle,
      subscribed_at: new Date(),
    });

    return {
      message: "Pack entreprise selectionne avec succes",
      donnees: {
        subscription_pack: resultat.entreprise?.subscription_pack,
        subscription_status: resultat.entreprise?.subscription_status,
        subscription_price_tnd: resultat.entreprise?.subscription_price_tnd,
        subscription_cycle: resultat.entreprise?.subscription_cycle,
        subscribed_at: resultat.entreprise?.subscribed_at,
        pack_details: pack,
      },
    };
  }

  // Admin
  async obtenirProfilAdmin(id_utilisateur: string): Promise<ReponseProfilDto> {
    const profil = await this.profilRepository.obtenirProfilAdmin(id_utilisateur);

    if (!profil || !profil.utilisateur) {
      throw new ErreurApi("Profil admin non trouvé.", 404);
    }

    if (profil.utilisateur.role !== RoleUtilisateur.ADMIN) {
      throw new ErreurApi("L'utilisateur n'est pas un administrateur.", 403);
    }

    const donnees = {
      nom: profil.utilisateur.nom,
      email: profil.utilisateur.email,
      telephone: profil.utilisateur.telephone,
      addresse: profil.utilisateur.addresse,
      poste: profil.admin?.poste || "",
      departement: profil.admin?.departement || "",
      date_embauche: profil.admin?.date_embauche?.toString() || "",
      permissions: profil.admin?.permissions || ["Gestion des utilisateurs", "Validation des comptes"],
      notifications_email: profil.admin?.notifications_email ?? true,
      notifications_sms: profil.admin?.notifications_sms ?? false,
    };

    return {
      message: "Profil récupéré avec succès",
      donnees,
    };
  }

  async mettreAJourProfilAdmin(id_utilisateur: string, donnees: ProfilAdminDto): Promise<ReponseProfilDto> {
    const profilExistant = await this.profilRepository.obtenirProfilAdmin(id_utilisateur);

    if (!profilExistant || !profilExistant.utilisateur) {
      throw new ErreurApi("Profil admin non trouvé.", 404);
    }

    if (profilExistant.utilisateur.role !== RoleUtilisateur.ADMIN) {
      throw new ErreurApi("L'utilisateur n'est pas un administrateur.", 403);
    }

    const donneesUtilisateur = {
      nom: donnees.nom,
      telephone: donnees.telephone,
      addresse: donnees.addresse,
    };

    const donneesAdmin = {
      poste: donnees.poste,
      departement: donnees.departement,
      date_embauche: donnees.date_embauche ? new Date(donnees.date_embauche) : null,
      permissions: donnees.permissions,
      notifications_email: donnees.notifications_email,
      notifications_sms: donnees.notifications_sms,
    };

    const resultat = await this.profilRepository.mettreAJourProfilAdmin(
      id_utilisateur,
      donneesUtilisateur,
      donneesAdmin
    );

    return {
      message: "Profil mis à jour avec succès",
      donnees: {
        id_utilisateur: resultat.utilisateur?.id_utilisateur,
        nom: resultat.utilisateur?.nom,
        email: resultat.utilisateur?.email,
      },
    };
  }
}
