"use client";

import { EmptyState, LoadingState } from "@/components/ui/layout";
import { SupervisionShell } from "@/components/supervision/supervision-shell";
import { useSupervisionQuery } from "@/components/supervision/use-supervision-query";
import { OfferPerformance } from "@/lib/supervision";
import styles from "@/components/supervision/supervision-redesign.module.css";

export function OffersPerformanceView() {
  const offers = useSupervisionQuery<OfferPerformance[]>("/offers");

  if (offers.loading) {
    return <LoadingState title="Chargement des performances des offres" description="Recuperation des offres, des vues et des resultats de recrutement." />;
  }

  if (offers.error || !offers.data) {
    return <EmptyState title="Offres indisponibles" description={offers.error || "Aucune offre n a pu etre chargee pour la supervision."} />;
  }

  return (
    <SupervisionShell>
      <section className={styles.sectionStack}>
        <section className={styles.tableWrap}>
          <div className={styles.tableHeader}>
            <div>
              <h4>Registre detaille des offres</h4>
              <p>Conservez la vue tabulaire pour les comparaisons fines et le suivi ligne par ligne.</p>
            </div>
          </div>

          <table className={styles.table}>
            <thead>
              <tr>
                <th>Entreprise</th>
                <th>Offre</th>
                <th>Region</th>
                <th>Vues</th>
                <th>Candidatures</th>
                <th>Preselection</th>
                <th>Acceptes</th>
              </tr>
            </thead>
            <tbody>
              {offers.data.map((offer) => (
                <tr key={offer.offer_id}>
                  <td>{offer.company_name}</td>
                  <td>
                    <div className={styles.tablePrimaryCell}>
                      <strong>{offer.offer_title}</strong>
                      <span>{offer.type_poste} · {offer.offer_status}</span>
                    </div>
                  </td>
                  <td>{offer.region}</td>
                  <td>{offer.views_count}</td>
                  <td>{offer.applications_count}</td>
                  <td>{offer.shortlisted_count}</td>
                  <td>{offer.hired_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </section>
    </SupervisionShell>
  );
}
