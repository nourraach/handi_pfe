"use client";

import { FormulaireInscriptionEntreprise } from "@/components/formulaire-inscription-entreprise";
import { Card } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import styles from "./page.module.css";

export default function InscriptionEntreprisePage() {
  return (
    <main className={styles.page}>
      <section className={styles.shell}>
        <Card className={styles.card} padding="md">
          <div className={styles.top}>
            <ButtonLink href="/inscription" variant="ghost" size="sm" className={styles.backLink}>
              Retour
            </ButtonLink>
            <h1 className={styles.title}>Inscription entreprise</h1>
            <ButtonLink href="/" variant="ghost" size="sm" className={styles.homeLink}>
              Accueil
            </ButtonLink>
          </div>

          <FormulaireInscriptionEntreprise />
        </Card>
      </section>
    </main>
  );
}
