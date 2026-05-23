const { Client } = require("pg");
require("dotenv").config();

const ENTREPRISES_TN = [
  {
    nom: "Telnet Tunisie",
    email: "rh.telnet@handitalents.tn",
    telephone: "+21671111222",
    addresse: "Centre Urbain Nord, Tunis",
    region: "Tunis",
    secteur_activite: "Ingenierie et logiciels",
  },
  {
    nom: "Vermeg Tunisie",
    email: "rh.vermeg@handitalents.tn",
    telephone: "+21671111333",
    addresse: "Lac 1, Tunis",
    region: "Tunis",
    secteur_activite: "Fintech",
  },
  {
    nom: "OneTech Group",
    email: "rh.onetech@handitalents.tn",
    telephone: "+21673333444",
    addresse: "Sousse Technopole, Sousse",
    region: "Sousse",
    secteur_activite: "Industrie et electronique",
  },
  {
    nom: "Sagemcom Tunisie",
    email: "rh.sagemcom@handitalents.tn",
    telephone: "+21671777555",
    addresse: "Ben Arous",
    region: "Ben Arous",
    secteur_activite: "Telecom et hardware",
  },
];

const CANDIDATS_TN = [
  {
    nom: "Yassine Trabelsi",
    email: "yassine.trabelsi@handitalents.tn",
    telephone: "+21622111222",
    addresse: "Ariana Ville",
    region: "Ariana",
    age: 27,
    secteur: "Informatique",
    niveau_academique: "Bac+3",
    description: "Developpeur web motive et rigoureux.",
  },
  {
    nom: "Meriem Gharbi",
    email: "meriem.gharbi@handitalents.tn",
    telephone: "+21655111333",
    addresse: "Sfax Centre",
    region: "Sfax",
    age: 29,
    secteur: "Support client",
    niveau_academique: "Bac+2",
    description: "Experience solide en relation client.",
  },
  {
    nom: "Walid Ben Salem",
    email: "walid.bensalem@handitalents.tn",
    telephone: "+21698111444",
    addresse: "Kairouan",
    region: "Kairouan",
    age: 31,
    secteur: "Reseaux",
    niveau_academique: "Bac+3",
    description: "Technicien reseau certifie CCNA.",
  },
  {
    nom: "Asma Bouazizi",
    email: "asma.bouazizi@handitalents.tn",
    telephone: "+21620111555",
    addresse: "Monastir",
    region: "Monastir",
    age: 26,
    secteur: "Ressources humaines",
    niveau_academique: "Bac+3",
    description: "Assistante RH orientee accompagnement humain.",
  },
];

