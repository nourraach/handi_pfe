# ============================================================
#  Test complet du parser sur le CV de Abir ANNABI
# ============================================================
import sys, os, json, re
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from parser.cv_parser import (
    extraire_texte_cv, extraire_nom, extraire_email,
    extraire_competences, extraire_langues, extraire_formation,
    extraire_region, extraire_experience_stages
)

CHEMIN_CV = "data/cvs/abir_annabi_cv.pdf"

print("\n" + "="*55)
print("   RÉSULTAT DU PARSER — CV : Abir ANNABI")
print("="*55)

texte = extraire_texte_cv(CHEMIN_CV)

# Téléphone propre
tel_match = re.search(r'\(\+\d+\)\s*\d[\d\s]{5,12}', texte)
telephone = tel_match.group(0).replace("\n", " ").strip() if tel_match else "Non trouvé"

exp = extraire_experience_stages(texte)
competences = extraire_competences(texte)
langues = extraire_langues(texte)

donnees = {
    "nom":              extraire_nom(texte),
    "email":            extraire_email(texte),
    "telephone":        telephone,
    "region":           extraire_region(texte),
    "formation":        extraire_formation(texte),
    "nb_stages":        exp["nb_stages"],
    "experience_mois":  exp["duree_totale_mois"],
    "competences":      competences,
    "nb_competences":   len(competences),
    "langues":          langues,
}

for cle, valeur in donnees.items():
    if isinstance(valeur, list):
        print(f"\n  {cle} ({len(valeur)}) :")
        for item in valeur:
            print(f"    • {item}")
    else:
        print(f"  {cle:25s} : {valeur}")

print("\n" + "="*55)
print("  Parser OK — données prêtes pour le scoring !")
print("="*55 + "\n")
