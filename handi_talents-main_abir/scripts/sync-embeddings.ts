import "dotenv/config";
import crypto from "crypto";
import { pool } from "../src/db";
import { createEmbeddingProvider } from "../src/services/embedding-provider.factory";
import { EmbeddingTextBuilderService } from "../src/services/embedding-text-builder.service";
import { EmbeddingStorageService } from "../src/services/embedding-storage.service";

type CandidateSqlRow = {
  candidate_id: string;
  description: string | null;
  competences: unknown;
  experience: string | null;
  disponibilite: string | null;
  secteur: string | null;
};

type OfferSqlRow = {
  job_offer_id: string;
  titre: string;
  description: string;
  localisation: string | null;
  type_poste: string | null;
  competences_requises: string | null;
};

function toArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item)).filter((item) => item.trim().length > 0);
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => String(item)).filter((item) => item.trim().length > 0);
      }
      return [];
    } catch {
      return [];
    }
  }

  return [];
}

function splitCsv(value?: string | null) {
  if (!value) return [];
  return value
    .split(/[,\n;|/]/g)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function hashSource(text: string) {
  return crypto.createHash("sha256").update(text, "utf8").digest("hex");
}

async function main() {
  const provider = createEmbeddingProvider();
  const builder = new EmbeddingTextBuilderService();
  const storage = new EmbeddingStorageService();

  const candidatesRes = await pool.query<CandidateSqlRow>(
    `
    SELECT
      c.id AS candidate_id,
      c.description,
      c.competences,
      c.experience,
      c.disponibilite,
      c.secteur
    FROM candidat c
    INNER JOIN utilisateur u ON u.id_utilisateur = c.id_utilisateur
    WHERE u.role = 'candidat' AND u.statut = 'actif'
  `,
  );

  const offersRes = await pool.query<OfferSqlRow>(
    `
    SELECT
      o.id AS job_offer_id,
      o.titre,
      o.description,
      o.localisation,
      o.type_poste,
      o.competences_requises
    FROM offre_emploi o
    WHERE o.statut = 'active'
  `,
  );

  let candidateEmbedded = 0;
  let offerEmbedded = 0;

  for (const row of candidatesRes.rows) {
    const text = builder.buildCandidateText({
      targetTitle: row.secteur || "profil candidat",
      summary: row.description || undefined,
      skills: toArray(row.competences),
      preferredContracts: row.disponibilite ? [row.disponibilite] : [],
      preferredSectors: row.secteur ? [row.secteur] : [],
    });
    const embedding = await provider.embed(text);
    await storage.upsertCandidateEmbedding({
      candidateId: row.candidate_id,
      embedding,
      sourceHash: hashSource(text),
      modelName: provider.modelName(),
    });
    candidateEmbedded += 1;
  }

  for (const row of offersRes.rows) {
    const text = builder.buildJobOfferText({
      title: row.titre,
      description: row.description,
      requiredSkills: splitCsv(row.competences_requises),
      contractType: row.type_poste || undefined,
      location: row.localisation || undefined,
    });
    const embedding = await provider.embed(text);
    await storage.upsertJobOfferEmbedding({
      jobOfferId: row.job_offer_id,
      embedding,
      sourceHash: hashSource(text),
      modelName: provider.modelName(),
    });
    offerEmbedded += 1;
  }

  console.log(
    JSON.stringify(
      {
        success: true,
        provider: provider.modelName(),
        candidateEmbedded,
        offerEmbedded,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error("Echec sync embeddings:", error.message || error);
  process.exit(1);
});
