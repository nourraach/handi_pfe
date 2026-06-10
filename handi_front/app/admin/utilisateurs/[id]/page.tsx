"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { ProfilAdmin } from "@/components/profil-admin";
import { ProfilCandidatPublic } from "@/components/profil-candidat-public";
import { ProfilEntreprise } from "@/components/profil-entreprise";
import { ProfilInspecteurAneti } from "@/components/profil-inspecteur-aneti";
import { useI18n } from "@/components/i18n-provider";
import { EmptyState, LoadingState, PageHeader } from "@/components/ui/layout";
import { construireUrlApi } from "@/lib/config";
import { UtilisateurConnecte } from "@/types/api";

type AdminUserDetails = UtilisateurConnecte & {
  telephone?: string;
  addresse?: string;
  gouvernorat?: string;
  delegation?: string;
};

export default function AdminUtilisateurProfilPage() {
  const params = useParams<{ id: string }>();
  const { t } = useI18n();
  const [utilisateurCible, setUtilisateurCible] = useState<AdminUserDetails | null>(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    const id = typeof params?.id === "string" ? params.id : "";
    if (!id) {
      setErreur("Utilisateur introuvable.");
      setChargement(false);
      return;
    }

    const chargerUtilisateur = async () => {
      setChargement(true);
      setErreur(null);

      try {
        const token = localStorage.getItem("token_auth");
        const response = await fetch(construireUrlApi(`/api/admin/utilisateurs/${id}`), {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        const data = (await response.json().catch(() => null)) as
          | { donnees?: Partial<AdminUserDetails>; utilisateur?: Partial<AdminUserDetails>; message?: string }
          | null;

        if (!response.ok) {
          throw new Error(data?.message || "Impossible de charger ce profil.");
        }

        const donnees = data?.donnees || data?.utilisateur;
        if (!donnees?.id_utilisateur || !donnees?.role) {
          throw new Error("Profil utilisateur introuvable.");
        }

        setUtilisateurCible({
          id_utilisateur: String(donnees.id_utilisateur),
          nom: String(donnees.nom || ""),
          email: String(donnees.email || ""),
          role: String(donnees.role || ""),
          statut: String(donnees.statut || ""),
          region: String(donnees.region || donnees.delegation || donnees.gouvernorat || ""),
          telephone: donnees.telephone,
          addresse: donnees.addresse,
          gouvernorat: donnees.gouvernorat,
          delegation: donnees.delegation,
        });
      } catch (cause) {
        setErreur(cause instanceof Error ? cause.message : "Impossible de charger ce profil.");
      } finally {
        setChargement(false);
      }
    };

    void chargerUtilisateur();
  }, [params?.id]);

  const roleLabel = useMemo(() => {
    if (!utilisateurCible?.role) {
      return "";
    }
    return t(`common.roles.${utilisateurCible.role}`);
  }, [t, utilisateurCible?.role]);

  const renderProfil = () => {
    if (!utilisateurCible) {
      return null;
    }

    switch (utilisateurCible.role) {
      case "candidat":
        return <ProfilCandidatPublic utilisateur={utilisateurCible} />;
      case "entreprise":
        return <ProfilEntreprise utilisateur={utilisateurCible} lectureSeule />;
      case "admin":
        return <ProfilAdmin utilisateur={utilisateurCible} lectureSeule />;
      case "inspecteur":
      case "aneti":
        return <ProfilInspecteurAneti utilisateur={utilisateurCible} lectureSeule />;
      default:
        return (
          <EmptyState
            title="Type de profil non pris en charge"
            description="Ce compte existe, mais son interface de profil n'est pas disponible."
          />
        );
    }
  };

  return (
    <div className="app-page">
      <PageHeader
        badge="Administration"
        title={utilisateurCible?.nom || "Profil utilisateur"}
        description={
          utilisateurCible
            ? `${roleLabel} · ${utilisateurCible.email}`
            : "Consultez le profil complet de cet utilisateur."
        }
        actions={
          <Link
            href="/admin/utilisateurs"
            className="inline-flex min-h-10 items-center rounded-md border border-[rgba(74,21,75,0.18)] bg-white px-4 text-sm font-semibold text-[#4a154b] transition hover:border-[rgba(74,21,75,0.28)] hover:bg-[#f8f3fb]"
          >
            Retour a la liste
          </Link>
        }
      />

      {chargement ? (
        <LoadingState
          title={t("common.loadingWorkspaceTitle")}
          description="Chargement du profil utilisateur."
        />
      ) : erreur ? (
        <EmptyState
          title="Profil indisponible"
          description={erreur}
          action={
            <Link
              href="/admin/utilisateurs"
              className="inline-flex min-h-10 items-center rounded-md border border-[rgba(74,21,75,0.18)] bg-white px-4 text-sm font-semibold text-[#4a154b] transition hover:border-[rgba(74,21,75,0.28)] hover:bg-[#f8f3fb]"
            >
              Retour a la liste
            </Link>
          }
        />
      ) : (
        renderProfil()
      )}
    </div>
  );
}