const JOB_TEMPLATES = [
  {
    titre: "Developpeur Frontend React",
    description:
      "Concevoir et maintenir des interfaces accessibles avec React et TypeScript pour des produits numeriques deployes en Tunisie.",
    localisation: "Tunis, Centre Urbain Nord",
    type_poste: "cdi",
    salaire_min: "2200 DT",
    salaire_max: "3200 DT",
    competences_requises: "React, TypeScript, Tailwind, accessibilite web",
    experience_requise: "2 ans",
    niveau_etude: "Bac+3",
    amenagements_possibles:
      "Horaires flexibles, poste adapte, outil de synthese vocale",
  },
  {
    titre: "Charge(e) Support Client Bilingue",
    description:
      "Accompagner les clients tunisiens et francophones par email et telephone. Suivre les tickets et proposer des solutions claires.",
    localisation: "Sfax, Route de Tunis",
    type_poste: "temps_plein",
    salaire_min: "1300 DT",
    salaire_max: "1800 DT",
    competences_requises: "Communication, CRM, Francais, Anglais",
    experience_requise: "1 an",
    niveau_etude: "Bac+2",
    amenagements_possibles:
      "Teletravail partiel, casque antibruit, adaptation poste de travail",
  },
  {
    titre: "Analyste Donnees Junior",
    description:
      "Produire des tableaux de bord et analyses business. Nettoyage des donnees et preparation de rapports pour les equipes metier.",
    localisation: "Ariana, Ennasr",
    type_poste: "cdd",
    salaire_min: "1800 DT",
    salaire_max: "2500 DT",
    competences_requises: "SQL, Excel, Power BI, esprit analytique",
    experience_requise: "1 a 2 ans",
    niveau_etude: "Bac+3",
    amenagements_possibles: "Materiel ergonomique, teletravail hybride",
  },
  {
    titre: "Designer UI/UX",
    description:
      "Concevoir des parcours utilisateurs inclusifs et prototyper des ecrans web/mobile. Tester les interfaces avec les utilisateurs.",
    localisation: "Tunis, Lac 2",
    type_poste: "cdi",
    salaire_min: "2100 DT",
    salaire_max: "3000 DT",
    competences_requises: "Figma, UX Research, Design System",
    experience_requise: "2 ans",
    niveau_etude: "Bac+3",
    amenagements_possibles:
      "Poste assis-debout, horaires amenages, outils collaboratifs adaptes",
  },
  {
    titre: "Technicien Reseau",
    description:
      "Installer et maintenir les equipements reseau. Assurer la supervision et le traitement des incidents N1/N2.",
    localisation: "Sousse, Khzema",
    type_poste: "temps_plein",
    salaire_min: "1600 DT",
    salaire_max: "2300 DT",
    competences_requises: "TCP/IP, Cisco, supervision, diagnostic",
    experience_requise: "2 ans",
    niveau_etude: "Bac+2",
    amenagements_possibles:
      "Aides techniques visuelles, procedure detaillee, binome terrain",
  },
  {
    titre: "Assistant(e) RH",
    description:
      "Participer au recrutement, suivi administratif et integration des nouveaux collaborateurs.",
    localisation: "Monastir, Zone industrielle",
    type_poste: "cdd",
    salaire_min: "1200 DT",
    salaire_max: "1700 DT",
    competences_requises: "Organisation, communication, Excel",
    experience_requise: "1 an",
    niveau_etude: "Bac+2",
    amenagements_possibles: "Temps partiel possible, teletravail ponctuel",
  },
  {
    titre: "Developpeur Backend Node.js",
    description:
      "Developper des APIs REST robustes, gerer la securite et optimiser les performances SQL.",
    localisation: "Ben Arous, Megrine",
    type_poste: "cdi",
    salaire_min: "2500 DT",
    salaire_max: "3600 DT",
    competences_requises: "Node.js, PostgreSQL, API REST, Docker",
    experience_requise: "3 ans",
    niveau_etude: "Bac+5",
    amenagements_possibles:
      "Teletravail 2 jours/semaine, materiel adapte, formation continue",
  },
  {
    titre: "Agent Qualite Process",
    description:
      "Verifier la conformite des operations, documenter les ecarts et suivre les plans d action.",
    localisation: "Nabeul, Mrezga",
    type_poste: "temps_plein",
    salaire_min: "1400 DT",
    salaire_max: "2000 DT",
    competences_requises: "Qualite, ISO, rigueur, redaction",
    experience_requise: "1 a 3 ans",
    niveau_etude: "Bac+2",
    amenagements_possibles:
      "Processus simplifies, rythme adapte, support managerial renforce",
  },
];

const EXTRA_JOB_ROLES = [
  { titre: "Comptable Confirmé", type_poste: "cdi", secteur: "Finance" },
  { titre: "Commercial Terrain", type_poste: "temps_plein", secteur: "Vente" },
  { titre: "Technicien Maintenance Industrielle", type_poste: "cdi", secteur: "Industrie" },
  { titre: "Assistant(e) Administratif(ve)", type_poste: "cdd", secteur: "Administration" },
  { titre: "Operateur Saisie", type_poste: "temps_partiel", secteur: "Back-office" },
  { titre: "Data Entry Specialist", type_poste: "cdd", secteur: "Back-office" },
  { titre: "Community Manager", type_poste: "cdi", secteur: "Marketing" },
  { titre: "Testeur QA Logiciel", type_poste: "cdi", secteur: "Informatique" },
  { titre: "DevOps Junior", type_poste: "cdi", secteur: "Informatique" },
  { titre: "Technicien Helpdesk", type_poste: "temps_plein", secteur: "Support IT" },
  { titre: "Charge(e) de Recrutement", type_poste: "cdi", secteur: "Ressources humaines" },
  { titre: "Graphiste Digital", type_poste: "cdd", secteur: "Design" },
];

const EXTRA_LOCALISATIONS_TN = [
  "Tunis, Bab Bhar",
  "Tunis, Lac 1",
  "Ariana, Charguia",
  "Ben Arous, Rades",
  "Sousse, Zone touristique",
  "Sfax, Centre-ville",
  "Nabeul, Dar Chaabane",
  "Bizerte, Menzel Jemil",
  "Gabes, Chenini",
  "Kairouan, Cite El Khadhra",
];

