# ============================================================
#  HandiTalents — Etape 4 : Score final pondere
#  Formule de votre document :
#  score = 0.70 x semantique + 0.20 x experience + 0.10 x handicap
# ============================================================
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from config import POIDS, SEUILS

def calculer_score_experience(experience_annees: int, experience_requise: int) -> float:
    """Retourne un score 0-1 base sur l'experience."""
    if experience_requise == 0:
        return 1.0
    ratio = min(experience_annees / experience_requise, 1.5)
    return round(min(ratio / 1.5, 1.0), 4)

def calculer_score_handicap(amenagements_candidat: list, amenagements_poste: list) -> float:
    """
    Verifie si le poste est compatible avec le profil de handicap.
    Si le poste n'a pas de contraintes specifiques → score = 1.0
    """
    if not amenagements_poste:
        return 1.0
    communs = set(amenagements_candidat) & set(amenagements_poste)
    return round(len(communs) / len(amenagements_poste), 4)

def calculer_score_final(score_sem: float, score_exp: float, score_handi: float) -> dict:
    """
    Applique la formule ponderee et retourne le score final avec recommandation.
    """
    score = (
        POIDS["semantique"]  * score_sem   +
        POIDS["experience"]  * score_exp   +
        POIDS["handicap"]    * score_handi
    )
    score_pct = round(score * 100, 1)

    # Recommandation selon les seuils de votre document
    if score_pct >= SEUILS["shortlist_prioritaire"]:
        recommandation = "shortlist_prioritaire"
        label = "Shortlist prioritaire"
    elif score_pct >= SEUILS["shortlist_recommande"]:
        recommandation = "shortlist_recommande"
        label = "Shortlist recommande"
    elif score_pct >= SEUILS["afficher_avec_reserve"]:
        recommandation = "afficher_avec_reserve"
        label = "Afficher avec reserve"
    else:
        recommandation = "hors_shortlist"
        label = "Hors shortlist"

    return {
        "score_global": score_pct,
        "detail": {
            "score_semantique":  round(score_sem * 100, 1),
            "score_experience":  round(score_exp * 100, 1),
            "score_handicap":    round(score_handi * 100, 1),
        },
        "recommandation": recommandation,
        "label": label
    }
