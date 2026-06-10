"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { authenticatedFetch } from "@/lib/auth-utils";
import { construireUrlApi } from "@/lib/config";

type ContexteBienEtre = {
  entretien: {
    id: string;
    date_heure: string;
    offre_titre: string;
  };
  module: {
    estimated_minutes: number;
    breathing_pattern: string;
    visualization_prompt: string;
  };
  points_forts: string[];
  source_points_forts: "claude" | "fallback";
};

type ApiPayload<T> = {
  message?: string;
  donnees?: T;
};

export default function BienEtreEntretienPage() {
  const params = useParams<{ id: string }>();
  const idEntretien = Array.isArray(params.id) ? params.id[0] : params.id;
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const [contexte, setContexte] = useState<ContexteBienEtre | null>(null);
  const [etape, setEtape] = useState(0);
  const [sessionDemarree, setSessionDemarree] = useState(false);
  const [termine, setTermine] = useState(false);
  const debutRef = useRef<number | null>(null);
  const [phaseRespiration, setPhaseRespiration] = useState<"Inspirez" | "Retenez" | "Expirez">("Inspirez");
  const [timerRespiration, setTimerRespiration] = useState(4);

  const chargerContexte = async () => {
    if (!idEntretien) {
      setErreur("Identifiant d'entretien manquant.");
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setErreur(null);
      const response = await authenticatedFetch(construireUrlApi(`/api/entretiens/${idEntretien}/bien-etre/contexte`));
      const data: ApiPayload<ContexteBienEtre> = await response.json();
      if (!response.ok || !data.donnees) {
        throw new Error(data.message || "Impossible de charger le module bien-etre.");
      }
      setContexte(data.donnees);
    } catch (error: unknown) {
      setErreur(error instanceof Error ? error.message : "Impossible de charger le module bien-etre.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void chargerContexte();
  }, [idEntretien]);

  useEffect(() => {
    if (etape !== 1) {
      return;
    }

    const sequence: Array<{ phase: "Inspirez" | "Retenez" | "Expirez"; duree: number }> = [
      { phase: "Inspirez", duree: 4 },
      { phase: "Retenez", duree: 7 },
      { phase: "Expirez", duree: 8 },
    ];
    let index = 0;
    let restant = sequence[index].duree;
    setPhaseRespiration(sequence[index].phase);
    setTimerRespiration(restant);

    const interval = setInterval(() => {
      restant -= 1;
      if (restant <= 0) {
        index = (index + 1) % sequence.length;
        restant = sequence[index].duree;
        setPhaseRespiration(sequence[index].phase);
      }
      setTimerRespiration(restant);
    }, 1000);

    return () => clearInterval(interval);
  }, [etape]);

  const etapes = useMemo(() => ["Introduction", "Respiration 4-7-8", "Visualisation", "Mes 3 points forts"], []);

  const demarrer = async () => {
    if (!idEntretien) {
      setErreur("Identifiant d'entretien manquant.");
      return;
    }
    try {
      const response = await authenticatedFetch(construireUrlApi(`/api/entretiens/${idEntretien}/bien-etre/demarrer`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entry_point: "direct" }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || "Impossible de demarrer la session.");
      }

      debutRef.current = Date.now();
      setSessionDemarree(true);
      setEtape(1);
    } catch (error: unknown) {
      setErreur(error instanceof Error ? error.message : "Impossible de demarrer la session.");
    }
  };

  const terminer = async () => {
    if (!idEntretien) {
      setErreur("Identifiant d'entretien manquant.");
      return;
    }
    try {
      const durationSeconds = debutRef.current ? Math.max(1, Math.round((Date.now() - debutRef.current) / 1000)) : undefined;
      const response = await authenticatedFetch(construireUrlApi(`/api/entretiens/${idEntretien}/bien-etre/terminer`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          completed_steps: ["breathing_478", "visualization", "strengths_review"],
          duration_seconds: durationSeconds,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || "Impossible de terminer la session.");
      }
      setTermine(true);
    } catch (error: unknown) {
      setErreur(error instanceof Error ? error.message : "Impossible de terminer la session.");
    }
  };

  if (loading) {
    return (
      <div className="app-page">
        <Card padding="lg">
          <strong>Chargement du module bien-etre...</strong>
        </Card>
      </div>
    );
  }

  if (erreur || !contexte) {
    return (
      <div className="app-page">
        <Card padding="lg">
          <strong>Module indisponible</strong>
          <p>{erreur || "Une erreur est survenue."}</p>
          <ButtonLink href="/candidat/entretiens">Retour a mes entretiens</ButtonLink>
        </Card>
      </div>
    );
  }

  if (termine) {
    return (
      <div className="app-page">
        <Card padding="lg">
          <strong>Preparation terminee</strong>
          <p>Bravo. Prenez une derniere respiration et gardez vos 3 points forts en tete pour demain.</p>
          <ButtonLink href="/candidat/entretiens">Retour a mes entretiens</ButtonLink>
        </Card>
      </div>
    );
  }

  return (
    <div className="app-page">
      <Card padding="lg">
        <div className="list-stack">
          <div>
            <strong>Preparation entretien ({contexte.module.estimated_minutes} min)</strong>
            <p style={{ marginTop: 8 }}>
              Offre: {contexte.entretien.offre_titre} - Entretien le{" "}
              {new Date(contexte.entretien.date_heure).toLocaleString("fr-FR")}
            </p>
          </div>

          {!sessionDemarree ? (
            <div className="page-header-actions">
              <Button onClick={() => void demarrer()}>Commencer</Button>
              <ButtonLink href="/candidat/entretiens" variant="secondary">Pas maintenant</ButtonLink>
            </div>
          ) : (
            <>
              <p>Etape {etape} / {etapes.length - 1}: {etapes[etape]}</p>

              {etape === 1 ? (
                <Card padding="md">
                  <strong>Respiration guidee 4-7-8</strong>
                  <p style={{ marginTop: 8 }}>{phaseRespiration} ({timerRespiration}s)</p>
                  <p style={{ marginTop: 8 }}>Suivez le rythme: inspirez 4s, retenez 7s, expirez 8s.</p>
                </Card>
              ) : null}

              {etape === 2 ? (
                <Card padding="md">
                  <strong>Visualisation positive</strong>
                  <p style={{ marginTop: 8 }}>{contexte.module.visualization_prompt}</p>
                </Card>
              ) : null}

              {etape === 3 ? (
                <Card padding="md">
                  <strong>Vos 3 points forts</strong>
                  <ul>
                    {contexte.points_forts.map((point, index) => (
                      <li key={`${index}-${point}`}>{point}</li>
                    ))}
                  </ul>
                  <p style={{ marginTop: 8, opacity: 0.8 }}>
                    Source: {contexte.source_points_forts === "claude" ? "profil personnalise" : "mode standard"}
                  </p>
                </Card>
              ) : null}

              <div className="page-header-actions">
                {etape > 1 ? (
                  <Button variant="secondary" onClick={() => setEtape((current) => current - 1)}>
                    Etape precedente
                  </Button>
                ) : (
                  <span />
                )}

                {etape < 3 ? (
                  <Button onClick={() => setEtape((current) => Math.min(3, current + 1))}>
                    Etape suivante
                  </Button>
                ) : (
                  <Button onClick={() => void terminer()}>Terminer</Button>
                )}
              </div>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}