const EXTRA_COMPETENCES = [
  "Communication, organisation, esprit d equipe",
  "Excel, gestion administrative, rigueur",
  "SQL, reporting, analyse de donnees",
  "Support client, CRM, resolution de problemes",
  "Maintenance, securite, respect des procedures",
  "Figma, design system, accessibilite numerique",
];

const EXTRA_AMENAGEMENTS = [
  "Horaires amenages, teletravail partiel, poste ergonomique",
  "Navigation clavier, synthese vocale, suivi RH dedie",
  "Temps de pause adapte, rampe d acces, accompagnement integration",
  "Materiel adapte, eclairage ajuste, mode contraste eleve",
];

function buildExtraJobs(count) {
  const rows = [];
  for (let i = 0; i < count; i += 1) {
    const role = EXTRA_JOB_ROLES[i % EXTRA_JOB_ROLES.length];
    const localisation = EXTRA_LOCALISATIONS_TN[i % EXTRA_LOCALISATIONS_TN.length];
    const competences = EXTRA_COMPETENCES[i % EXTRA_COMPETENCES.length];
    const amenagements = EXTRA_AMENAGEMENTS[i % EXTRA_AMENAGEMENTS.length];
    const min = 1100 + (i % 8) * 180;
    const max = min + 700 + (i % 5) * 150;

    rows.push({
      titre: `${role.titre} - Tunisien ${String(i + 1).padStart(2, "0")}`,
      description: `Poste ${role.titre.toLowerCase()} dans le secteur ${role.secteur} pour une entreprise en Tunisie. Environnement inclusif avec integration accompagnee.`,
      localisation,
      type_poste: role.type_poste,
      salaire_min: `${min} DT`,
      salaire_max: `${max} DT`,
      competences_requises: competences,
      experience_requise: `${1 + (i % 4)} ans`,
      niveau_etude: i % 3 === 0 ? "Bac+2" : "Bac+3",
      amenagements_possibles: amenagements,
    });
  }
  return rows;
}

function mergeById(primary, secondary) {
  const seen = new Set(primary.map((row) => row.id));
  const merged = [...primary];
  for (const row of secondary) {
    if (!seen.has(row.id)) {
      seen.add(row.id);
      merged.push(row);
    }
  }
  return merged;
}

const CANDIDATURE_STATUSES = [
  "shortlisted",
  "interview_scheduled",
  "pending",
  "accepted",
  "shortlisted",
  "interview_scheduled",
  "pending",
  "rejected",
];

const INTERVIEW_PLANS = [
  {
    type: "visio",
    statut: "confirme",
    daysFromNow: 2,
    hour: 10,
    duree_prevue: "45",
    lieu_visio: "Google Meet",
    notes: "Entretien technique Frontend + accessibilite.",
  },
  {
    type: "presentiel",
    statut: "planifie",
    daysFromNow: 4,
    hour: 14,
    duree_prevue: "60",
    lieu: "Siege social - Salle RH",
    notes: "Entretien RH et mise en situation.",
  },
  {
    type: "telephonique",
    statut: "reporte",
    daysFromNow: 6,
    hour: 11,
    duree_prevue: "30",
    notes: "Prequalification telephonique.",
  },
  {
    type: "visio",
    statut: "termine",
    daysFromNow: -3,
    hour: 9,
    duree_prevue: "50",
    lieu_visio: "Microsoft Teams",
    notes: "Entretien final termine, retour positif.",
  },
];

function dateAt(daysFromNow, hour) {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  d.setHours(hour, 0, 0, 0);
  return d;
}

