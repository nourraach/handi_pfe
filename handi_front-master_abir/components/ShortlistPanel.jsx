"use client";

import { useState } from "react";

const LABEL_CONFIG = {
  shortlist_prioritaire: { couleur: "#0F6E56", bg: "#E1F5EE", texte: "Prioritaire" },
  shortlist_recommande: { couleur: "#185FA5", bg: "#E6F1FB", texte: "Recommande" },
  afficher_avec_reserve: { couleur: "#854F0B", bg: "#FAEEDA", texte: "Avec reserve" },
  hors_shortlist: { couleur: "#A32D2D", bg: "#FCEBEB", texte: "Hors liste" },
};

function normaliserRecommandation(candidat) {
  if (candidat?.recommandation) {
    return candidat.recommandation;
  }

  const label = String(candidat?.label || "").toLowerCase();
  if (label.includes("prioritaire")) return "shortlist_prioritaire";
  if (label.includes("recommande")) return "shortlist_recommande";
  if (label.includes("reserve")) return "afficher_avec_reserve";
  if (label.includes("elimine")) return "hors_shortlist";
  return "hors_shortlist";
}

export default function ShortlistPanel() {
  const [cvFiles, setCvFiles] = useState([]);
  const [texteOffre, setTexteOffre] = useState("");
  const [seuilMin, setSeuilMin] = useState(60);
  const [experienceMin, setExperienceMin] = useState(0);
  const [resultat, setResultat] = useState(null);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState("");

  async function lancerAnalyse() {
    if (!cvFiles.length) {
      setErreur("Ajoutez au moins un CV");
      return;
    }
    if (!texteOffre.trim()) {
      setErreur("Entrez le texte de l offre");
      return;
    }

    setChargement(true);
    setErreur("");
    setResultat(null);

    try {
      const form = new FormData();
      cvFiles.forEach((f) => form.append("cvs", f));
      form.append("texte_offre", texteOffre);
      form.append("seuil_min", String(seuilMin));
      form.append("experience_min", String(experienceMin));

      const response = await fetch("/api/shortlist", {
        method: "POST",
        body: form,
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || "Erreur inconnue");
      }

      setResultat(data);
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setChargement(false);
    }
  }

  async function enregistrerCorrection(candidat, fichierCv, decision) {
    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidat,
          fichier_cv: fichierCv,
          label: decision,
          date: new Date().toISOString(),
        }),
      });
      alert(`Decision enregistree pour ${candidat}`);
    } catch {
      alert("Erreur lors de l enregistrement");
    }
  }

  function CarteCandidatShortlist({ c }) {
    const recommandation = normaliserRecommandation(c);
    const cfg = LABEL_CONFIG[recommandation] || LABEL_CONFIG.hors_shortlist;

    return (
      <div
        style={{
          border: "0.5px solid #e0e0e0",
          borderRadius: 10,
          padding: 16,
          marginBottom: 10,
          background: "#fff",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontWeight: 500, fontSize: 15 }}>{c.candidat}</div>
            <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>
              {c.fichier_cv} · {c.region}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 22, fontWeight: 500, color: cfg.couleur }}>{c.score_global}/100</div>
            <span
              style={{
                fontSize: 11,
                fontWeight: 500,
                padding: "2px 10px",
                borderRadius: 12,
                background: cfg.bg,
                color: cfg.couleur,
              }}
            >
              {cfg.texte}
            </span>
          </div>
        </div>

        {Array.isArray(c.competences) && c.competences.length > 0 ? (
          <div style={{ marginTop: 10, display: "flex", gap: 6, flexWrap: "wrap" }}>
            {c.competences.map((comp) => (
              <span
                key={comp}
                style={{
                  fontSize: 11,
                  padding: "2px 8px",
                  borderRadius: 10,
                  background: "#f0f0f0",
                  color: "#444",
                }}
              >
                {comp}
              </span>
            ))}
          </div>
        ) : null}

        <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
          <button
            onClick={() => enregistrerCorrection(c.candidat, c.fichier_cv, 1)}
            style={{
              padding: "5px 14px",
              fontSize: 12,
              borderRadius: 8,
              cursor: "pointer",
              border: "0.5px solid #0F6E56",
              background: "#E1F5EE",
              color: "#085041",
            }}
          >
            Valider ce candidat
          </button>
          <button
            onClick={() => enregistrerCorrection(c.candidat, c.fichier_cv, 0)}
            style={{
              padding: "5px 14px",
              fontSize: 12,
              borderRadius: 8,
              cursor: "pointer",
              border: "0.5px solid #A32D2D",
              background: "#FCEBEB",
              color: "#791F1F",
            }}
          >
            Rejeter ce candidat
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "24px 16px" }}>
      <h2 style={{ fontWeight: 500, fontSize: 20, marginBottom: 4 }}>Shortlisting intelligent</h2>
      <p style={{ fontSize: 14, color: "#666", marginBottom: 24 }}>
        Uploadez les CV et decrivez le poste, puis l IA classe les candidats en quelques secondes.
      </p>

      <div style={{ display: "grid", gap: 16 }}>
        <div>
          <label style={{ fontSize: 13, fontWeight: 500, display: "block", marginBottom: 6 }}>CV des candidats (PDF ou DOCX)</label>
          <input
            type="file"
            multiple
            accept=".pdf,.doc,.docx"
            onChange={(event) => setCvFiles(Array.from(event.target.files || []))}
            style={{ fontSize: 13 }}
          />
          {cvFiles.length > 0 ? (
            <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
              {cvFiles.length} fichier(s) selectionne(s): {cvFiles.map((file) => file.name).join(", ")}
            </div>
          ) : null}
        </div>

        <div>
          <label style={{ fontSize: 13, fontWeight: 500, display: "block", marginBottom: 6 }}>Description du poste</label>
          <textarea
            value={texteOffre}
            onChange={(event) => setTexteOffre(event.target.value)}
            placeholder="Nous recherchons un developpeur React avec 2 ans d experience..."
            rows={5}
            style={{
              width: "100%",
              fontSize: 13,
              padding: "8px 12px",
              borderRadius: 8,
              border: "0.5px solid #d0d0d0",
              resize: "vertical",
              boxSizing: "border-box",
            }}
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, display: "block", marginBottom: 4 }}>
              Score minimum shortlist: {seuilMin}%
            </label>
            <input type="range" min={30} max={90} value={seuilMin} onChange={(event) => setSeuilMin(Number(event.target.value))} style={{ width: "100%" }} />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, display: "block", marginBottom: 4 }}>
              Experience minimum: {experienceMin} an(s)
            </label>
            <input
              type="range"
              min={0}
              max={10}
              value={experienceMin}
              onChange={(event) => setExperienceMin(Number(event.target.value))}
              style={{ width: "100%" }}
            />
          </div>
        </div>

        <button
          onClick={lancerAnalyse}
          disabled={chargement}
          style={{
            padding: "10px 24px",
            fontSize: 14,
            fontWeight: 500,
            borderRadius: 10,
            cursor: chargement ? "wait" : "pointer",
            border: "none",
            background: "#185FA5",
            color: "#fff",
            opacity: chargement ? 0.7 : 1,
          }}
        >
          {chargement ? "Analyse en cours..." : "Lancer le shortlisting IA"}
        </button>

        {erreur ? (
          <div
            style={{
              padding: "10px 14px",
              background: "#FCEBEB",
              border: "0.5px solid #E24B4A",
              borderRadius: 8,
              fontSize: 13,
              color: "#791F1F",
            }}
          >
            {erreur}
          </div>
        ) : null}
      </div>

      {resultat ? (
        <div style={{ marginTop: 32 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 12,
              marginBottom: 24,
            }}
          >
            {[
              { label: "CV recus", valeur: resultat.total_recus, couleur: "#185FA5" },
              { label: "Shortliste", valeur: resultat.total_shortlist, couleur: "#0F6E56" },
              { label: "Elimines", valeur: resultat.elimines?.length || 0, couleur: "#A32D2D" },
            ].map(({ label, valeur, couleur }) => (
              <div key={label} style={{ background: "#f8f8f8", borderRadius: 10, padding: "14px 16px", textAlign: "center" }}>
                <div style={{ fontSize: 28, fontWeight: 500, color: couleur }}>{valeur}</div>
                <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>

          {Array.isArray(resultat.shortlist) && resultat.shortlist.length > 0 ? (
            <div>
              <h3 style={{ fontWeight: 500, fontSize: 16, marginBottom: 12, color: "#0F6E56" }}>
                Shortlist ({resultat.shortlist.length})
              </h3>
              {resultat.shortlist.map((candidat) => (
                <CarteCandidatShortlist key={candidat.fichier_cv} c={candidat} />
              ))}
            </div>
          ) : null}

          {Array.isArray(resultat.hors_seuil) && resultat.hors_seuil.length > 0 ? (
            <div style={{ marginTop: 20 }}>
              <h3 style={{ fontWeight: 500, fontSize: 16, marginBottom: 12, color: "#854F0B" }}>
                Hors seuil ({resultat.hors_seuil.length})
              </h3>
              {resultat.hors_seuil.map((candidat) => (
                <CarteCandidatShortlist key={candidat.fichier_cv} c={candidat} />
              ))}
            </div>
          ) : null}

          {Array.isArray(resultat.elimines) && resultat.elimines.length > 0 ? (
            <div style={{ marginTop: 20 }}>
              <h3 style={{ fontWeight: 500, fontSize: 16, marginBottom: 12, color: "#A32D2D" }}>
                Elimines - regles metier ({resultat.elimines.length})
              </h3>
              {resultat.elimines.map((candidat) => (
                <div
                  key={candidat.fichier_cv}
                  style={{
                    border: "0.5px solid #f0c0c0",
                    borderRadius: 10,
                    padding: 14,
                    marginBottom: 8,
                    background: "#fff9f9",
                  }}
                >
                  <div style={{ fontWeight: 500, fontSize: 14 }}>{candidat.candidat}</div>
                  <div style={{ fontSize: 12, color: "#A32D2D", marginTop: 4 }}>{candidat.raisons_elimination?.join(" · ")}</div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
