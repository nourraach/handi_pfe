"use client";

import { useEffect, useMemo, useState } from "react";
import { RouteProtegee } from "@/components/route-protegee";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LoadingState } from "@/components/ui/layout";
import { authenticatedFetch, getUtilisateurConnecte } from "@/lib/auth-utils";
import { construireUrlApi } from "@/lib/config";

type StatItem = { statut: string; count: number };

const trustedPartners = ["Réseau emploi inclusif", "Passerelle carrière", "Talents accessibles", "Compétences d'avenir", "Travail ouvert"];

const featureCards = [
  {
    title: "Parcours d'offres accessible",
    text: "Passez de la découverte à la candidature avec une lecture plus claire et moins de friction visuelle.",
  },
  {
    title: "Outils de préparation ciblés",
    text: "Gardez votre CV, vos évaluations, votre messagerie et vos entretiens à portée de main sans vous perdre dans l'administratif.",
  },
  {
    title: "Une progression visible",
    text: "Votre espace met en avant les avancées concrètes pour rendre chaque prochaine étape lisible et utile.",
  },
];

const quickLinks = [
  { title: "Voir les offres", text: "Explorez les offres qui correspondent à votre profil.", href: "/offres" },
  { title: "Candidatures", text: "Suivez l'état de chaque candidature en temps réel.", href: "/candidat/candidatures" },
  { title: "CV", text: "Mettez votre parcours en valeur avant l'ouverture de votre profil.", href: "/candidat/cv" },
  { title: "Messagerie", text: "Restez en contact avec les entreprises et les administrateurs.", href: "/messages" },
];