async function ensureEntreprisesTn(client) {
  const rows = [];
  for (let i = 0; i < ENTREPRISES_TN.length; i += 1) {
    const e = ENTREPRISES_TN[i];
    const existingUser = await client.query(
      `select id_utilisateur from utilisateur where email = $1 limit 1`,
      [e.email],
    );

    let idUtilisateur;
    if (existingUser.rowCount > 0) {
      idUtilisateur = existingUser.rows[0].id_utilisateur;
      await client.query(
        `
          update utilisateur
          set nom = $2, telephone = $3, addresse = $4, region = $5, statut = 'actif', role = 'entreprise', updated_at = now()
          where id_utilisateur = $1
        `,
        [idUtilisateur, e.nom, e.telephone, e.addresse, e.region],
      );
    } else {
      const insertedUser = await client.query(
        `
          insert into utilisateur (nom, mdp, telephone, addresse, email, region, statut, role)
          values ($1, $2, $3, $4, $5, $6, 'actif', 'entreprise')
          returning id_utilisateur
        `,
        [e.nom, "$2b$10$FvQf7hvbMAnfI4k6S4VfR.TJQ4kJY6LC8fM0ExsK6I0v7D6pD4xQm", e.telephone, e.addresse, e.email, e.region],
      );
      idUtilisateur = insertedUser.rows[0].id_utilisateur;
    }

    const existingEntreprise = await client.query(
      `select id from entreprise where id_utilisateur = $1 limit 1`,
      [idUtilisateur],
    );

    let idEntreprise;
    if (existingEntreprise.rowCount > 0) {
      idEntreprise = existingEntreprise.rows[0].id;
      await client.query(
        `
          update entreprise
          set nom_entreprise = $2,
              description = $3,
              secteur_activite = $4,
              taille_entreprise = '200-500',
              site_web = coalesce(site_web, $5),
              statut_validation = 'valide',
              profil_publique = true,
              updated_at = now()
          where id = $1
        `,
        [
          idEntreprise,
          e.nom,
          `Entreprise tunisienne active dans le secteur ${e.secteur_activite}.`,
          e.secteur_activite,
          `https://${e.nom.toLowerCase().replace(/\s+/g, "")}.tn`,
        ],
      );
    } else {
      const insertedEntreprise = await client.query(
        `
          insert into entreprise (
            id_utilisateur, nom_entreprise, patente, rne, statut_validation, profil_publique,
            date_fondation, description, nbr_employe, nbr_employe_handicape,
            secteur_activite, taille_entreprise, site_web, politique_handicap,
            contact_rh_nom, contact_rh_email, contact_rh_telephone
          ) values (
            $1, $2, $3, $4, 'valide', true,
            $5, $6, $7, $8,
            $9, '200-500', $10, $11,
            $12, $13, $14
          )
          returning id
        `,
        [
          idUtilisateur,
          e.nom,
          `PAT-TN-${10000 + i}`,
          `RNE-TN-${900000 + i}`,
          dateAt(-(3650 + i * 200), 9),
          `Entreprise tunisienne active dans le secteur ${e.secteur_activite}.`,
          320 + i * 45,
          15 + i * 3,
          e.secteur_activite,
          `https://${e.nom.toLowerCase().replace(/\s+/g, "")}.tn`,
          "Programme inclusion active et amenagement raisonnable des postes.",
          `Responsable RH ${e.nom}`,
          e.email,
          e.telephone,
        ],
      );
      idEntreprise = insertedEntreprise.rows[0].id;
    }

    rows.push({ id: idEntreprise, nom_entreprise: e.nom, email: e.email });
  }
  return rows;
}

async function ensureCandidatsTn(client) {
  const rows = [];
  for (let i = 0; i < CANDIDATS_TN.length; i += 1) {
    const c = CANDIDATS_TN[i];
    const existingUser = await client.query(
      `select id_utilisateur from utilisateur where email = $1 limit 1`,
      [c.email],
    );

    let idUtilisateur;
    if (existingUser.rowCount > 0) {
      idUtilisateur = existingUser.rows[0].id_utilisateur;
      await client.query(
        `
          update utilisateur
          set nom = $2, telephone = $3, addresse = $4, region = $5, statut = 'actif', role = 'candidat', updated_at = now()
          where id_utilisateur = $1
        `,
        [idUtilisateur, c.nom, c.telephone, c.addresse, c.region],
      );
    } else {
      const insertedUser = await client.query(
        `
          insert into utilisateur (nom, mdp, telephone, addresse, email, region, statut, role)
          values ($1, $2, $3, $4, $5, $6, 'actif', 'candidat')
          returning id_utilisateur
        `,
        [c.nom, "$2b$10$FvQf7hvbMAnfI4k6S4VfR.TJQ4kJY6LC8fM0ExsK6I0v7D6pD4xQm", c.telephone, c.addresse, c.email, c.region],
      );
      idUtilisateur = insertedUser.rows[0].id_utilisateur;
    }

    const existingCandidat = await client.query(
      `select id from candidat where id_utilisateur = $1 limit 1`,
      [idUtilisateur],
    );
    let idCandidat;
    if (existingCandidat.rowCount > 0) {
      idCandidat = existingCandidat.rows[0].id;
      await client.query(
        `
          update candidat
          set niveau_academique = $2,
              description = $3,
              secteur = $4,
              age = $5,
              updated_at = now()
          where id = $1
        `,
        [idCandidat, c.niveau_academique, c.description, c.secteur, c.age],
      );
    } else {
      const insertedCandidat = await client.query(
        `
          insert into candidat (
            id_utilisateur, type_handicap, num_carte_handicap, date_expiration_carte_handicap,
            niveau_academique, description, secteur, type_licence, preference_communication, age,
            competences, experience, disponibilite, salaire_souhaite, preferences_accessibilite
          ) values (
            $1, $2, $3, $4,
            $5, $6, $7, $8, $9, $10,
            $11::json, $12, $13, $14, $15::json
          )
          returning id
        `,
        [
          idUtilisateur,
          "moteur",
          `CH-TN-${7000 + i}`,
          dateAt(500 + i * 50, 9),
          c.niveau_academique,
          c.description,
          c.secteur,
          "B",
          "email",
          c.age,
          JSON.stringify(["communication", "adaptabilite", "travail-equipe"]),
          "2 a 4 ans d experience professionnelle",
          "Immediate",
          "1800-2600 DT",
          JSON.stringify(["navigation-clavier", "contraste-eleve"]),
        ],
      );
      idCandidat = insertedCandidat.rows[0].id;
    }

    rows.push({ id: idCandidat, nom: c.nom, email: c.email });
  }
  return rows;
}

