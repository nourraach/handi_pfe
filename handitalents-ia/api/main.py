# ============================================================
#  HandiTalents — API FastAPI v2
#  MODIFIÉ : accepte le texte de l'offre directement
#  Plus besoin d'un fichier JSON — on tape l'offre en texte
# ============================================================
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import tempfile, os, sys, json, glob
import unicodedata
import re


def nettoyer_texte(texte: str) -> str:
    """Remplace les ? isoles (encodage corrompu) par des espaces."""
    # Detecter si le texte est corrompu (> 3% de points d'interrogation)
    nb_q = texte.count("?")
    nb_mots = max(len(texte.split()), 1)
    if nb_q > 2 and nb_q / nb_mots > 0.03:
        texte = re.sub(r"\?", " ", texte)
        texte = re.sub(r"  +", " ", texte).strip()
    return texte

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from engine.matcher import analyser_candidat_vs_offre
from engine.embedder import calculer_score_semantique, get_embedder_status
from engine.scorer import calculer_score_experience, calculer_score_final
from engine.rules import verifier_eligibilite
from parser.cv_parser import analyser_cv_complet, extraire_experience_stages

app = FastAPI(
    title="HandiTalents Matching IA",
    description="API de shortlisting intelligent pour recrutement inclusif",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR   = os.path.dirname(os.path.dirname(__file__))
OFFRES_DIR = os.path.join(BASE_DIR, "data", "offres")


# ════════════════════════════════════════════════════════════
#  GET /
# ════════════════════════════════════════════════════════════
@app.get("/")
def accueil():
    embedder_status = get_embedder_status()
    return {
        "status":  "ok",
        "message": "HandiTalents Matching IA v2 — API opérationnelle",
        "endpoints": ["/analyser-cv", "/shortlister", "/offres"],
        "semantic_engine": embedder_status
    }


# ════════════════════════════════════════════════════════════
#  GET /offres
# ════════════════════════════════════════════════════════════
@app.get("/offres")
def lister_offres():
    fichiers = glob.glob(os.path.join(OFFRES_DIR, "*.json"))
    offres = []
    for f in fichiers:
        with open(f, encoding="utf-8") as fp:
            d = json.load(fp)
            offres.append({
                "id":         d.get("id"),
                "titre":      d.get("titre"),
                "entreprise": d.get("entreprise"),
                "fichier":    os.path.basename(f)
            })
    return {"offres": offres, "total": len(offres)}


# ════════════════════════════════════════════════════════════
#  POST /analyser-cv
#  DEUX modes :
#   - Mode fichier  : offre_fichier = "offre_react.json"
#   - Mode texte    : texte_offre   = "Nous cherchons un dev React..."
# ════════════════════════════════════════════════════════════
@app.post("/analyser-cv")
async def analyser_cv(
    cv:             UploadFile = File(..., description="Fichier CV (PDF ou DOCX)"),
    offre_fichier:  str  = Form("", description="Nom du fichier offre ex: offre_react.json (optionnel)"),
    texte_offre:    str  = Form("", description="Texte libre de l'offre d'emploi (optionnel)"),
    experience_min: int  = Form(0,  description="Années d'expérience minimum requises"),
):
    """
    Analyse un CV vs une offre et retourne le score de matching.

    **Deux façons de fournir l'offre :**
    - `offre_fichier` : nom d'un fichier dans data/offres/ (ex: offre_react.json)
    - `texte_offre`   : texte libre de l'offre directement

    **Exemple curl avec texte libre :**
    ```
    curl -X POST http://localhost:8000/analyser-cv
      -F "cv=@mon_cv.pdf"
      -F "texte_offre=Nous cherchons un développeur React avec TypeScript"
    ```
    """

    # ── Sauvegarder le CV temporairement ──────────────────
    ext = os.path.splitext(cv.filename)[1] or ".pdf"
    with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp:
        tmp.write(await cv.read())
        chemin_cv = tmp.name

    try:
        # ── Extraire les données du CV ─────────────────────
        cv_data  = analyser_cv_complet(chemin_cv)
        texte_cv = cv_data["texte_brut"]
        exp_data = extraire_experience_stages(texte_cv)
        # Utiliser le max entre dates et mention explicite
        from parser.cv_parser import extraire_experience_mentionnee
        exp_mentionnee = extraire_experience_mentionnee(texte_cv)
        exp_annees = max(exp_data["duree_totale_annees"], exp_mentionnee)
        exp_data["duree_totale_annees"] = exp_annees
        exp_data["duree_totale_mois"]   = int(exp_annees * 12)

        # ── Résoudre la source de l'offre ─────────────────
        offre_texte_final = ""
        offre_titre       = "Offre personnalisée"
        competences_req   = []
        competences_bonus = []

        if texte_offre.strip():
            # Mode texte libre — on utilise directement ce que l'utilisateur a tapé
            offre_texte_final = nettoyer_texte(texte_offre.strip())
            offre_titre       = offre_texte_final[:60] + "..." if len(offre_texte_final) > 60 else offre_texte_final

        elif offre_fichier.strip():
            # Mode fichier JSON
            chemin_offre = os.path.join(OFFRES_DIR, offre_fichier.strip())
            if not os.path.exists(chemin_offre):
                raise HTTPException(
                    status_code=404,
                    detail=f"Fichier offre '{offre_fichier}' introuvable dans data/offres/. "
                           f"Utilisez 'texte_offre' pour entrer le texte de l'offre directement."
                )
            with open(chemin_offre, encoding="utf-8") as f:
                offre_json        = json.load(f)
            offre_texte_final = offre_json.get("description", "")
            offre_titre       = offre_json.get("titre", "")
            competences_req   = offre_json.get("competences_requises", [])
            competences_bonus = offre_json.get("competences_bonus", [])
            experience_min    = offre_json.get("experience_min", experience_min)
        else:
            raise HTTPException(
                status_code=422,
                detail="Fournissez soit 'texte_offre' (texte libre) soit 'offre_fichier' (nom de fichier JSON)."
            )

        # ── Vérification règles métier ─────────────────────
        eligibilite = verifier_eligibilite(
            candidat={
                "experience_annees": exp_data["duree_totale_annees"],
                "a_diplome":         cv_data["formation"] != "Non précisé",
                "region":            cv_data["region"],
                "documents_valides": True,
            },
            criteres_offre={
                "experience_min":    experience_min,
                "regions_acceptees": [],
                "diplome_requis":    False,
            }
        )

        if not eligibilite["eligible"]:
            return {
                "candidat":            cv_data["nom"],
                "offre":               offre_titre,
                "eligible":            False,
                "raisons_elimination": eligibilite["raisons_elimination"],
                "score_global":        0,
                "recommandation":      "hors_shortlist",
                "label":               "Éliminé (règles métier)",
            }

        # ── Score sémantique ───────────────────────────────
        score_sem = calculer_score_semantique(texte_cv, offre_texte_final)

        # ── Score compétences (si offre JSON avec liste) ───
        if competences_req:
            cv_set      = set(cv_data["competences"])
            req_set     = set(competences_req)
            bonus_set   = set(competences_bonus)
            matches_req  = cv_set & req_set
            matches_bon  = cv_set & bonus_set
            manquantes   = req_set - cv_set
            score_comp   = len(matches_req) / len(req_set) if req_set else 1.0
            score_comp   = min(score_comp * 0.85 + (len(matches_bon)/len(bonus_set) if bonus_set else 0) * 0.15, 1.0)
            score_sem_combine = score_sem * 0.5 + score_comp * 0.5
        else:
            # Mode texte libre : on se base uniquement sur le score sémantique
            matches_req  = []
            matches_bon  = []
            manquantes   = []
            score_sem_combine = score_sem

        # ── Score expérience ───────────────────────────────
        score_exp = calculer_score_experience(exp_data["duree_totale_annees"], experience_min)

        # ── Score final ────────────────────────────────────
        resultat = calculer_score_final(score_sem_combine, score_exp, 1.0)

        return {
            "candidat":                cv_data["nom"],
            "offre":                   offre_titre,
            "eligible":                True,
            "score_global":            resultat["score_global"],
            "label":                   resultat["label"],
            "recommandation":          resultat["recommandation"],
            "detail_scores": {
                "semantique":          round(score_sem * 100, 1),
                "competences":         round((score_sem_combine) * 100, 1),
                "experience":          round(score_exp * 100, 1),
            },
            "competences_cv":          cv_data["competences"],
            "competences_matches":     sorted(matches_req),
            "competences_bonus":       sorted(matches_bon),
            "competences_manquantes":  sorted(manquantes),
            "experience_mois":         exp_data["duree_totale_mois"],
            "region":                  cv_data["region"],
            "langues":                 cv_data["langues"],
            "nb_competences_cv":       cv_data["nb_competences"],
            "semantic_engine_backend": get_embedder_status().get("backend", "tfidf"),
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur interne : {str(e)}")
    finally:
        try: os.unlink(chemin_cv)
        except: pass


# ════════════════════════════════════════════════════════════
#  POST /shortlister — plusieurs CV vs 1 offre
# ════════════════════════════════════════════════════════════
@app.post("/shortlister")
async def shortlister(
    cvs:           list[UploadFile] = File(...),
    texte_offre:   str = Form("",   description="Texte libre de l'offre"),
    offre_fichier: str = Form("",   description="Nom du fichier offre JSON"),
    seuil_min:     int = Form(50,   description="Score minimum pour la shortlist"),
    experience_min: int = Form(0),
):
    """
    Classe plusieurs CV vs une offre. Retourne la shortlist triée.
    """
    # Résoudre le texte de l'offre
    if texte_offre.strip():
        offre_txt   = nettoyer_texte(texte_offre.strip())
        offre_titre = offre_txt[:60] + "..."
        comp_req    = []
        comp_bon    = []
    elif offre_fichier.strip():
        chemin = os.path.join(OFFRES_DIR, offre_fichier.strip())
        if not os.path.exists(chemin):
            raise HTTPException(status_code=404, detail=f"Fichier '{offre_fichier}' introuvable")
        with open(chemin, encoding="utf-8") as f:
            oj = json.load(f)
        offre_txt   = oj.get("description", "")
        offre_titre = oj.get("titre", "")
        comp_req    = oj.get("competences_requises", [])
        comp_bon    = oj.get("competences_bonus", [])
        experience_min = oj.get("experience_min", experience_min)
    else:
        raise HTTPException(status_code=422, detail="Fournissez texte_offre ou offre_fichier.")

    resultats   = []
    fichiers_tmp = []

    for cv_file in cvs:
        ext = os.path.splitext(cv_file.filename)[1] or ".pdf"
        with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp:
            tmp.write(await cv_file.read())
            fichiers_tmp.append(tmp.name)

        try:
            cv_data  = analyser_cv_complet(fichiers_tmp[-1])
            texte_cv = cv_data["texte_brut"]
            exp_data = extraire_experience_stages(texte_cv)

            eligibilite = verifier_eligibilite(
                candidat={"experience_annees": exp_data["duree_totale_annees"],
                          "a_diplome": True, "region": cv_data["region"], "documents_valides": True},
                criteres_offre={"experience_min": experience_min, "regions_acceptees": [], "diplome_requis": False}
            )

            if not eligibilite["eligible"]:
                resultats.append({"candidat": cv_data["nom"], "fichier_cv": cv_file.filename,
                                   "eligible": False, "score_global": 0,
                                   "raisons_elimination": eligibilite["raisons_elimination"],
                                   "label": "Éliminé"})
                continue

            score_sem = calculer_score_semantique(texte_cv, offre_txt)
            if comp_req:
                cv_set = set(cv_data["competences"])
                sc = len(cv_set & set(comp_req)) / len(comp_req) if comp_req else 1.0
                score_final_sem = score_sem * 0.5 + sc * 0.5
            else:
                score_final_sem = score_sem

            score_exp = calculer_score_experience(exp_data["duree_totale_annees"], experience_min)
            res = calculer_score_final(score_final_sem, score_exp, 1.0)

            resultats.append({
                "candidat":    cv_data["nom"],
                "fichier_cv":  cv_file.filename,
                "eligible":    True,
                "score_global": res["score_global"],
                "label":       res["label"],
                "competences": cv_data["competences"],
                "region":      cv_data["region"],
            })
        except Exception as e:
            resultats.append({"fichier_cv": cv_file.filename, "erreur": str(e), "score_global": 0, "eligible": False})

    for f in fichiers_tmp:
        try: os.unlink(f)
        except: pass

    eligibles  = sorted([r for r in resultats if r.get("eligible") and r["score_global"] >= seuil_min],
                        key=lambda x: x["score_global"], reverse=True)
    hors_seuil = [r for r in resultats if r.get("eligible") and r["score_global"] < seuil_min]
    elimines   = [r for r in resultats if not r.get("eligible")]

    return {
        "offre":             offre_titre,
        "total_recus":       len(resultats),
        "total_shortlist":   len(eligibles),
        "shortlist":         eligibles,
        "hors_seuil":        hors_seuil,
        "elimines":          elimines,
        "semantic_engine_backend": get_embedder_status().get("backend", "tfidf"),
    }
