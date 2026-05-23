import "dotenv/config";
import { eq } from "drizzle-orm";
import { db } from "../src/db";
import { offreEmploiTable } from "../src/db/schema";
import { MatchingService } from "../src/services/matching.service";

async function main() {
  const offers = await db
    .select({ id: offreEmploiTable.id })
    .from(offreEmploiTable)
    .where(eq(offreEmploiTable.statut, "active"));

  if (offers.length === 0) {
    console.log("Aucune offre active trouvee.");
    return;
  }

  const matching = new MatchingService();
  let processedOffers = 0;
  let stored = 0;
  let notified = 0;

  for (const offer of offers) {
    const result = await matching.matchPublishedJob(offer.id);
    processedOffers += 1;
    stored += result.stored;
    notified += result.notified;
  }

  console.log(
    JSON.stringify(
      {
        processedOffers,
        generatedRecommendations: stored,
        notifiedCandidates: notified,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error("Echec generation recommandations:", error);
  process.exit(1);
});
