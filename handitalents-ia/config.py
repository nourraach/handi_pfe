# ============================================================
#  HandiTalents — Configuration du module IA
#  Modifiez ces valeurs selon vos besoins
# ============================================================

# Modele SBERT multilingue (supporte francais + arabe)
MODEL_NAME = './modele_handitalents'
# Poids du score final (doivent sommer a 1.0)
POIDS = {
    "semantique":  0.70,   # score SBERT (sens du CV vs offre)
    "experience":  0.20,   # score experience (annees)
    "handicap":    0.10,   # compatibilite amenagement poste
}

# Seuils de decision (sur 100)
SEUILS = {
    "shortlist_prioritaire": 85,
    "shortlist_recommande":  70,
    "afficher_avec_reserve": 50,
}

# Port de l'API FastAPI
API_PORT = 8000
