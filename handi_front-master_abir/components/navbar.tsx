"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useAccessibility } from "@/components/accessibility-provider";
import { triggerAccessibilityPanel } from "@/components/accessibility-widget";
import { useI18n } from "@/components/i18n-provider";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ButtonLink } from "@/components/ui/button";
import { authenticatedFetch } from "@/lib/auth-utils";
import { construireUrlApi } from "@/lib/config";
import {
  countUnreadIncomingMessages,
  isConversationUnread,
  MESSAGE_READ_STATE_EVENT,
  MESSAGE_READ_STATE_KEY,
  readMessageReadState,
  type MessageConversationSummary,
  type MessageSummary,
} from "@/lib/message-read-state";
import { UtilisateurConnecte } from "@/types/api";

interface NavbarProps {
  utilisateur: UtilisateurConnecte;
  candidateSidebarCollapsed?: boolean;
  onToggleCandidateSidebar?: () => void;
}

type NavLinkItem = {
  href: string;
  label: string;
  badgeCount?: number;
};

type NavGroupItem = {
  id: string;
  label: string;
  items: NavLinkItem[];
  badgeCount?: number;
};

type NavItem = NavLinkItem | NavGroupItem;

type ShortcutEntry = {
  key: string;
  label: string;
  href?: string;
  menuId?: string;
  items?: Array<{ key: string; label: string; href: string }>;
};

type CandidateIconName =
  | "dashboard"
  | "skills"
  | "tests"
  | "cv"
  | "achievements"
  | "favorites"
  | "applications"
  | "messages"
  | "profile"
  | "settings"
  | "accessibility";

type CandidateProfilePayload = {
  photo_profil_url?: string | null;
};

function CandidateSidebarIcon({ name }: { name: CandidateIconName }) {
  const props = {
    width: 20,
    height: 20,
    viewBox: "0 0 24 24",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    stroke: "currentColor",
    strokeWidth: 1.9,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  switch (name) {
    case "dashboard":
      return (
        <svg {...props}>
          <path d="M3 11.5 12 4l9 7.5" />
          <path d="M5.5 10.5V20h13V10.5" />
        </svg>
      );
    case "skills":
      return (
        <svg {...props}>
          <path d="M12 20s-7-3.8-7-9a4 4 0 0 1 7-2.5A4 4 0 0 1 19 11c0 5.2-7 9-7 9Z" />
        </svg>
      );
    case "tests":
      return (
        <svg {...props}>
          <rect x="5" y="4" width="14" height="16" rx="2" />
          <path d="M9 2v4M15 2v4M8.5 11h7M8.5 15h5" />
        </svg>
      );
    case "cv":
      return (
        <svg {...props}>
          <path d="M7 3h7l4 4v14H7z" />
          <path d="M14 3v4h4M10 12h6M10 16h6" />
        </svg>
      );
    case "achievements":
      return (
        <svg {...props}>
          <path d="M8 6h8v3a4 4 0 0 1-8 0V6Z" />
          <path d="M6 7H4a3 3 0 0 0 3 3M18 7h2a3 3 0 0 1-3 3" />
          <path d="M12 13v4M9 21h6" />
        </svg>
      );
    case "favorites":
      return (
        <svg {...props}>
          <path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.8 1-6.1L3.2 9.4l6.1-.9L12 3Z" />
        </svg>
      );
    case "applications":
      return (
        <svg {...props}>
          <path d="M3.5 8h17v11.5h-17z" />
          <path d="M9 8V6.5A3 3 0 0 1 12 3.5h0a3 3 0 0 1 3 3V8" />
        </svg>
      );
    case "messages":
      return (
        <svg {...props}>
          <path d="M20 12a8 8 0 0 1-8 8H5l2-3.5A8 8 0 1 1 20 12Z" />
        </svg>
      );
    case "profile":
      return (
        <svg {...props}>
          <circle cx="12" cy="8" r="3.2" />
          <path d="M5.5 20a6.5 6.5 0 0 1 13 0" />
        </svg>
      );
    case "settings":
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="3.2" />
          <path d="m19 12 1.8 1-.8 2-2-.1a7.7 7.7 0 0 1-1.4 1.4l.1 2-2 .8-1-1.8a7.7 7.7 0 0 1-2 0l-1 1.8-2-.8.1-2A7.7 7.7 0 0 1 6 15l-2 .1-.8-2L5 12l-1.8-1 .8-2 2 .1A7.7 7.7 0 0 1 8.4 7.7l-.1-2 2-.8 1 1.8a7.7 7.7 0 0 1 2 0l1-1.8 2 .8-.1 2A7.7 7.7 0 0 1 18 9.1l2-.1.8 2Z" />
        </svg>
      );
    case "accessibility":
      return (
        <svg {...props}>
          <circle cx="12" cy="4" r="2" />
          <path d="M5 9h14M12 9v8M9.5 9l-2 5M14.5 9l2 5" />
        </svg>
      );
    default:
      return null;
  }
}

function classes(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function hasItems(item: NavItem): item is NavGroupItem {
  return "items" in item;
}

function normalizeShortcutLabel(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "")
    .toLocaleLowerCase();
}