async function getActifs(client) {
  const entreprises = await client.query(`
    select e.id, e.nom_entreprise, u.email
    from entreprise e
    join utilisateur u on u.id_utilisateur = e.id_utilisateur
    where u.role = 'entreprise' and u.statut in ('actif', 'approuve')
    order by e.created_at asc
  `);

  const candidats = await client.query(`
    select c.id, u.nom, u.email
    from candidat c
    join utilisateur u on u.id_utilisateur = c.id_utilisateur
    where u.role = 'candidat' and u.statut in ('actif', 'approuve')
    order by c.created_at asc
  `);

  return { entreprises: entreprises.rows, candidats: candidats.rows };
}

async function upsertOffre(client, entrepriseId, t, i) {
  const existing = await client.query(
    `
      select id
      from offre_emploi
      where id_entreprise = $1 and titre = $2 and localisation = $3
      limit 1
    `,
    [entrepriseId, t.titre, t.localisation],
  );

  if (existing.rowCount > 0) return existing.rows[0].id;

  const inserted = await client.query(
    `
      insert into offre_emploi (
        id_entreprise, titre, description, localisation, type_poste,
        salaire_min, salaire_max, competences_requises, experience_requise,
        niveau_etude, statut, date_limite, accessibilite_handicap, amenagements_possibles
      ) values (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9,
        $10, 'active', $11, true, $12
      )
      returning id
    `,
    [
      entrepriseId,
      t.titre,
      t.description,
      t.localisation,
      t.type_poste,
      t.salaire_min,
      t.salaire_max,
      t.competences_requises,
      t.experience_requise,
      t.niveau_etude,
      dateAt(20 + i, 18),
      t.amenagements_possibles,
    ],
  );

  return inserted.rows[0].id;
}

async function upsertCandidature(client, candidatId, offreId, status, i) {
  const existing = await client.query(
    `
      select id
      from candidature
      where id_candidat = $1 and id_offre = $2
      limit 1
    `,
    [candidatId, offreId],
  );

  if (existing.rowCount > 0) {
    const id = existing.rows[0].id;
    await client.query(
      `
        update candidature
        set statut = $2,
            lettre_motivation = coalesce(lettre_motivation, $3),
            notes_entreprise = coalesce(notes_entreprise, $4),
            score_test = coalesce(score_test, $5),
            updated_at = now()
        where id = $1
      `,
      [
        id,
        status,
        "Je souhaite contribuer a une equipe inclusive et orientee impact.",
        "Profil pertinent pour le poste, bonne motivation.",
        70 + (i % 25),
      ],
    );
    return id;
  }

  const inserted = await client.query(
    `
      insert into candidature (
        id_candidat, id_offre, date_postulation, statut, lettre_motivation,
        notes_entreprise, score_test, cv_url
      ) values (
        $1, $2, $3, $4, $5,
        $6, $7, $8
      )
      returning id
    `,
    [
      candidatId,
      offreId,
      dateAt(-10 + i, 10),
      status,
      "Je souhaite contribuer a une equipe inclusive et orientee impact.",
      "Profil pertinent pour le poste, bonne motivation.",
      70 + (i % 25),
      "https://files.handitalents.tn/cv/candidat.pdf",
    ],
  );
  return inserted.rows[0].id;
}