function CandidateWorkspacePage() {
  const [stats, setStats] = useState<StatItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const utilisateur = getUtilisateurConnecte();

  useEffect(() => {
    void charger();
  }, []);

  const charger = async () => {
    try {
      setLoading(true);
      const res = await authenticatedFetch(construireUrlApi("/api/candidatures/mes-statistiques"));
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Impossible de charger vos statistiques.");
      }
      setStats(Array.isArray(data.donnees) ? data.donnees : []);
      setErreur(null);
    } catch (cause: unknown) {
      setErreur(cause instanceof Error ? cause.message : "Impossible de charger vos statistiques.");
    } finally {
      setLoading(false);
    }
  };

  const statsMap = useMemo(
    () =>
      stats.reduce<Record<string, number>>((acc, item) => {
        acc[item.statut] = Number(item.count) || 0;
        return acc;
      }, {}),
    [stats],
  );

  const total = Object.values(statsMap).reduce((sum, count) => sum + count, 0);
  const pending = statsMap.pending || 0;
  const shortlisted = statsMap.shortlisted || 0;
  const accepted = statsMap.accepted || 0;
  const firstName = utilisateur?.nom?.split(" ")[0] || "ami";
  const hasNoApplications = total === 0;

  if (loading) {
    return (
      <main className="page-centree section-page app-theme">
        <LoadingState
          title="Chargement de votre espace"
          description="Preparation de vos opportunites et de votre progression."
        />
      </main>
    );
  }

  return (
    <div className="candidate-workspace-page" aria-live="polite">
      <section className="candidate-workspace-hero">
        <div className="candidate-workspace-copy">
          <p className="candidate-workspace-kicker">Espace candidat</p>
          <h1>
            Construisez la suite de votre parcours
            <br />
            avec plus de clarté,
            <br />
            de confiance et d&apos;élan.
          </h1>
          <p className="candidate-workspace-intro">
            Bon retour, {firstName}. Cet espace vous aide à naviguer entre offres, candidatures, entretiens et préparation avec plus de lisibilité.
          </p>

          <div className="candidate-workspace-actions">
            <ButtonLink href="/offres">Voir les offres</ButtonLink>
            <ButtonLink href="/candidat/candidatures" variant="secondary">
              Voir les candidatures
            </ButtonLink>
          </div>

          <div className="candidate-workspace-trust">
            <div className="candidate-workspace-mini-avatars" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
            <p>Conçu pour un parcours candidat plus accessible, plus lisible et plus inclusif.</p>
          </div>
        </div>

          <div className="candidate-workspace-visual">
          <div className="candidate-workspace-portrait">
            <div className="candidate-workspace-image-placeholder">
              Parcours candidat
            </div>
          </div>

          <div className="candidate-workspace-floating candidate-workspace-floating-top">
            <strong>{shortlisted}</strong>
            <span>Offres en présélection</span>
          </div>

          <div className="candidate-workspace-floating candidate-workspace-floating-bottom">
            <strong>{accepted}</strong>
            <span>Réponses positives</span>
          </div>
        </div>
      </section>

      <section className="candidate-workspace-partners">
        <p>Adopté dans des écosystèmes de recrutement inclusif et d&apos;accompagnement des candidats</p>
        <div className="candidate-workspace-partner-row">
          {trustedPartners.map((partner) => (
            <span key={partner}>{partner}</span>
          ))}
        </div>
      </section>

      {erreur ? <div className="message message-erreur" role="alert">{erreur}</div> : null}

      {hasNoApplications ? (
        <Card padding="lg" className="empty-state">
          <strong>Vous n&apos;avez pas encore postule</strong>
          <p>Explorez les offres et lancez votre premiere candidature pour demarrer votre parcours.</p>
          <div className="page-header-actions empty-state-action">
            <ButtonLink href="/offres">Explorer les offres</ButtonLink>
          </div>
        </Card>
      ) : null}

      <section className="candidate-workspace-stats">
        <Card padding="lg" interactive>
          <span>Total des candidatures</span>
          <strong>{total}</strong>
          <p>L&apos;ensemble des candidatures déjà envoyées.</p>
        </Card>
        <Card padding="lg" interactive>
          <span>En attente de revue</span>
          <strong>{pending}</strong>
          <p>Offres encore en cours d&apos;examen par les employeurs.</p>
        </Card>
        <Card padding="lg" interactive>
          <span>Présélection</span>
          <strong>{shortlisted}</strong>
          <p>Offres où votre profil avance dans le processus.</p>
        </Card>
        <Card padding="lg" interactive>
          <span>Acceptées</span>
          <strong>{accepted}</strong>
          <p>Avancées concrètes déjà obtenues dans votre parcours.</p>
        </Card>
      </section>

      <section className="candidate-workspace-value">
        <div className="candidate-workspace-section-head">
          <p className="candidate-workspace-kicker">Ce qui distingue cet espace</p>
          <h2>Un espace plus humain, plus soutenant et mieux structuré.</h2>
        </div>

        <div className="candidate-workspace-feature-grid">
          {featureCards.map((item) => (
            <Card key={item.title} padding="lg" className="candidate-workspace-feature-card" interactive>
              <div className="candidate-workspace-feature-icon" aria-hidden="true" />
              <strong>{item.title}</strong>
              <p>{item.text}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="candidate-workspace-actions-grid">
        <div className="candidate-workspace-section-head">
          <p className="candidate-workspace-kicker">Actions rapides</p>
          <h2>Accédez directement aux parties de la plateforme qui comptent le plus aujourd&apos;hui.</h2>
        </div>

        <div className="candidate-workspace-link-grid">
          {quickLinks.map((item) => (
            <Card key={item.title} padding="lg" interactive>
              <div className="candidate-workspace-link-card">
                <strong>{item.title}</strong>
                <p>{item.text}</p>
                <ButtonLink href={item.href} variant="secondary">
                  Ouvrir
                </ButtonLink>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}

export default function ProtectedCandidateWorkspacePage() {
  return (
    <RouteProtegee rolesAutorises={["candidat"]}>
      <CandidateWorkspacePage />
    </RouteProtegee>
  );
}
