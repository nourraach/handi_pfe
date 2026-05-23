import type {
  GapsAnalysis,
  HandicapBlock,
  InterviewDossierPayload,
  InterviewQuestion,
} from "./interview-questions.types";

/**
 * Feature 02 — Questions de fallback (utilisees si Gemini indisponible).
 * 5 questions generiques mais structurees, 1 par categorie.
 * Personnalisation legere via les donnees factuelles du gaps analysis.
 */

function pickFirst(arr: string[], fallback: string): string {
  return arr.length > 0 ? arr[0] : fallback;
}

export function buildFallbackDossier(gaps: GapsAnalysis): InterviewDossierPayload {
  const skillMatching = pickFirst(gaps.matching_skills, "vos competences principales");
  const skillMissing = pickFirst(gaps.missing_skills, "les competences attendues");
  const titre = gaps.offre_summary.titre || "ce poste";

  const questions: InterviewQuestion[] = [
    {
      id: "fb-1",
      question: `Pourquoi etes-vous interesse(e) par le poste de ${titre} ?`,
      categorie: "motivation",
      probabilite: "haute",
      conseil_reponse:
        "Reliez votre motivation a un element concret du profil de l'entreprise (mission, valeurs, projet). Citez 1 ou 2 elements de votre parcours qui renforcent cet interet.",
      exemple_amorce: `Ce qui m'attire en particulier dans le poste de ${titre}, c'est...`,
      pieges_a_eviter: [
        "Reponse generique applicable a n'importe quelle entreprise",
        "Centrer la reponse uniquement sur ce que VOUS gagnez",
      ],
      competences_profil_a_mobiliser: gaps.matching_skills.slice(0, 3),
    },
    {
      id: "fb-2",
      question: `Pouvez-vous nous parler de votre experience avec ${skillMatching} ?`,
      categorie: "technique",
      probabilite: "haute",
      conseil_reponse:
        "Decrivez un projet concret ou vous avez utilise cette competence, le contexte, votre role precis, et le resultat obtenu. Restez factuel.",
      exemple_amorce: `Dans mon experience precedente, j'ai utilise ${skillMatching} pour...`,
      pieges_a_eviter: [
        "Survoler sans donner d'exemple concret",
        "Exagerer son niveau au-dela de la realite",
      ],
      competences_profil_a_mobiliser: [skillMatching],
    },
    {
      id: "fb-3",
      question:
        "Decrivez une situation professionnelle difficile que vous avez rencontree et comment vous l'avez geree.",
      categorie: "comportementale",
      probabilite: "haute",
      conseil_reponse:
        "Utilisez la methode STAR (Situation, Tache, Action, Resultat). Choisissez une situation qui montre une qualite recherchee pour le poste.",
      exemple_amorce: "Dans le cadre d'un projet recent, nous avons rencontre...",
      pieges_a_eviter: [
        "Conflit interpersonnel non resolu (donne une image negative)",
        "Repondre par une theorie sans exemple",
      ],
      competences_profil_a_mobiliser: gaps.psycho_traits.slice(0, 3),
    },
    {
      id: "fb-4",
      question:
        gaps.missing_skills.length > 0
          ? `L'offre demande ${skillMissing} — comment abordez-vous cette competence que vous n'avez pas encore ?`
          : "Quel domaine aimeriez-vous developper dans ce poste ?",
      categorie: "gap",
      probabilite: "moyenne",
      conseil_reponse:
        "Reconnaissez honnetement le gap, puis montrez votre capacite d'apprentissage avec un exemple passe (formation, projet perso, montee en competence rapide).",
      exemple_amorce: "Effectivement, c'est un point ou je dois encore monter en competence. Mon approche serait...",
      pieges_a_eviter: [
        "Minimiser ou nier le gap",
        "Promettre une maitrise immediate sans plan concret",
      ],
      competences_profil_a_mobiliser: gaps.matching_skills.slice(0, 2),
    },
    {
      id: "fb-5",
      question: `Que connaissez-vous du secteur lie a ${titre} ?`,
      categorie: "secteur",
      probabilite: "moyenne",
      conseil_reponse:
        "Citez 2-3 tendances actuelles du secteur, un acteur cle, et une idee personnelle sur l'evolution a court terme. Cela montre une veille active.",
      exemple_amorce: "Je suis ce secteur depuis... Recemment, j'observe que...",
      pieges_a_eviter: [
        "Reponse vague type 'c'est un secteur en croissance'",
        "Repeter des elements deja sur le site de l'entreprise sans valeur ajoutee",
      ],
      competences_profil_a_mobiliser: [],
    },
  ];

  let handicap_block: HandicapBlock | null = null;
  if (gaps.handicap_context) {
    handicap_block = {
      titre: "Section optionnelle — Preparer les questions sur l'amenagement de poste",
      intro:
        "Cette section vous aide a anticiper d'eventuelles questions sur vos besoins specifiques. Consultez-la uniquement si vous le souhaitez. Vous n'avez aucune obligation legale de detailler votre handicap en entretien.",
      questions: [
        {
          question: "Avez-vous des besoins specifiques pour votre poste de travail ?",
          conseil_reponse:
            "Repondez factuellement en mentionnant uniquement les amenagements concrets utiles" +
            (gaps.handicap_context.amenagements_possibles
              ? ` (l'offre mentionne deja : ${gaps.handicap_context.amenagements_possibles}).`
              : ".") +
            " Vous n'etes pas oblige(e) de detailler la nature du handicap.",
        },
        {
          question: "Souhaitez-vous evoquer votre RQTH / situation de handicap ?",
          conseil_reponse:
            "Le choix vous appartient totalement. Si vous l'evoquez, gardez un ton factuel et orientez la conversation vers vos competences et les conditions de travail qui vous permettent d'etre performant(e).",
        },
      ],
    };
  }

  return { questions, handicap_block, source: "fallback" };
}
