import sys
import os

sys.path.insert(0, '.')

print("=" * 50)
print("  Diagnostic HandiTalents SBERT")
print("=" * 50)

# 1. Verifier le dossier modele
print("\n[1] Dossier modele_handitalents :")
if os.path.exists("modele_handitalents"):
    fichiers = os.listdir("modele_handitalents")
    if fichiers:
        for f in fichiers:
            print(f"    OK  {f}")
    else:
        print("    VIDE - le modele n'est pas la !")
else:
    print("    INTROUVABLE - le dossier n'existe pas !")
    print("    -> Telechargez modele_handitalents.zip depuis Colab")
    print("       et decompressez-le ici")

# 2. Verifier variable environnement
print("\n[2] Variable USE_SBERT :")
val = os.getenv("USE_SBERT", "non definie")
print(f"    USE_SBERT = {val}")

# 3. Charger embedder et afficher statut
print("\n[3] Chargement embedder :")
try:
    from engine.embedder import get_embedder_status, calculer_score_semantique
    status = get_embedder_status()
    print(f"    Backend      : {status['backend']}")
    print(f"    SBERT active : {status['sbert_loaded']}")
    print(f"    Modele       : {status['model_path']}")
    if status.get('sbert_error'):
        print(f"    ERREUR       : {status['sbert_error']}")
except Exception as e:
    print(f"    ERREUR import : {e}")

# 4. Test de scoring
print("\n[4] Test de scoring UX/UI :")
try:
    from engine.embedder import calculer_score_semantique
    cv    = "UX UI Designer Figma Design Thinking Wireframes Prototypes Accessibilite 2 ans experience"
    offre = "UX UI Designer Figma Design thinking Prototypage Accessibilite 2 ans"
    score = calculer_score_semantique(cv, offre)
    print(f"    Score UX vs UX   : {round(score*100,1)}%  (attendu > 80%)")

    cv2   = "Comptable bilan fiscalite TVA Excel declarations"
    score2 = calculer_score_semantique(cv2, offre)
    print(f"    Score Compta vs UX: {round(score2*100,1)}%  (attendu < 20%)")

    if score > 0.7:
        print("\n    SBERT fonctionne correctement !")
    else:
        print("\n    TF-IDF actif - scores incorrects")
        print("    -> Activez SBERT sur votre machine")
except Exception as e:
    print(f"    ERREUR : {e}")

print("\n" + "=" * 50)
