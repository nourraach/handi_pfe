type CandidateEmbeddingInput = {
  targetTitle?: string | null;
  summary?: string | null;
  skills?: string[] | null;
  experienceYears?: number | null;
  preferredContracts?: string[] | null;
  remotePreference?: string | null;
  preferredSectors?: string[] | null;
};

type JobOfferEmbeddingInput = {
  title: string;
  description: string;
  missions?: string[] | null;
  requiredSkills?: string[] | null;
  niceToHaveSkills?: string[] | null;
  contractType?: string | null;
  remotePolicy?: string | null;
  location?: string | null;
};

function list(values?: string[] | null) {
  if (!Array.isArray(values) || values.length === 0) return "non precise";
  return values.filter(Boolean).join(", ");
}

export class EmbeddingTextBuilderService {
  buildCandidateText(input: CandidateEmbeddingInput) {
    return [
      `Titre cible: ${input.targetTitle || "non precise"}`,
      `Resume: ${input.summary || "non precise"}`,
      `Competences: ${list(input.skills)}`,
      `Experience: ${input.experienceYears ?? "non precise"} ans`,
      `Preferences contrats: ${list(input.preferredContracts)}`,
      `Preference remote: ${input.remotePreference || "non precise"}`,
      `Secteurs souhaites: ${list(input.preferredSectors)}`,
    ].join("\n");
  }

  buildJobOfferText(input: JobOfferEmbeddingInput) {
    return [
      `Titre: ${input.title}`,
      `Description: ${input.description}`,
      `Missions: ${list(input.missions)}`,
      `Competences requises: ${list(input.requiredSkills)}`,
      `Competences souhaitees: ${list(input.niceToHaveSkills)}`,
      `Contrat: ${input.contractType || "non precise"}`,
      `Mode: ${input.remotePolicy || "non precise"}`,
      `Localisation: ${input.location || "non precise"}`,
    ].join("\n");
  }
}