function buildUniqueShortcuts(entries: Array<{ label: string; href?: string; menuId?: string; items?: NavLinkItem[] }>): ShortcutEntry[] {
  const normalized = entries.map((entry) => ({
    ...entry,
    normalizedLabel: normalizeShortcutLabel(entry.label),
  }));

  return normalized.map((entry) => {
    let length = 1;
    while (
      length < entry.normalizedLabel.length &&
      normalized.some(
        (other) => other !== entry && other.normalizedLabel.startsWith(entry.normalizedLabel.slice(0, length)),
      )
    ) {
      length += 1;
    }

    const key = entry.normalizedLabel.slice(0, length);
    const childItems = entry.items
      ? buildUniqueShortcuts(entry.items.map((item) => ({ label: item.label, href: item.href }))).map((item) => ({
          key: item.key,
          label: item.label,
          href: item.href || "",
        }))
      : undefined;

    return {
      key,
      label: entry.label,
      href: entry.href,
      menuId: entry.menuId,
      items: childItems,
    };
  });
}

export function Navbar({
  utilisateur,
  candidateSidebarCollapsed = false,
  onToggleCandidateSidebar,
}: NavbarProps) {
  const { t } = useI18n();
  const { settings } = useAccessibility();
  const router = useRouter();
  const pathname = usePathname();
  const [menuOuvert, setMenuOuvert] = useState(false);
  const [profilMenuOuvert, setProfilMenuOuvert] = useState(false);
  const [profileMenuPlacement, setProfileMenuPlacement] = useState<"down" | "up">("down");
  const [profileMenuMaxHeight, setProfileMenuMaxHeight] = useState<number>(420);
  const [notificationsNonLues, setNotificationsNonLues] = useState(0);
  const [messagesNonLus, setMessagesNonLus] = useState(0);
  const [candidateProfilePhoto, setCandidateProfilePhoto] = useState<string | null>(null);
  const [navigationMenuOuvert, setNavigationMenuOuvert] = useState<string | null>(null);
  const [keyboardBuffer, setKeyboardBuffer] = useState("");
  const [keyboardGuideVisible, setKeyboardGuideVisible] = useState(false);
  const headerRef = useRef<HTMLElement | null>(null);
  const profileShellRef = useRef<HTMLDivElement | null>(null);
  const keyboardBufferTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isCandidate = utilisateur.role === "candidat";
  const isAdmin = utilisateur.role === "admin";
  const isEntreprise = utilisateur.role === "entreprise";
  const usesReferenceSidebar = isCandidate || isEntreprise || isAdmin;
  const hasCollapsibleSidebar = utilisateur.role === "candidat";
  const keyboardModeEnabled = settings.keyboardMoveMode;
  const keyboardAnnouncement = keyboardModeEnabled ? t("accessibility.keyboardAnnouncement") : "";
  const socialBadgeCount = notificationsNonLues + messagesNonLus;

  const liens = useMemo(() => {
    if (utilisateur.role === "candidat") {
      return [
        { href: "/home", label: t("navbar.workspace") },
        {
          id: "explore-jobs",
          label: t("navbar.exploreJobs"),
          items: [
            { href: "/offres", label: t("navbar.jobs") },
            { href: "/favoris", label: t("navbar.favorites") },
          ],
        },
        {
          id: "applications",
          label: t("navbar.applications"),
          items: [
            { href: "/candidat/candidatures", label: t("navbar.applications") },
            { href: "/candidat/entretiens", label: t("navbar.interviews") },
            { href: "/candidat/cv", label: t("navbar.cvBuilder") },
            { href: "/candidat/avis", label: "Avis entreprises" },
          ],
        },
        {
          id: "social",
          label: t("navbar.social"),
          badgeCount: socialBadgeCount,
          items: [
            { href: "/messages", label: t("navbar.messages"), badgeCount: messagesNonLus },
            { href: "/notifications", label: t("navbar.notifications"), badgeCount: notificationsNonLues },
          ],
        },
        { href: "/candidat/tests-psychologiques", label: t("navbar.assessments") },
      ] satisfies NavItem[];
    }

    if (utilisateur.role === "admin") {
      return [
        { href: "/home", label: t("navbar.workspace") },
        {
          id: "admin-accounts",
          label: t("navbar.accounts"),
          items: [
            { href: "/admin/comptes", label: t("navbar.accounts") },
            { href: "/admin/utilisateurs", label: t("home.workspace.admin.actions.usersTitle") },
          ],
        },
        {
          id: "admin-operations",
          label: t("navbar.insights"),
          items: [
            { href: "/admin/tests-psychologiques", label: "Tests psychologiques" },
            { href: "/admin/offres-publication", label: "Validation offres" },
          ],
        },
        {
          id: "admin-social",
          label: t("navbar.social"),
          badgeCount: socialBadgeCount,
          items: [
            { href: "/messages", label: t("navbar.messages"), badgeCount: messagesNonLus },
            { href: "/notifications", label: t("navbar.notifications"), badgeCount: notificationsNonLues },
          ],
        },
      ] satisfies NavItem[];
    }

    if (utilisateur.role === "entreprise") {
      return [
        { href: "/home", label: t("navbar.workspace") },
        { href: "/entreprise/reports-requests", label: t("navbar.reportsRequests") },
        {
          id: "entreprise-applications",
          label: t("navbar.applications"),
          items: [
            { href: "/entreprise/candidatures", label: "All applicants" },
            { href: "/entreprise/candidatures?status=shortlisted", label: "Shortlisted" },
            { href: "/entreprise/entretiens", label: "Planifier les entretiens" },
            { href: "/entreprise/candidatures?status=interview_scheduled", label: "Interviews planifies" },
            { href: "/entreprise/candidatures?status=accepted", label: "Hired" },
            { href: "/entreprise/offres", label: t("navbar.manageRoles") },
          ],
        },
        {
          id: "entreprise-job-listings",
          label: "Job listings",
          items: [
            { href: "/entreprise/offres", label: "All roles" },
            { href: "/entreprise/shortlist", label: "IA shortlisting" },
          ],
        },
        {
          id: "entreprise-social",
          label: t("navbar.social"),
          badgeCount: socialBadgeCount,
          items: [
            { href: "/messages", label: t("navbar.messages"), badgeCount: messagesNonLus },
            { href: "/notifications", label: t("navbar.notifications"), badgeCount: notificationsNonLues },
          ],
        },
      ] satisfies NavItem[];
    }

    if (utilisateur.role === "inspecteur" || utilisateur.role === "aneti") {
      return [
        { href: "/supervision", label: t("navbar.supervision") },
        { href: "/supervision/pipeline", label: "Entreprises" },
        { href: "/supervision/offers", label: "Offres" },
        { href: "/supervision/candidates", label: "Candidats" },
        { href: "/supervision/reports", label: "Rapports" },
      ] satisfies NavItem[];
    }

    return [
      { href: "/home", label: t("navbar.workspace") },
      { href: "/admin/comptes", label: t("navbar.accounts") },
      { href: "/admin/tests-psychologiques", label: t("navbar.assessments") },
    ] satisfies NavItem[];
  }, [messagesNonLus, notificationsNonLues, socialBadgeCount, t, utilisateur.role]);

  const primaryAction = useMemo(() => {
    if (utilisateur.role === "inspecteur" || utilisateur.role === "aneti") {
      return { href: "/supervision", label: t("navbar.openSupervision") };
    }

    return null;
  }, [t, utilisateur.role]);

  const profilHref = utilisateur.role === "entreprise" ? "/entreprise/profil" : "/profil";
  const roleChipLabel = utilisateur.role === "admin" ? "Super Admin" : t(`common.roles.${utilisateur.role}`);
  const roleBrandSubtitle = utilisateur.role === "admin" ? "Inclusive Hiring Platform" : roleChipLabel;
  type CandidateSidebarItem = {
    id: string;
    label: string;
    subtitle: string;
    icon: CandidateIconName;
    href: string;
    badgeCount?: number;
  };

  const candidateSidebarItems = useMemo<CandidateSidebarItem[]>(
    () => [
      { id: "jobs", label: "Offres d'emploi", subtitle: "Recherche", icon: "applications", href: "/offres" },
      { id: "applications", label: "Candidatures", subtitle: "Suivi", icon: "applications", href: "/candidat/candidatures" },
      { id: "interviews", label: "Entretiens", subtitle: "Planning candidat", icon: "tests", href: "/candidat/entretiens" },
      { id: "tests", label: "Tests & Évaluations", subtitle: "Progression", icon: "tests", href: "/candidat/tests-psychologiques" },
      { id: "messages", label: "Messagerie", subtitle: "Inbox", icon: "messages", href: "/messages", badgeCount: messagesNonLus },
      { id: "favorites", label: t("navbar.favorites"), subtitle: "Offres enregistrees", icon: "favorites", href: "/favoris" },
      { id: "cv", label: "CV Builder", subtitle: "Documents", icon: "cv", href: "/candidat/cv" },
    ],
    [messagesNonLus, t],
  );

  const adminSidebarItems: CandidateSidebarItem[] = [
    { id: "admin-dashboard", label: "Dashboard", subtitle: "Vue globale", icon: "dashboard", href: "/home" },
    { id: "admin-pending-requests", label: "Pending Requests", subtitle: "Inscriptions", icon: "messages", href: "/admin/demandes-en-attente" },
    { id: "admin-users", label: "Users", subtitle: "Gestion", icon: "messages", href: "/admin/utilisateurs" },
    { id: "admin-employers", label: "Employers", subtitle: "Entreprises", icon: "skills", href: "/admin/comptes" },
    { id: "admin-jobs", label: "Job Postings", subtitle: "Validation", icon: "cv", href: "/admin/offres-publication" },
    { id: "admin-apps", label: "Applications", subtitle: "Statuts", icon: "applications", href: "/admin/applications" },
    { id: "admin-interviews", label: "Interviews", subtitle: "Planning", icon: "tests", href: "/admin/entretiens" },
    { id: "admin-tests-psychologiques", label: "Tests psychologiques", subtitle: "Creation & gestion", icon: "tests", href: "/admin/tests-psychologiques" },
    { id: "admin-reports", label: "Reports", subtitle: "Entreprises", icon: "achievements", href: "/admin/reports" },
  ];

  const entrepriseSidebarItems = useMemo<CandidateSidebarItem[]>(
    () => [
      { id: "ent-home", label: "Accueil", subtitle: "Tableau de bord", icon: "dashboard", href: "/home" },
      { id: "ent-offers", label: "Offres d'emploi", subtitle: "Gestion des postes", icon: "cv", href: "/entreprise/offres" },
      { id: "ent-applications", label: "Candidatures", subtitle: "Suivi candidats", icon: "applications", href: "/entreprise/candidatures" },
      { id: "ent-interviews", label: "Entretiens", subtitle: "Planning & suivi", icon: "tests", href: "/entreprise/entretiens" },
      { id: "ent-shortlist", label: "IA Shortlisting", subtitle: "Preselection", icon: "tests", href: "/entreprise/shortlist" },
      { id: "ent-reports-requests", label: "Demandes de rapport", subtitle: "Conformite", icon: "achievements", href: "/entreprise/reports-requests" },
      { id: "ent-messages", label: "Messagerie", subtitle: "Inbox", icon: "messages", href: "/messages", badgeCount: messagesNonLus },
    ],
    [messagesNonLus],
  );

  const sidebarItems = isAdmin
    ? adminSidebarItems
    : isEntreprise
      ? entrepriseSidebarItems.filter((item) => item.href !== "/entreprise/profil" && item.icon !== "settings")
      : candidateSidebarItems;

  const isPathActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  const candidateShortcuts = useMemo(() => {
    if (!isCandidate) {
      return [];
    }

    return buildUniqueShortcuts(
      liens.map((item) =>
        hasItems(item)
          ? { label: item.label, menuId: item.id, items: item.items }
          : { label: item.label, href: item.href },
      ),
    );
  }, [isCandidate, liens]);

  useEffect(() => {
    const gererClicExterieur = (event: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(event.target as Node)) {
        setNavigationMenuOuvert(null);
        setProfilMenuOuvert(false);
      }
    };

    document.addEventListener("mousedown", gererClicExterieur);
    return () => {
      document.removeEventListener("mousedown", gererClicExterieur);
    };
  }, []);

  useEffect(() => {
    let actif = true;

    const chargerNotifications = async () => {
      try {
        const response = await authenticatedFetch(construireUrlApi("/api/notifications/non-lues/count"));
        const data = await response.json();
        if (!response.ok || !actif) {
          return;
        }
        setNotificationsNonLues(Number(data?.donnees?.count || 0));
      } catch {
        if (actif) {
          setNotificationsNonLues(0);
        }
      }
    };

    void chargerNotifications();

    const onNotificationsRead = () => {
      if (actif) {
        setNotificationsNonLues(0);
      }
    };

    window.addEventListener("notifications-marked-read", onNotificationsRead);

    return () => {
      actif = false;
      window.removeEventListener("notifications-marked-read", onNotificationsRead);
    };
  }, [pathname]);

  useEffect(() => {
    if (!["candidat", "entreprise", "admin"].includes(utilisateur.role)) {
      return;
    }

    let actif = true;

    const chargerMessagesNonLus = async () => {
      try {
        const response = await authenticatedFetch(construireUrlApi("/api/chat/conversations"));
        const data = await response.json();

        if (!response.ok || !actif) {
          return;
        }

        const conversations = Array.isArray(data?.donnees) ? (data.donnees as MessageConversationSummary[]) : [];
        const readState = readMessageReadState();
        const unreadConversations = conversations.filter((conversation) =>
          isConversationUnread(conversation, readState, utilisateur.id_utilisateur),
        );
        const unreadCounts = await Promise.all(
          unreadConversations.map(async (conversation) => {
            const messagesResponse = await authenticatedFetch(
              construireUrlApi(`/api/chat/conversations/${conversation.id}/messages`),
            );
            const messagesData = await messagesResponse.json();

            if (!messagesResponse.ok) {
              return 0;
            }

            const messages = Array.isArray(messagesData?.donnees) ? (messagesData.donnees as MessageSummary[]) : [];
            return countUnreadIncomingMessages(
              conversation.id,
              messages,
              readState,
              utilisateur.id_utilisateur,
            );
          }),
        );
        const unreadCount = unreadCounts.reduce((total, count) => total + count, 0);

        setMessagesNonLus(unreadCount);
      } catch {
        if (actif) {
          setMessagesNonLus(0);
        }
      }
    };

    void chargerMessagesNonLus();

    const onReadStateUpdated = () => {
      void chargerMessagesNonLus();
    };

    const onStorage = (event: StorageEvent) => {
      if (event.key === MESSAGE_READ_STATE_KEY) {
        void chargerMessagesNonLus();
      }
    };

    window.addEventListener(MESSAGE_READ_STATE_EVENT, onReadStateUpdated);
    window.addEventListener("storage", onStorage);

    return () => {
      actif = false;
      window.removeEventListener(MESSAGE_READ_STATE_EVENT, onReadStateUpdated);
      window.removeEventListener("storage", onStorage);
    };
  }, [pathname, utilisateur.id_utilisateur, utilisateur.role]);

  useEffect(() => {
    if (!isCandidate || !utilisateur.id_utilisateur) {
      return;
    }

    let actif = true;

    const chargerPhotoProfil = async () => {
      try {
        const response = await authenticatedFetch(
          construireUrlApi(`/api/candidats/profil/${utilisateur.id_utilisateur}`),
        );
        const data = await response.json();

        if (!response.ok || !actif) {
          setCandidateProfilePhoto(null);
          return;
        }

        const donnees = (data?.donnees || {}) as CandidateProfilePayload;
        const photo = donnees.photo_profil_url;

        if (!photo) {
          setCandidateProfilePhoto(null);
          return;
        }

        setCandidateProfilePhoto(photo.startsWith("data:") ? photo : construireUrlApi(photo));
      } catch {
        if (actif) {
          setCandidateProfilePhoto(null);
        }
      }
    };

    void chargerPhotoProfil();

    return () => {
      actif = false;
    };
  }, [isCandidate, utilisateur.id_utilisateur]);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      setNavigationMenuOuvert(null);
      setMenuOuvert(false);
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [pathname]);

  useEffect(() => {
    if (hasCollapsibleSidebar && candidateSidebarCollapsed) {
      const frameId = window.requestAnimationFrame(() => {
        setProfilMenuOuvert(false);
        setNavigationMenuOuvert(null);
        setMenuOuvert(false);
      });

      return () => {
        window.cancelAnimationFrame(frameId);
      };
    }
  }, [candidateSidebarCollapsed, hasCollapsibleSidebar]);

  useEffect(() => {
    if (!profilMenuOuvert) {
      return;
    }

    const updateProfileMenuLayout = () => {
      const shell = profileShellRef.current;
      if (!shell) {
        return;
      }

      const rect = shell.getBoundingClientRect();
      const viewportPadding = 16;
      const menuGap = 12;
      const defaultMaxHeight = 420;
      const minimumMenuHeight = 180;
      const availableBelow = window.innerHeight - rect.bottom - viewportPadding - menuGap;
      const availableAbove = rect.top - viewportPadding - menuGap;
      const placeUp = availableBelow < 240 && availableAbove > availableBelow;
      const availableHeight = placeUp ? availableAbove : availableBelow;

      setProfileMenuPlacement(placeUp ? "up" : "down");
      setProfileMenuMaxHeight(
        Math.max(minimumMenuHeight, Math.min(defaultMaxHeight, Math.floor(availableHeight))),
      );
    };

    updateProfileMenuLayout();
    window.addEventListener("resize", updateProfileMenuLayout);
    window.addEventListener("scroll", updateProfileMenuLayout, true);

    return () => {
      window.removeEventListener("resize", updateProfileMenuLayout);
      window.removeEventListener("scroll", updateProfileMenuLayout, true);
    };
  }, [profilMenuOuvert]);

  useEffect(() => {
    if (!keyboardModeEnabled || !isCandidate) {
      return;
    }

    const isEditableTarget = (target: EventTarget | null) => {
      if (!(target instanceof HTMLElement)) {
        return false;
      }

      return (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable
      );
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (isEditableTarget(event.target)) {
        return;
      }

      if (event.key === "Escape") {
        setNavigationMenuOuvert(null);
        setKeyboardBuffer("");
        return;
      }

      if (event.ctrlKey || event.altKey || event.metaKey || event.key.length !== 1) {
        return;
      }

      const key = normalizeShortcutLabel(event.key);

      const availableEntries =
        navigationMenuOuvert && candidateShortcuts.find((entry) => entry.menuId === navigationMenuOuvert)?.items
          ? candidateShortcuts.find((entry) => entry.menuId === navigationMenuOuvert)?.items || []
          : candidateShortcuts;
      const navigateFromKeyboard = (chemin: string) => {
        setMenuOuvert(false);
        setProfilMenuOuvert(false);
        setNavigationMenuOuvert(null);
        router.push(chemin);
      };

      const trySequence = (sequence: string) => {
        const matches = availableEntries.filter((entry) => entry.key.startsWith(sequence));
        if (matches.length === 0) {
          return false;
        }

        setKeyboardBuffer(sequence);

        if (keyboardBufferTimerRef.current) {
          clearTimeout(keyboardBufferTimerRef.current);
        }

        keyboardBufferTimerRef.current = setTimeout(() => {
          setKeyboardBuffer("");
        }, 1200);

        const exact = matches.find((entry) => entry.key === sequence);
        if (!exact) {
          return true;
        }

        event.preventDefault();

        if ("href" in exact && exact.href) {
          navigateFromKeyboard(exact.href);
          setKeyboardBuffer("");
          return true;
        }

        if ("menuId" in exact && exact.menuId) {
          setProfilMenuOuvert(false);
          setMenuOuvert(false);
          setNavigationMenuOuvert(exact.menuId);
          setKeyboardBuffer("");
          return true;
        }

        return true;
      };

      const nextSequence = keyboardBuffer + key;
      if (trySequence(nextSequence)) {
        return;
      }

      trySequence(key);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      if (keyboardBufferTimerRef.current) {
        clearTimeout(keyboardBufferTimerRef.current);
      }
    };
  }, [candidateShortcuts, keyboardBuffer, keyboardModeEnabled, navigationMenuOuvert, router, isCandidate]);

  const getNavInitials = (label: string) => {
    // Custom initials mapping
    const initialsMap: Record<string, string> = {
      [t("navbar.applications")]: "AP",
      [t("navbar.assessments")]: "AS",
    };
    
    return initialsMap[label] || label.charAt(0);
  };

  const deconnexion = () => {
    localStorage.removeItem("token_auth");
    localStorage.removeItem("utilisateur_connecte");
    router.push("/");
  };

  const ouvrirPanneauAccessibilite = () => {
    setMenuOuvert(false);
    setProfilMenuOuvert(false);
    setNavigationMenuOuvert(null);
    triggerAccessibilityPanel("open");
  };

  const naviguerVers = (chemin: string) => {
    setMenuOuvert(false);
    setProfilMenuOuvert(false);
    setNavigationMenuOuvert(null);
    // If sidebar is collapsed, open it first before navigation
    if (hasCollapsibleSidebar && candidateSidebarCollapsed && onToggleCandidateSidebar) {
      onToggleCandidateSidebar();
    }
    router.push(chemin);
  };

  const navigationActive = (item: NavItem) =>
    hasItems(item) ? item.items.some((child) => pathname === child.href) : pathname === item.href;

  const basculerMenuNavigation = (menuId: string) => {
    setProfilMenuOuvert(false);
    // If sidebar is collapsed, open it first
    if (hasCollapsibleSidebar && candidateSidebarCollapsed && onToggleCandidateSidebar) {
      onToggleCandidateSidebar();
      // Set a small delay to allow sidebar animation to start
      setTimeout(() => {
        setNavigationMenuOuvert((current) => (current === menuId ? null : menuId));
      }, 100);
    } else {
      setNavigationMenuOuvert((current) => (current === menuId ? null : menuId));
    }
  };

  const fermerMenuNavigation = () => {
    setNavigationMenuOuvert(null);
  };

  const ouvrirMenuNavigation = (menuId: string) => {
    setProfilMenuOuvert(false);
    // If sidebar is collapsed, open it first
    if (hasCollapsibleSidebar && candidateSidebarCollapsed && onToggleCandidateSidebar) {
      onToggleCandidateSidebar();
    }
    setNavigationMenuOuvert(menuId);
  };

  if (usesReferenceSidebar) {
    return (
      <header className={classes("app-header", "app-theme", "app-header-candidat")} ref={headerRef}>
        <div className="app-header-inner candidate-sidebar-ref">
          <div className="candidate-brand-row candidate-sidebar-ref__brand-row">
            <Link href="/home" className="candidate-sidebar-ref__brand">
              <span className="candidate-sidebar-ref__brand-mark" aria-hidden="true">
                <CandidateSidebarIcon name="accessibility" />
              </span>
              <span className={classes("candidate-sidebar-ref__brand-copy", candidateSidebarCollapsed && "is-collapsed")}>
                <strong>HandiTalents</strong>
                <span>{isAdmin ? "INCLUSIVE HIRING PLATFORM" : isEntreprise ? "ENTREPRISE" : "CANDIDATE"}</span>
              </span>
            </Link>
            {hasCollapsibleSidebar ? (
              <button
                className="sidebar-toggle"
                onClick={onToggleCandidateSidebar}
                type="button"
                aria-label={candidateSidebarCollapsed ? t("navbar.expandSidebar") : t("navbar.collapseSidebar")}
                aria-pressed={candidateSidebarCollapsed}
              >
                <span
                  className={classes("candidate-sidebar-ref__toggle-icon", candidateSidebarCollapsed && "is-collapsed")}
                  aria-hidden="true"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="candidate-sidebar-ref__toggle-arrow"
                  >
                    <path
                      d={candidateSidebarCollapsed ? "M9 6.5 14.5 12 9 17.5" : "M15 6.5 9.5 12 15 17.5"}
                      stroke="currentColor"
                      strokeWidth="2.1"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              </button>
            ) : null}
          </div>

          <nav className="candidate-sidebar-ref__nav" aria-label={isAdmin ? "Admin navigation" : "Candidate navigation"}>
            {sidebarItems.map((item) => {
              const isActive = isPathActive(item.href);

              return (
                <button
                  key={item.id}
                  type="button"
                  className={classes("candidate-sidebar-ref__item", isActive && "is-active", candidateSidebarCollapsed && "is-collapsed")}
                  onClick={() => naviguerVers(item.href)}
                  title={candidateSidebarCollapsed ? item.label : undefined}
                >
                  <span className="candidate-sidebar-ref__item-icon" aria-hidden="true">
                    <CandidateSidebarIcon name={item.icon} />
                  </span>
                  <span className={classes("candidate-sidebar-ref__item-copy", candidateSidebarCollapsed && "is-collapsed")}>
                    <strong>{item.label}</strong>
                    <small>{item.subtitle}</small>
                  </span>
                  {item.badgeCount && item.badgeCount > 0 ? (
                    <span className="candidate-sidebar-ref__item-badge">{item.badgeCount}</span>
                  ) : null}
                </button>
              );
            })}
          </nav>

          {isCandidate ? (
            <button
              type="button"
              className={classes("candidate-sidebar-ref__accessibility", candidateSidebarCollapsed && "is-collapsed")}
              onClick={ouvrirPanneauAccessibilite}
              title={candidateSidebarCollapsed ? t("accessibility.open") : undefined}
              aria-label={t("accessibility.open")}
            >
              <span className="candidate-sidebar-ref__item-icon" aria-hidden="true">
                <CandidateSidebarIcon name="accessibility" />
              </span>
              <span className={classes("candidate-sidebar-ref__accessibility-copy", candidateSidebarCollapsed && "is-collapsed")}>
                <strong>{t("accessibility.open")}</strong>
                <small>Options visuelles et navigation</small>
              </span>
            </button>
          ) : null}

          {!isEntreprise ? (
            <>
              <div className="candidate-sidebar-ref__divider" aria-hidden="true" />

              <div className={classes("candidate-sidebar-ref__profile-card", candidateSidebarCollapsed && "is-collapsed")}>
                <Image
                  src={candidateProfilePhoto || "/uploads/photo1.png"}
                  alt={utilisateur.nom}
                  width={44}
                  height={44}
                  className="candidate-sidebar-ref__profile-image"
                  unoptimized={!!candidateProfilePhoto?.startsWith("data:")}
                />
                <div className={classes("candidate-sidebar-ref__profile-copy", candidateSidebarCollapsed && "is-collapsed")}>
                  <strong>{utilisateur.nom}</strong>
                  <button type="button" onClick={() => naviguerVers(profilHref)}>
                    Voir mon profil
                  </button>
                </div>
                {!candidateSidebarCollapsed ? <span className="candidate-sidebar-ref__chevron">›</span> : null}
              </div>
            </>
          ) : null}

          {!candidateSidebarCollapsed ? (
            <button type="button" className="candidate-sidebar-ref__logout-link" onClick={deconnexion}>
              Se deconnecter
            </button>
          ) : null}
        </div>

        {settings.keyboardMoveMode && keyboardGuideVisible ? (
          <aside className="keyboard-guide" aria-live="polite">
            <div className="keyboard-guide-header">
              <strong>{t("accessibility.keyboardGuideTitle")}</strong>
              <button
                className="keyboard-guide-close"
                onClick={() => setKeyboardGuideVisible(false)}
                type="button"
                aria-label={t("common.actions.close")}
              >
                x
              </button>
            </div>
            <p>{t("accessibility.keyboardGuideIntro")}</p>
            <div className="keyboard-guide-list">
              <span><kbd>Tab</kbd> Naviguer vers element suivant</span>
              <span><kbd>Shift + Tab</kbd> Revenir element precedent</span>
              <span><kbd>Entree</kbd> Activer bouton ou lien selectionne</span>
              <span><kbd>Echap</kbd> Fermer menus ou modales</span>
            </div>
          </aside>
        ) : null}

        <div className="sr-only" aria-live="polite">
          {keyboardAnnouncement}
        </div>
      </header>
    );
  }
