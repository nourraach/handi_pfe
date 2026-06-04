import { ButtonLink } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="app-theme error-page">
      <section className="error-panel">
        <p className="badge">Page introuvable</p>
        <h1 className="page-title page-title-sm">Cette page n'existe pas</h1>
        <p className="page-description">Retournez a l'accueil pour continuer votre parcours.</p>
        <ButtonLink href="/home">Retour a l'accueil</ButtonLink>
      </section>
    </main>
  );
}
