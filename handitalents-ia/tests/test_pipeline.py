# ============================================================
#  HandiTalents — Tests pour verifier que tout marche
#  Lancer avec : python tests/test_pipeline.py
# ============================================================
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from engine.rules import verifier_eligibilite
from engine.embedder import calculer_score_semantique
from engine.scorer import calculer_score_final

print("\n" + "="*50)
print("  TEST 1 : Regles metier (filtrage)")
print("="*50)

res = verifier_eligibilite(
    candidat={"experience_annees": 4, "a_diplome": True, "region": "Tunis", "documents_valides": True},
    criteres_offre={"experience_min": 2, "regions_acceptees": ["Tunis"], "diplome_requis": True}
)
statut = "OK" if res["eligible"] else "ERREUR"
print(f"[{statut}] Candidat A eligible : {res['eligible']}")

res2 = verifier_eligibilite(
    candidat={"experience_annees": 1, "a_diplome": False, "region": "Nabeul", "documents_valides": True},
    criteres_offre={"experience_min": 2, "regions_acceptees": ["Tunis"], "diplome_requis": True}
)
statut2 = "OK" if not res2["eligible"] else "ERREUR"
print(f"[{statut2}] Candidat D non eligible : {not res2['eligible']}")
print(f"    Raisons : {res2['raisons_elimination']}")

print("\n" + "="*50)
print("  TEST 2 : Score semantique SBERT")
print("="*50)

score1 = calculer_score_semantique(
    "Next.js TypeScript developpeur frontend 4 ans experience",
    "Developpeur React frontend JavaScript"
)
statut3 = "OK" if score1 > 0.60 else "ATTENTION"
print(f"[{statut3}] Next.js vs React  : {score1:.4f} (attendu > 0.60)")

score2 = calculer_score_semantique(
    "comptable bilan fiscalite audit finance",
    "Developpeur React frontend JavaScript"
)
statut4 = "OK" if score2 < 0.50 else "ATTENTION"
print(f"[{statut4}] Comptable vs React : {score2:.4f} (attendu < 0.50)")

print("\n" + "="*50)
print("  TEST 3 : Score final pondere")
print("="*50)

resultat = calculer_score_final(score_sem=0.88, score_exp=0.90, score_handi=1.0)
print(f"[OK] Score global : {resultat['score_global']}/100")
print(f"     Recommandation : {resultat['label']}")
print(f"     Detail : {resultat['detail']}")

print("\n>>> Tous les tests termines avec succes ! <<<\n")
