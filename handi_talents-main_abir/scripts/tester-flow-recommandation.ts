import "dotenv/config";
import bcrypt from "bcrypt";
import { Client } from "pg";

const API_BASE = "http://localhost:4000";
const COMPANY_EMAIL = "rh.telnet@handitalents.tn";
const CANDIDATE_EMAIL = "yassine.trabelsi@handitalents.tn";
const TEST_PASSWORD = "Candidat123!";

type LoginResult = {
  token: string;
  role: string;
};

async function resetPassword(email: string, password: string) {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  const hash = await bcrypt.hash(password, 10);
  await client.query(
    "update utilisateur set mdp = $1, statut = 'actif', updated_at = now() where email = $2",
    [hash, email],
  );
  await client.end();
}

async function login(email: string, mdp: string): Promise<LoginResult> {
  const response = await fetch(`${API_BASE}/api/auth/connexion`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, mdp }),
  });

  const payload = (await response.json().catch(() => ({}))) as any;
  if (!response.ok) {
    throw new Error(`Login failed (${email}): ${payload?.message || response.statusText}`);
  }

  const token = payload?.donnees?.token;
  const role = payload?.donnees?.utilisateur?.role;

  if (!token) {
    throw new Error(`Token manquant apres login (${email})`);
  }

  return { token, role };
}

async function api<T>(path: string, token: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(init?.headers || {}),
    },
  });

  const payload = (await response.json().catch(() => ({}))) as any;
  if (!response.ok) {
    throw new Error(`API ${path} failed: ${payload?.message || response.statusText}`);
  }

  return payload as T;
}

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  await resetPassword(COMPANY_EMAIL, TEST_PASSWORD);
  await resetPassword(CANDIDATE_EMAIL, TEST_PASSWORD);

  const company = await login(COMPANY_EMAIL, TEST_PASSWORD);
  const candidate = await login(CANDIDATE_EMAIL, TEST_PASSWORD);

  const suffix = Date.now();
  const titre = `Flow Reco QA ${suffix}`;

  const createPayload = {
    titre,
    description:
      "Offre de test du flow recommandations. Nous recherchons un profil collaboratif avec une bonne communication, adaptabilite et travail d equipe dans un environnement inclusif.",
    localisation: "Tunis, Centre Urbain Nord",
    type_poste: "temps_plein",
    salaire_min: "1800",
    salaire_max: "2600",
    competences_requises: "communication, adaptabilite, travail-equipe",
    experience_requise: "1 an",
    niveau_etude: "Bac+2",
    amenagements_possibles: "Horaires amenages, poste ergonomique, contraste eleve",
  };

  const created = await api<{ donnees: { id: string } }>(
    "/api/entreprise/offres",
    company.token,
    {
      method: "POST",
      body: JSON.stringify(createPayload),
    },
  );

  const offerId = created?.donnees?.id;
  if (!offerId) {
    throw new Error("ID offre non recupere apres creation");
  }

  // Force publication trigger path: inactive -> active.
  await api(`/api/entreprise/offres/${offerId}/statut`, company.token, {
    method: "PATCH",
    body: JSON.stringify({ statut: "inactive" }),
  });

  await api(`/api/entreprise/offres/${offerId}/statut`, company.token, {
    method: "PATCH",
    body: JSON.stringify({ statut: "active" }),
  });

  let recommendationFound = false;
  let recommendationId = "";
  for (let i = 0; i < 12; i += 1) {
    const reco = await api<{ donnees: Array<{ id: string; job_offer_id: string }> }>(
      "/api/recommandations/candidat",
      candidate.token,
      { method: "GET" },
    );

    const item = (reco?.donnees || []).find((row) => row.job_offer_id === offerId);
    if (item) {
      recommendationFound = true;
      recommendationId = item.id;
      break;
    }
    await sleep(1000);
  }

  if (!recommendationFound) {
    throw new Error("Recommandation non visible pour le candidat apres publication");
  }

  await api(`/api/recommandations/${recommendationId}/view`, candidate.token, { method: "POST" });

  await api("/api/candidatures/postuler", candidate.token, {
    method: "POST",
    body: JSON.stringify({
      id_offre: offerId,
      cv_url: "/uploads/candidatures/demo-cv.pdf",
      lettre_motivation: "Candidature de validation du flow recommendation -> postulation.",
    }),
  });

  await api(`/api/recommandations/${recommendationId}/apply`, candidate.token, { method: "POST" });

  const applications = await api<{ donnees: Array<{ candidature: { id_offre: string } }> }>(
    "/api/candidatures/mes-candidatures",
    candidate.token,
    { method: "GET" },
  );

  const hasApplication = (applications?.donnees || []).some(
    (item) => item?.candidature?.id_offre === offerId,
  );

  if (!hasApplication) {
    throw new Error("Postulation non retrouvee dans mes candidatures");
  }

  const notifications = await api<{ donnees: Array<{ titre: string; message: string }> }>(
    "/api/notifications",
    candidate.token,
    { method: "GET" },
  );

  const recommendationNotifCount = (notifications?.donnees || []).filter((n) =>
    String(n.titre || "").toLowerCase().includes("offre compatible"),
  ).length;

  console.log(
    JSON.stringify(
      {
        success: true,
        offerId,
        recommendationId,
        recommendationFound,
        hasApplication,
        recommendationNotifCount,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error("Flow recommendation test failed:", error.message || error);
  process.exit(1);
});
