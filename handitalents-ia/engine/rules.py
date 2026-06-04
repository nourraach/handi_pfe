# ============================================================
#  HandiTalents — Etape 3a : Regles metier (filtrage)
#  Ces regles s'appliquent AVANT le scoring IA
# ============================================================

def verifier_eligibilite(candidat: dict, criteres_offre: dict) -> dict:
    """
    Verifie si un candidat passe les regles obligatoires.

    candidat = {
        "experience_annees": 3,
        "a_diplome": True,
        "region": "Tunis",
        "documents_valides": True
    }

    criteres_offre = {
        "experience_min": 2,
        "regions_acceptees": ["Tunis", "Sfax"],
        "diplome_requis": True
    }

    Retourne: { "eligible": True/False, "raisons_elimination": [...] }
    """
    raisons = []

    # Regle 1 : experience minimum
    exp_min = criteres_offre.get("experience_min", 0)
    exp_candidat = candidat.get("experience_annees", 0)
    if exp_candidat < exp_min:
        raisons.append(f"Experience insuffisante : {exp_candidat} ans (minimum {exp_min} ans requis)")

    # Regle 2 : diplome requis
    if criteres_offre.get("diplome_requis", False) and not candidat.get("a_diplome", False):
        raisons.append("Diplome requis manquant")

    # Regle 3 : region compatible
    regions = criteres_offre.get("regions_acceptees", [])
    if regions and candidat.get("region") not in regions:
        raisons.append(f"Region non compatible : {candidat.get('region')} (acceptees : {', '.join(regions)})")

    # Regle 4 : documents valides
    if not candidat.get("documents_valides", True):
        raisons.append("Documents obligatoires manquants ou non valides")

    return {
        "eligible": len(raisons) == 0,
        "raisons_elimination": raisons
    }