async function upsertEntretien(client, candidatureId, planIndex, contactEntreprise) {
  const exists = await client.query(
    `
      select id
      from entretien
      where id_candidature = $1
      limit 1
    `,
    [candidatureId],
  );

  if (exists.rowCount > 0) return false;

  const plan = INTERVIEW_PLANS[planIndex % INTERVIEW_PLANS.length];
  await client.query(
    `
      insert into entretien (
        id_candidature, date_heure, type, lieu_visio, lieu, statut, notes, duree_prevue, contact_entreprise
      ) values (
        $1, $2, $3, $4, $5, $6, $7, $8, $9
      )
    `,
    [
      candidatureId,
      dateAt(plan.daysFromNow, plan.hour),
      plan.type,
      plan.lieu_visio || null,
      plan.lieu || null,
      plan.statut,
      plan.notes,
      plan.duree_prevue,
      contactEntreprise || "rh@entreprise.tn",
    ],
  );
  return true;
}

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  const entreprisesTn = await ensureEntreprisesTn(client);
  const candidatsTn = await ensureCandidatsTn(client);
  const { entreprises: entreprisesActives, candidats: candidatsActifs } = await getActifs(client);
  const entreprises = mergeById(entreprisesTn, entreprisesActives);
  const candidats = mergeById(candidatsTn, candidatsActifs);
  if (!entreprises.length || !candidats.length) {
    throw new Error(
      "Aucune entreprise/candidat actif trouve. Verifiez les comptes avant d executer le seed.",
    );
  }

  let offresInserees = 0;
  let candidaturesInserees = 0;
  let entretiensInseres = 0;
  const allJobs = [...JOB_TEMPLATES, ...buildExtraJobs(36)];

  const offreIds = [];
  const offreToEntrepriseEmail = new Map();
  for (let i = 0; i < allJobs.length; i += 1) {
    const entreprise = entreprises[i % entreprises.length];
    const job = allJobs[i];
    const before = await client.query(
      `
        select count(*)::int as n
        from offre_emploi
        where id_entreprise = $1 and titre = $2 and localisation = $3
      `,
      [entreprise.id, job.titre, job.localisation],
    );
    const id = await upsertOffre(client, entreprise.id, job, i);
    if (before.rows[0].n === 0) offresInserees += 1;
    offreIds.push(id);
    offreToEntrepriseEmail.set(id, entreprise.email || "rh@entreprise.tn");
  }

  const candidatureIds = [];
  for (let i = 0; i < offreIds.length; i += 1) {
    const candidat = candidats[i % candidats.length];
    const before = await client.query(
      `
        select count(*)::int as n
        from candidature
        where id_candidat = $1 and id_offre = $2
      `,
      [candidat.id, offreIds[i]],
    );
    const id = await upsertCandidature(
      client,
      candidat.id,
      offreIds[i],
      CANDIDATURE_STATUSES[i % CANDIDATURE_STATUSES.length],
      i,
    );
    if (before.rows[0].n === 0) candidaturesInserees += 1;
    candidatureIds.push(id);
  }

  for (let i = 0; i < candidatureIds.length; i += 1) {
    const shouldPlanInterview = i < Math.floor(candidatureIds.length * 0.55);
    if (!shouldPlanInterview) continue;
    const inserted = await upsertEntretien(
      client,
      candidatureIds[i],
      i,
      offreToEntrepriseEmail.get(offreIds[i]),
    );
    if (inserted) entretiensInseres += 1;
  }

  const totals = await client.query(`
    select
      (select count(*) from offre_emploi) as total_offres,
      (select count(*) from candidature) as total_candidatures,
      (select count(*) from entretien) as total_entretiens
  `);

  console.log("Seed termine.");
  console.log(
    JSON.stringify(
      {
        offresInserees,
        candidaturesInserees,
        entretiensInseres,
        totals: totals.rows[0],
      },
      null,
      2,
    ),
  );

  await client.end();
}

main().catch((error) => {
  console.error("Echec du seed:", error.message);
  process.exit(1);
});