return (
    <header className={classes("app-header", "app-theme", hasCollapsibleSidebar && "app-header-candidat")} ref={headerRef}>
      <div className="app-header-inner">
        <div className="candidate-brand-row">
          <Link href="/home" className="brand-pill">
            <span className="brand-mark" aria-hidden="true" />
            <span className={classes("brand-copy", isCandidate && candidateSidebarCollapsed && "brand-copy-collapsed")}>
              <strong>HandiTalents</strong>
              <span>{roleBrandSubtitle}</span>
            </span>
          </Link>
          {hasCollapsibleSidebar ? (
            <button
              className="sidebar-toggle"
              onClick={onToggleCandidateSidebar}
              type="button"
              aria-label={candidateSidebarCollapsed ? t("navbar.expandSidebar") : t("navbar.collapseSidebar")}
              aria-pressed={candidateSidebarCollapsed}
            >
              <span
                className={classes("sidebar-toggle-lines", candidateSidebarCollapsed && "sidebar-toggle-lines-collapsed")}
                aria-hidden="true"
              />
            </button>
          ) : null}
        </div>

        <nav className="app-nav" aria-label="Primary">
          {liens.map((lien) =>
            hasItems(lien) ? (
              <div 
                key={lien.id} 
                className="nav-dropdown-shell"
                onMouseEnter={() => ouvrirMenuNavigation(lien.id)}
                onMouseLeave={fermerMenuNavigation}
              >
                <button
                  onClick={() => basculerMenuNavigation(lien.id)}
                  className={classes("nav-chip", navigationActive(lien) && "nav-chip-active")}
                  type="button"
                  title={hasCollapsibleSidebar && candidateSidebarCollapsed ? lien.label : undefined}
                >
                  {hasCollapsibleSidebar ? <span className="nav-chip-glyph" aria-hidden="true">{getNavInitials(lien.label)}</span> : null}
                  <span className={classes(hasCollapsibleSidebar && candidateSidebarCollapsed && "nav-chip-label-collapsed")}>{lien.label}</span>
                  {lien.badgeCount && lien.badgeCount > 0 ? <span className="badge-count">{lien.badgeCount}</span> : null}
                  <span
                    className={classes("nav-chip-caret", navigationMenuOuvert === lien.id && "nav-chip-caret-open")}
                    aria-hidden="true"
                  />
                </button>

                {navigationMenuOuvert === lien.id ? (
                  <div className="nav-dropdown-menu">
                    {lien.items.map((item) => (
                      <button
                        key={item.href}
                        onClick={() => naviguerVers(item.href)}
                        className={classes("nav-dropdown-item", pathname === item.href && "nav-dropdown-item-active")}
                        type="button"
                      >
                        <span>{item.label}</span>
                        {item.badgeCount && item.badgeCount > 0 ? <span className="badge-count">{item.badgeCount}</span> : null}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : (
              (() => {
                const navLink = lien as NavLinkItem;
                return (
                  <button
                    key={navLink.href}
                    onClick={() => naviguerVers(navLink.href)}
                    className={classes("nav-chip", pathname === navLink.href && "nav-chip-active")}
                    type="button"
                    title={hasCollapsibleSidebar && candidateSidebarCollapsed ? navLink.label : undefined}
                  >
                    {hasCollapsibleSidebar ? <span className="nav-chip-glyph" aria-hidden="true">{getNavInitials(navLink.label)}</span> : null}
                    <span className={classes(hasCollapsibleSidebar && candidateSidebarCollapsed && "nav-chip-label-collapsed")}>{navLink.label}</span>
                    {navLink.badgeCount && navLink.badgeCount > 0 ? <span className="badge-count">{navLink.badgeCount}</span> : null}
                  </button>
                );
              })()
            ),
          )}
        </nav>

        <div className="app-header-actions">
          {!(hasCollapsibleSidebar && candidateSidebarCollapsed) ? <LanguageSwitcher /> : null}

          {primaryAction ? (
            <ButtonLink href={primaryAction.href} variant="secondary" size="sm">
              {primaryAction.label}
            </ButtonLink>
          ) : null}

          {!(hasCollapsibleSidebar && candidateSidebarCollapsed) ? (
          <div className="profile-shell" ref={profileShellRef}>
            <button
              className="profile-trigger"
              onClick={() => {
                setNavigationMenuOuvert(null);
                setProfilMenuOuvert((open) => !open);
              }}
              type="button"
            >
              <span className="profile-avatar">{utilisateur.nom.charAt(0).toUpperCase()}</span>
              <span className="profile-meta">
                <strong>{utilisateur.nom}</strong>
                <span>{roleChipLabel}</span>
              </span>
              <span className={classes("profile-caret", profilMenuOuvert && "profile-caret-open")} aria-hidden="true" />
            </button>

            {profilMenuOuvert ? (
              <div
                className={classes(
                  "profile-menu",
                  profileMenuPlacement === "up" ? "profile-menu-up" : "profile-menu-down",
                )}
                style={{ maxHeight: `${profileMenuMaxHeight}px` }}
              >
                <div className="profile-menu-header">
                  <strong>{utilisateur.nom}</strong>
                  <p style={{ margin: 0, color: "var(--app-muted)" }}>{utilisateur.email}</p>
                  <p style={{ margin: "8px 0 0", color: "var(--app-muted)" }}>
                    {t("common.status")}: {utilisateur.statut}
                  </p>
                </div>

                <div className="profile-menu-actions">
                  {isCandidate ? (
                    <button className="nav-chip" onClick={ouvrirPanneauAccessibilite} type="button">
                      {t("accessibility.open")}
                    </button>
                  ) : null}
                  <button className="nav-chip" onClick={() => naviguerVers(profilHref)} type="button">
                    {t("navbar.openProfile")}
                  </button>
                  <button className="nav-chip" onClick={() => naviguerVers("/messages")} type="button">
                    {t("navbar.openMessages")}
                  </button>
                  <button className="nav-chip" onClick={deconnexion} type="button">
                    {t("common.actions.signOut")}
                  </button>
                </div>
              </div>
            ) : null}
          </div>
          ) : null}

          <button
            className="ui-button ui-button-secondary ui-button-sm mobile-menu-toggle"
            onClick={() => setMenuOuvert((open) => !open)}
            type="button"
          >
            {menuOuvert ? t("common.actions.close") : t("navbar.menu")}
          </button>
        </div>
      </div>

      {menuOuvert ? (
        <div className="mobile-nav">
          {liens.map((lien) =>
            hasItems(lien) ? (
              <div key={lien.id} className="mobile-nav-group">
                <button
                  onClick={() => basculerMenuNavigation(lien.id)}
                  className={classes("nav-chip", navigationActive(lien) && "nav-chip-active")}
                  type="button"
                >
                  <span>
                    {lien.label}
                    {lien.badgeCount && lien.badgeCount > 0 ? ` (${lien.badgeCount})` : ""}
                  </span>
                  <span aria-hidden="true">
                    {navigationMenuOuvert === lien.id ? t("common.actions.close") : t("common.actions.open")}
                  </span>
                </button>

                {navigationMenuOuvert === lien.id ? (
                  <div className="mobile-nav-submenu">
                    {lien.items.map((item) => (
                      <button
                        key={item.href}
                        onClick={() => naviguerVers(item.href)}
                        className={classes("nav-chip", pathname === item.href && "nav-chip-active")}
                        type="button"
                      >
                        <span>
                          {item.label}
                          {item.badgeCount && item.badgeCount > 0 ? ` (${item.badgeCount})` : ""}
                        </span>
                        <span aria-hidden="true">{t("common.actions.open")}</span>
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : (
              (() => {
                const navLink = lien as NavLinkItem;
                return (
                  <button
                    key={navLink.href}
                    onClick={() => naviguerVers(navLink.href)}
                    className={classes("nav-chip", pathname === navLink.href && "nav-chip-active")}
                    type="button"
                  >
                    <span>
                      {navLink.label}
                      {navLink.badgeCount && navLink.badgeCount > 0 ? ` (${navLink.badgeCount})` : ""}
                    </span>
                    <span aria-hidden="true">{t("common.actions.open")}</span>
                  </button>
                );
              })()
            ),
          )}
          {primaryAction ? (
            <ButtonLink href={primaryAction.href} variant="primary" size="sm">
              {primaryAction.label}
            </ButtonLink>
          ) : null}
          {isCandidate ? (
            <button className="nav-chip" onClick={ouvrirPanneauAccessibilite} type="button">
              {t("accessibility.open")}
            </button>
          ) : null}
        </div>
      ) : null}

      {settings.keyboardMoveMode && keyboardGuideVisible ? (
        <aside className="keyboard-guide" aria-live="polite">
          <div className="keyboard-guide-header">
            <strong>{t("accessibility.keyboardGuideTitle")}</strong>
            <button
              className="keyboard-guide-close"
              onClick={() => setKeyboardGuideVisible(false)}
              type="button"
              aria-label={t("common.actions.close")}
            >
              x
            </button>
          </div>
          <p>{t("accessibility.keyboardGuideIntro")}</p>
          <div className="keyboard-guide-list">
            <span><kbd>Tab</kbd> Naviguer vers element suivant</span>
            <span><kbd>Shift + Tab</kbd> Revenir a element precedent</span>
            <span><kbd>Entree</kbd> Activer le bouton ou le lien selectionne</span>
            <span><kbd>Echap</kbd> Fermer les menus ou modales</span>
            <span><kbd>Fleches</kbd> Se deplacer dans les listes et menus</span>
          </div>
          {isCandidate ? <p>Raccourcis rapides candidat :</p> : null}
          {isCandidate ? (
            <div className="keyboard-guide-list">
              {candidateShortcuts.map((entry) => (
                <span key={entry.label}>
                  <kbd>{entry.key.toUpperCase()}</kbd> {entry.label}
                </span>
              ))}
            </div>
          ) : null}
          {navigationMenuOuvert && candidateShortcuts.find((entry) => entry.menuId === navigationMenuOuvert)?.items ? (
            <>
              <p>{t("accessibility.keyboardGuideExplore")}</p>
              <div className="keyboard-guide-list">
                {candidateShortcuts
                  .find((entry) => entry.menuId === navigationMenuOuvert)
                  ?.items?.map((entry) => (
                    <span key={entry.label}>
                      <kbd>{entry.key.toUpperCase()}</kbd> {entry.label}
                    </span>
                  ))}
              </div>
            </>
          ) : null}
          <p>{t("accessibility.keyboardGuideClose")}</p>
        </aside>
      ) : null}

      <div className="sr-only" aria-live="polite">
        {keyboardAnnouncement}
      </div>
    </header>
  );
}


