# ============================================================
#  HandiTalents - Semantic scoring
#  Priority: SBERT in production, TF-IDF as fallback
# ============================================================

import os
from pathlib import Path
from typing import Any, Dict

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

USE_SBERT = os.getenv("USE_SBERT", "true").strip().lower() in {"1", "true", "yes", "on"}
REQUIRE_SBERT = os.getenv("REQUIRE_SBERT", "false").strip().lower() in {"1", "true", "yes", "on"}
DEFAULT_MODEL_NAME = "./modele_handitalents"

PROJECT_ROOT = Path(__file__).resolve().parents[1]

_modele_sbert = None
_sbert_disponible = False
_sbert_error = ""
_backend_name = "tfidf"
_model_path_loaded = ""


def _resolve_model_path() -> str:
    model_name = DEFAULT_MODEL_NAME
    try:
        from config import MODEL_NAME as CONFIG_MODEL_NAME

        if isinstance(CONFIG_MODEL_NAME, str) and CONFIG_MODEL_NAME.strip():
            model_name = CONFIG_MODEL_NAME.strip()
    except Exception:
        pass

    path_candidate = Path(model_name)
    if not path_candidate.is_absolute():
        path_candidate = (PROJECT_ROOT / path_candidate).resolve()
    return str(path_candidate)


if USE_SBERT:
    try:
        from sentence_transformers import SentenceTransformer

        model_path = _resolve_model_path()
        _modele_sbert = SentenceTransformer(model_path)
        _sbert_disponible = True
        _backend_name = "sbert"
        _model_path_loaded = model_path
        print(f"[IA] SBERT loaded: {model_path}")
    except Exception as exc:
        _sbert_error = str(exc)
        _backend_name = "tfidf"
        print(f"[WARN] SBERT unavailable ({exc}). TF-IDF fallback enabled.")
        if REQUIRE_SBERT:
            raise RuntimeError(f"SBERT is required but could not be loaded: {exc}") from exc


def _score_tfidf(texte_cv: str, texte_offre: str) -> float:
    vectorizer = TfidfVectorizer()
    matrice = vectorizer.fit_transform([texte_cv, texte_offre])
    score = cosine_similarity(matrice[0], matrice[1])[0][0]
    return round(float(score), 4)


def calculer_score_semantique(texte_cv: str, texte_offre: str) -> float:
    if _sbert_disponible and _modele_sbert is not None:
        vec_cv = _modele_sbert.encode([texte_cv], normalize_embeddings=True)
        vec_offre = _modele_sbert.encode([texte_offre], normalize_embeddings=True)
        score = cosine_similarity(vec_cv, vec_offre)[0][0]
        return round(float(score), 4)

    return _score_tfidf(texte_cv, texte_offre)


def get_embedder_status() -> Dict[str, Any]:
    return {
        "backend": _backend_name,
        "sbert_enabled": USE_SBERT,
        "sbert_loaded": _sbert_disponible,
        "model_path": _model_path_loaded or _resolve_model_path(),
        "sbert_error": _sbert_error or None,
    }
