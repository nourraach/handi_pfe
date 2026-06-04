# ============================================================
#  HandiTalents — Moteur de matching complet
#  Combine : règles métier + scoring sémantique + pondération
# ============================================================
import sys, os, json
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from engine.embedder import calculer_score_semantique
from engine.rules   import verifier_eligibilite
from engine.scorer  import calculer_score_experience, calculer_score_final
from parser.cv_parser import analyser_cv_complet, extraire_experience_stages, extraire_texte_cv


def score_competences_explicite(competences_cv: list, competences_requises: list, competences_bonus: list) -> dict:
    """
    Compare les compétences du CV avec celles de l'offre.
    Retourne un score détaillé et la liste des matches/manques.
    """
    cv_set       = set(competences_cv)
    req_set      = set(competences_requises)
    bonus_set    = set(competences_bonus)

    matches_req   = cv_set & req_set
    matches_bonus = cv_set & bonus_set
    manquantes    = req_set - cv_set

    score_req   = len(matches_req)   / len(req_set)   if req_set   else 1.0
    score_bonus = len(matches_bonus) / len(bonus_set) if bonus_set else 0.0
    score_total = min(score_req * 0.85 + score_bonus * 0.15, 1.0)

    return {
        "score":            round(score_total, 4),
        "matches_requises": sorted(matches_req),
        "matches_bonus":    sorted(matches_bonus),
        "manquantes":       sorted(manquantes),
    }


def analyser_candidat_vs_offre(chemin_cv: str, chemin_offre: str) -> dict:
    """
    Pipeline complet : lit le CV + l'offre, calcule tous les scores,
    retourne le résultat final structuré.
    """

    # ── 1. Chargement des données ──────────────────────────────
    cv_data   = analyser_cv_complet(chemin_cv)
    texte_cv  = cv_data["texte_brut"]

    with open(chemin_offre, encoding="utf-8") as f:
        offre = json.load(f)

    # ── 2. Vérification règles métier ──────────────────────────
    exp_data = extraire_experience_stages(texte_cv)
    eligibilite = verifier_eligibilite(
        candidat={
            "experience_annees": exp_data["duree_totale_annees"],
            "a_diplome":         cv_data["formation"] != "Non précisé",
            "region":            cv_data["region"],
            "documents_valides": True,
        },
        criteres_offre={
            "experience_min":    offre.get("experience_min", 0),
            "regions_acceptees": offre.get("regions_acceptees", []),
            "diplome_requis":    offre.get("diplome_requis", False),
        }
    )

    if not eligibilite["eligible"]:
        return {
            "candidat":           cv_data["nom"],
            "offre":              offre["titre"],
            "eligible":           False,
            "raisons_elimination": eligibilite["raisons_elimination"],
            "score_global":        0,
            "recommandation":     "hors_shortlist",
            "label":              "Éliminé (règles métier)",
        }

    # ── 3. Score sémantique SBERT / TF-IDF ────────────────────
    score_sem = calculer_score_semantique(texte_cv, offre["description"])

    # ── 4. Score compétences explicites ───────────────────────
    comp_result = score_competences_explicite(
        cv_data["competences"],
        offre.get("competences_requises", []),
        offre.get("competences_bonus", []),
    )

    # ── 5. Score expérience ────────────────────────────────────
    score_exp = calculer_score_experience(
        exp_data["duree_totale_annees"],
        offre.get("experience_min", 0)
    )

    # ── 6. Score final pondéré ─────────────────────────────────
    # On combine score sémantique ET score compétences explicites
    score_semantique_combine = (score_sem * 0.5 + comp_result["score"] * 0.5)
    resultat = calculer_score_final(score_semantique_combine, score_exp, 1.0)

    return {
        "candidat":             cv_data["nom"],
        "offre":                offre["titre"],
        "entreprise":           offre.get("entreprise", ""),
        "eligible":             True,
        "score_global":         resultat["score_global"],
        "label":                resultat["label"],
        "recommandation":       resultat["recommandation"],
        "detail_scores": {
            "semantique":         round(score_sem * 100, 1),
            "competences":        round(comp_result["score"] * 100, 1),
            "experience":         round(score_exp * 100, 1),
        },
        "competences_cv":       cv_data["competences"],
        "competences_matches":  comp_result["matches_requises"],
        "competences_bonus":    comp_result["matches_bonus"],
        "competences_manquantes": comp_result["manquantes"],
        "experience_mois":      exp_data["duree_totale_mois"],
        "region":               cv_data["region"],
        "langues":              cv_data["langues"],
    }
