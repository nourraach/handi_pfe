"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const APP_NAME = "HandiTalents";

const ROUTE_TITLES: Record<string, string> = {
  "/": "Accueil",
  "/home": "Accueil",
  "/landing-demo": "Demo",
  "/connexion": "Connexion",
  "/inscription": "Inscription",
  "/inscription/candidat": "Inscription candidat",
  "/inscription/entreprise": "Inscription entreprise",
  "/activer": "Activation du compte",
  "/reset": "Reinitialisation du mot de passe",
  "/reset/demander": "Demande de reinitialisation",
  "/offres": "Offres d'emploi",
  "/favoris": "Favoris",
  "/messages": "Messages",
  "/notifications": "Notifications",
  "/profil": "Profil",

  "/candidat/dashboard": "Tableau de bord candidat",
  "/candidat/candidatures": "Mes candidatures",
  "/candidat/cv": "Mon CV",
  "/candidat/entretiens": "Mes entretiens",
  "/candidat/tests-entretien": "Tests d'entretien",
  "/candidat/tests-psychologiques": "Tests psychologiques",
  "/candidat/chatbot": "Chatbot IA",
  "/candidat/avis": "Avis candidat",

  "/entreprise/dashboard": "Tableau de bord entreprise",
  "/entreprise/offres": "Offres entreprise",
  "/entreprise/candidatures": "Candidatures recues",
  "/entreprise/candidats": "Candidats",
  "/entreprise/entretiens": "Entretiens entreprise",
  "/entreprise/profil": "Profil entreprise",
  "/entreprise/tests-entretien": "Tests d'entretien entreprise",
  "/entreprise/reports-requests": "Demandes de rapports",
  "/entreprise/reports-requests/transfer": "Transfert de rapports",
  "/entreprise/reports-requests/compliance": "Conformite des rapports",

  "/admin/comptes": "Gestion des comptes",
  "/admin/demandes-en-attente": "Demandes en attente",
  "/admin/utilisateurs": "Gestion des utilisateurs",
  "/admin/applications": "Gestion des candidatures",
  "/admin/entretiens": "Gestion des entretiens",
  "/admin/offres-publication": "Publication des offres",
  "/admin/tests-psychologiques": "Tests psychologiques admin",
  "/admin/reports": "Rapports admin",
  "/admin/statistiques": "Statistiques admin",

  "/supervision": "Supervision",
  "/supervision/pipeline": "Pipeline de supervision",
  "/supervision/reports": "Rapports de supervision",
  "/supervision/offers": "Offres supervisees",
  "/supervision/candidates": "Candidats supervises",

  "/design-system-test": "Design system",
  "/ui-components-demo": "Composants UI",
};

const DYNAMIC_ROUTE_TITLES: Array<{ pattern: RegExp; title: string }> = [
  {
    pattern: /^\/admin\/utilisateurs\/[^/]+$/,
    title: "Detail utilisateur",
  },
  {
    pattern: /^\/candidat\/candidatures\/[^/]+\/preparation-entretien$/,
    title: "Preparation entretien",
  },
  {
    pattern: /^\/candidat\/entretiens\/[^/]+\/bien-etre$/,
    title: "Bien-etre avant entretien",
  },
  {
    pattern: /^\/entreprise\/reports-requests\/reports\/[^/]+$/,
    title: "Detail rapport",
  },
];

function formatSegment(segment: string) {
  return segment
    .replace(/-/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function titleFromPathname(pathname: string) {
  const normalizedPathname = pathname.length > 1 ? pathname.replace(/\/$/, "") : pathname;
  const routeTitle = ROUTE_TITLES[normalizedPathname];

  if (routeTitle) {
    return routeTitle;
  }

  const dynamicRoute = DYNAMIC_ROUTE_TITLES.find(({ pattern }) => pattern.test(normalizedPathname));

  if (dynamicRoute) {
    return dynamicRoute.title;
  }

  const lastSegment = normalizedPathname.split("/").filter(Boolean).at(-1);

  return lastSegment ? formatSegment(lastSegment) : APP_NAME;
}

export function DocumentTitle() {
  const pathname = usePathname();

  useEffect(() => {
    const updateTitle = () => {
      const currentPathname = pathname ?? window.location.pathname ?? "/";
      const pageTitle = titleFromPathname(currentPathname);
      document.title = pageTitle === APP_NAME ? APP_NAME : `${pageTitle} - ${APP_NAME}`;
    };

    updateTitle();
    const animationFrameId = window.requestAnimationFrame(updateTitle);
    const timeoutId = window.setTimeout(updateTitle, 100);

    return () => {
      window.cancelAnimationFrame(animationFrameId);
      window.clearTimeout(timeoutId);
    };
  }, [pathname]);

  return null;
}
