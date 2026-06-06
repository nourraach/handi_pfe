"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import type { ReactNode } from "react";
import {
  BriefcaseBusiness,
  Building2,
  FileCheck2,
  LayoutDashboard,
  Users,
} from "lucide-react";
import styles from "@/components/supervision/supervision-redesign.module.css";

function classes(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export function SupervisionShell({
  badge,
  title,
  description,
  children,
  actions,
}: {
  badge?: string;
  title?: string;
  description?: string;
  children: ReactNode;
  actions?: ReactNode;
}) {
  const pathname = usePathname();
  const { utilisateur, deconnexion } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const isSupervisionUser = utilisateur?.role === "inspecteur" || utilisateur?.role === "aneti";
  const navItems = [
    { href: "/supervision", label: "Supervision", icon: LayoutDashboard },
    { href: "/supervision/pipeline", label: "Entreprises", icon: Building2 },
    { href: "/supervision/offers", label: "Offres publiees", icon: BriefcaseBusiness },
    { href: "/supervision/candidates", label: "Candidats visibles", icon: Users },
    { href: "/supervision/reports", label: "Rapports de conformite", icon: FileCheck2 },
  ];
  const profileName = utilisateur?.nom || "Inspecteur 1";
  const roleLabel = (utilisateur?.role || "inspecteur").toUpperCase();
  const profileSubtitle = utilisateur?.role === "aneti" ? "ANETI" : "Inspecteur regional";
  const avatarLetter = profileName.trim().charAt(0).toUpperCase() || "I";
  const sidebarItems = isSupervisionUser ? navItems : [];

  return (
    <div className={styles.shellLayout}>
      <aside className={styles.sidebar} aria-label="Navigation inspecteur">
        <div className={styles.sidebarBrand}>
          <Link href="/supervision" className={styles.brandLink} aria-label="Aller au tableau de supervision">
            <span className={styles.brandMark} aria-hidden="true">
              <Image
                src="/branding/logo-handitalents.png"
                alt="HandiTalents"
                width={30}
                height={30}
                className={styles.logoImage}
                priority
              />
            </span>
            <span className={styles.brandCopy}>
              <strong>HandiTalents</strong>
              <span>{profileSubtitle}</span>
            </span>
          </Link>
          <span className={styles.rolePill}>{roleLabel}</span>
        </div>

        <p className={styles.sidebarSectionLabel}>Navigation</p>
        <nav className={styles.sidebarNav}>
          {sidebarItems.map((item) => {
            const active = item.href === "/supervision"
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} className={classes(styles.sidebarNavItem, active && styles.sidebarNavItemActive)}>
                <span className={styles.sidebarNavItemIcon} aria-hidden="true">
                  <Icon size={17} aria-hidden="true" />
                </span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className={styles.sidebarProfileWrap}>
          <button
            type="button"
            className={styles.sidebarProfile}
            onClick={() => setProfileOpen((current) => !current)}
            aria-expanded={profileOpen}
            aria-controls="supervision-profile-actions"
          >
            <span className={styles.sidebarAvatar} aria-hidden="true">
              {avatarLetter}
            </span>
            <div className={styles.sidebarProfileText}>
              <strong>{profileName}</strong>
              <small>{profileSubtitle}</small>
            </div>
          </button>
          {profileOpen ? (
            <div id="supervision-profile-actions" className={styles.sidebarProfileActions}>
              <button type="button" className={styles.sidebarProfileActionLink} onClick={deconnexion}>
                Deconnecter
              </button>
            </div>
          ) : null}
        </div>
      </aside>

      <div className={styles.mainRegion}>
        {badge || title || description || actions ? (
          <header className={styles.pageHeader}>
            <div className={styles.pageHeaderCopy}>
              {badge ? <p className={styles.pageBadge}>{badge}</p> : null}
              {title ? <h1 className={styles.pageTitle}>{title}</h1> : null}
              {description ? <p className={styles.pageSubtitle}>{description}</p> : null}
            </div>
            {actions ? <div className={styles.pageHeaderActions}>{actions}</div> : null}
          </header>
        ) : null}

        <div className={styles.pageContent}>{children}</div>
      </div>
    </div>
  );
}
