"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Ban, BarChart3, BriefcaseBusiness, Building2, CalendarDays, CheckCircle2, Eye, Globe2, Mail, MapPin, Phone, Search, ShieldCheck, Users, X } from "lucide-react";
import { createPortal } from "react-dom";
import { RouteProtegee } from "@/components/route-protegee";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { authenticatedFetch } from "@/lib/auth-utils";
import { construireUrlApi } from "@/lib/config";

type EmployerStatus = "actif" | "en_attente" | "suspendu" | "inactif";

type EmployerAccount = {
  id_utilisateur: string;
  nom: string;
  nom_entreprise?: string | null;
  email: string;
  statut: EmployerStatus | string;
  telephone?: string | null;
  addresse?: string | null;
  region?: string | null;
  gouvernorat?: string | null;
  delegation?: string | null;
  created_at: string;
  updated_at: string;
};

type CompanyProfile = EmployerAccount & {
  nom_entreprise?: string | null;
  patente?: string | null;
  rne?: string | null;
  statut_validation?: string | null;
  profil_publique?: boolean | null;
  date_fondation?: string | null;
  description?: string | null;
  nbr_employe?: number | null;
  nbr_employe_handicape?: number | null;
  secteur_activite?: string | null;
  taille_entreprise?: string | null;
  siret?: string | null;
  site_web?: string | null;
  url_site?: string | null;
  politique_handicap?: string | null;
  contact_rh_nom?: string | null;
  contact_rh_email?: string | null;
  contact_rh_telephone?: string | null;
  logo_url?: string | null;
  subscription_pack?: string | null;
  subscription_status?: string | null;
  subscription_price_tnd?: number | null;
  subscription_cycle?: string | null;
  subscribed_at?: string | null;
};

type EmployersPayload = {
  message?: string;
  donnees?: {
    utilisateurs?: EmployerAccount[];
    pagination?: {
      page?: number;
      limit?: number;
      total?: number;
      totalPages?: number;
    };
  };
};

type CompanyPayload = {
  message?: string;
  donnees?: CompanyProfile | {
    utilisateur?: EmployerAccount;
    entreprise?: CompanyProfile;
  };
};

type CompanyFormState = {
  nom: string;
  email: string;
  telephone: string;
  addresse: string;
  nom_entreprise: string;
  patente: string;
  rne: string;
  date_fondation: string;
  description: string;
  nbr_employe: string;
  nbr_employe_handicape: string;
  secteur_activite: string;
  taille_entreprise: string;
  siret: string;
  site_web: string;
  politique_handicap: string;
  contact_rh_nom: string;
  contact_rh_email: string;
  contact_rh_telephone: string;
  profil_publique: boolean;
};

type ModalMode = "create" | "edit" | "view" | null;

const STATUS_LABELS: Record<string, string> = {
  actif: "Active",
  en_attente: "Pending",
  suspendu: "Suspended",
  inactif: "Inactive",
};

const ITEMS_PER_PAGE = 50;

const EMPTY_FORM: CompanyFormState = {
  nom: "",
  email: "",
  telephone: "",
  addresse: "",
  nom_entreprise: "",
  patente: "",
  rne: "",
  date_fondation: "",
  description: "",
  nbr_employe: "1",
  nbr_employe_handicape: "0",
  secteur_activite: "",
  taille_entreprise: "",
  siret: "",
  site_web: "",
  politique_handicap: "",
  contact_rh_nom: "",
  contact_rh_email: "",
  contact_rh_telephone: "",
  profil_publique: false,
};

const styles = `
  .companies-page {
    display: grid;
    gap: 18px;
  }

  .companies-kicker {
    margin: 0;
    color: #6b5b86;
    font-size: 0.86rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .companies-panel {
    display: grid;
    gap: 20px;
    padding: 22px;
    border-radius: 22px;
    background: rgba(255, 255, 255, 0.96);
    border: 1px solid #eee8ff;
    box-shadow: 0 22px 52px rgba(76, 48, 139, 0.08);
  }

  .companies-toolbar {
    display: grid;
    grid-template-columns: minmax(250px, 1fr) 180px 180px 170px;
    gap: 16px;
    align-items: center;
  }

  .companies-search,
  .companies-select-wrap,
  .companies-field {
    position: relative;
    min-width: 0;
  }

  .companies-search svg,
  .companies-select-wrap > span {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    color: #5b2d91;
    pointer-events: none;
  }

  .companies-search svg {
    left: 20px;
  }

  .companies-select-wrap > span {
    right: 18px;
    width: 18px;
    height: 18px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .companies-select-wrap > span svg {
    width: 18px;
    height: 18px;
    display: block;
  }

  .companies-toolbar input,
  .companies-toolbar select {
    width: 100%;
    min-height: 54px;
    border-radius: 18px;
    border: 1px solid #e5ddfb;
    background: #ffffff;
    color: #22164f;
    outline: none;
    box-shadow: 0 10px 24px rgba(77, 55, 135, 0.04);
  }

  .companies-toolbar input {
    padding: 0 18px 0 54px;
    font-weight: 700;
  }

  .companies-field input {
    padding: 0 14px;
    font-weight: 700;
  }

  .companies-toolbar select {
    appearance: none;
    padding: 0 52px 0 20px;
    font-weight: 800;
    white-space: nowrap;
  }

  .company-form input,
  .company-form textarea,
  .company-form select {
    width: 100%;
    border-radius: 12px;
    border: 1px solid #ddd5ea;
    background: #fff;
    padding: 11px 14px;
    color: #201338;
    outline: none;
  }

  .companies-toolbar input:focus,
  .companies-toolbar select:focus,
  .company-form input:focus,
  .company-form textarea:focus,
  .company-form select:focus {
    border-color: #7c3aed;
    box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.12);
  }

  .companies-toolbar-actions {
    display: flex;
    gap: 10px;
    justify-content: flex-end;
    align-items: center;
  }

  .companies-toolbar-btn {
    min-height: 54px;
    border-radius: 18px;
    border: 1px solid #e7defb;
    padding: 0 24px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    background: #ffffff;
    color: #5b2d91;
    font-weight: 900;
    box-shadow: 0 10px 24px rgba(77, 55, 135, 0.06);
    white-space: nowrap;
  }

  .companies-toolbar-btn--primary {
    border-color: #5b2d91;
    color: #ffffff;
    background: #5b2d91;
    box-shadow: 0 14px 28px rgba(91, 45, 145, 0.24);
  }

  .companies-toolbar-btn svg,
  .companies-action-btn svg {
    width: 16px;
    height: 16px;
    stroke-width: 2.4;
  }

  .companies-table-wrap {
    overflow-x: auto;
    overflow-y: hidden;
    border: 1px solid #ebe5fa;
    border-radius: 16px;
    background: #ffffff;
    scrollbar-width: thin;
    scrollbar-color: #d8c8fb transparent;
  }

  .companies-table-wrap::-webkit-scrollbar {
    width: 8px;
    height: 8px;
    display: block;
  }

  .companies-table-wrap::-webkit-scrollbar-thumb {
    border-radius: 999px;
    background: #d8c8fb;
  }

  .companies-table {
    width: 100%;
    border-collapse: collapse;
    min-width: 940px;
    table-layout: fixed;
    background: #fff;
  }

  .companies-table thead th {
    position: sticky;
    top: 0;
    z-index: 1;
    height: 56px;
    background: #f7f3ff;
    color: #14103e;
    text-align: left;
    font-size: 0.76rem;
    font-weight: 950;
    text-transform: uppercase;
    letter-spacing: 0.02em;
    border-bottom: 1px solid #ede7fa;
    padding: 16px 14px;
    white-space: nowrap;
  }

  .companies-table tbody td {
    padding: 18px 12px;
    vertical-align: middle;
    border-bottom: 1px solid #ece7f6;
    color: #191342;
    font-size: 0.88rem;
    font-weight: 750;
    line-height: 1.4;
  }

  .companies-table tbody tr {
    min-height: 116px;
  }

  .companies-table tbody tr:last-child td {
    border-bottom: 0;
  }

  .companies-table td strong,
  .companies-table td span {
    display: block;
  }

  .companies-table td span {
    color: #71689b;
    font-size: 0.82rem;
    margin-top: 6px;
    font-weight: 700;
    line-height: 1.45;
  }

  .company-cell {
    display: grid;
    grid-template-columns: 44px minmax(0, 1fr);
    gap: 12px;
    align-items: start;
  }

  .company-cell > div,
  .company-contact,
  .company-region,
  .company-address,
  .company-date {
    min-width: 0;
  }

  .company-name {
    line-height: 1.3;
    overflow-wrap: break-word;
  }

  .company-email {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .company-icon {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: #f3edff;
    color: #5b2d91;
    line-height: 1;
    padding: 0;
    box-sizing: border-box;
  }

  .companies-table td span.company-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .company-icon svg {
    width: 18px;
    height: 18px;
    display: block;
    margin: auto;
  }

  .company-status {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 0;
    min-height: 30px;
    padding: 0 10px;
    border-radius: 999px;
    font-weight: 900;
    font-size: 0.74rem;
    line-height: 1;
    text-align: center;
    white-space: nowrap;
    width: fit-content;
  }

  .company-status::before {
    content: none;
  }

  .company-status--actif {
    background: rgba(112, 156, 124, 0.16);
    color: #b7d7bf;
    border: 1px solid rgba(112, 156, 124, 0.26);
  }

  .company-status--en_attente {
    background: rgba(159, 138, 92, 0.16);
    color: #dac79f;
    border: 1px solid rgba(159, 138, 92, 0.22);
  }

  .company-status--suspendu {
    background: rgba(124, 102, 104, 0.16);
    color: #d2bdc0;
    border: 1px solid rgba(124, 102, 104, 0.24);
  }

  .company-status--inactif {
    background: rgba(126, 123, 136, 0.16);
    color: #d0ced8;
    border: 1px solid rgba(126, 123, 136, 0.24);
  }

  .companies-actions {
    display: grid;
    grid-template-columns: 1fr;
    gap: 6px;
    align-items: center;
    width: 112px;
  }

  .companies-action-btn {
    min-height: 34px;
    border-radius: 12px;
    border: 1px solid #e8e1f7;
    padding: 0 8px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
    background: #ffffff;
    color: #17113f;
    font-weight: 900;
    font-size: 0.72rem;
    white-space: nowrap;
  }

  .companies-action-emoji {
    font-size: 0.9rem;
    line-height: 1;
  }

  .company-region strong,
  .company-address,
  .company-date {
    overflow-wrap: anywhere;
  }

  .company-region span {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .companies-action-btn--view {
    background: #f6f0ff;
    border-color: #f0e8ff;
    color: #6326ee;
  }

  .companies-action-btn--suspend {
    background: #fff7e8;
    border-color: #fde8bb;
    color: #9a5b00;
  }

  .companies-action-btn:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }

  .companies-pagination {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  }

  .companies-pagination-controls {
    display: flex;
    gap: 10px;
    align-items: center;
  }

  .companies-pagination-btn[disabled] {
    opacity: 0.48;
  }

  .companies-modal-overlay {
    position: fixed;
    inset: 0;
    z-index: 2000;
    display: grid;
    place-items: center;
    padding: 20px;
    background: rgba(26, 18, 43, 0.42);
    backdrop-filter: blur(8px);
  }

  .companies-modal-card {
    width: min(980px, 100%);
    max-height: min(88vh, 980px);
    overflow: auto;
    border-radius: 20px;
    border: 1px solid #e8e1f4;
    background: #ffffff;
    box-shadow: 0 28px 70px rgba(31, 18, 49, 0.24);
  }

  .companies-modal-card--view {
    padding: 30px 32px;
  }

  .companies-modal-header {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    align-items: flex-start;
    margin-bottom: 18px;
  }

  .companies-modal-title {
    margin: 0;
    color: #201338;
    font-size: 2rem;
    font-weight: 600;
    line-height: 1.2;
  }

  .companies-modal-email {
    margin: 4px 0 0;
    color: #647188;
    font-size: 1.05rem;
    font-weight: 500;
    line-height: 1.2;
  }

  .companies-modal-close {
    width: 48px;
    height: 48px;
    border-radius: 18px;
    border: 1px solid #d8cde9;
    padding: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: #f4eefb;
    color: #3d1a67;
  }

  .companies-modal-close svg {
    width: 20px;
    height: 20px;
  }

  .company-form {
    display: grid;
    gap: 14px;
  }

  .company-form-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px;
  }

  .company-form-field {
    display: grid;
    gap: 8px;
  }

  .company-form-field--full {
    grid-column: 1 / -1;
  }

  .company-form-field label {
    color: #5a4a76;
    font-size: 0.88rem;
    font-weight: 700;
  }

  .company-form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 6px;
  }

  .company-detail-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }

  .company-detail-box {
    padding: 16px 16px;
    border-radius: 14px;
    background: #f8f5fc;
    border: 1px solid #eee8f8;
    min-height: 110px;
  }

  .company-detail-box strong {
    display: block;
    margin-bottom: 6px;
    color: #201338;
    font-size: 1.15rem;
    font-weight: 800;
    line-height: 1.2;
  }

  .company-detail-box p {
    margin: 0;
    color: #5a4a76;
    line-height: 1.5;
    font-size: 0.98rem;
    font-weight: 500;
    word-break: break-word;
  }

  .company-detail-actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 20px;
  }

  .company-profile-view {
    display: grid;
    gap: 18px;
  }

  .company-profile-hero {
    display: grid;
    grid-template-columns: 112px minmax(0, 1fr);
    align-items: center;
    gap: 20px;
    padding: 24px;
    border: 1px solid rgba(74, 29, 89, 0.1);
    border-radius: 24px;
    background:
      radial-gradient(circle at 92% 12%, rgba(216, 106, 141, 0.18), transparent 32%),
      linear-gradient(135deg, rgba(74, 29, 89, 0.08), rgba(255, 255, 255, 0.94));
  }

  .company-profile-logo {
    width: 96px;
    height: 96px;
    display: grid;
    place-items: center;
    overflow: hidden;
    border-radius: 24px;
    background: linear-gradient(135deg, #5b2d91, #8a63d2);
    color: #fff;
    font-size: 1.8rem;
    font-weight: 900;
    box-shadow: 0 20px 40px rgba(74, 29, 89, 0.2);
  }

  .company-profile-logo img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .company-profile-hero h3 {
    margin: 4px 0 12px;
    color: #1f1431;
    font-size: clamp(1.8rem, 4vw, 3rem);
    line-height: 1.02;
  }

  .company-profile-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .company-profile-meta span,
  .company-values span,
  .company-contact-list span {
    display: inline-flex;
    align-items: center;
    gap: 7px;
  }

  .company-profile-meta span {
    padding: 8px 10px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.72);
    color: #4f435f;
    font-size: 0.84rem;
    font-weight: 800;
  }

  .company-profile-meta svg,
  .company-profile-kpis svg,
  .company-values svg,
  .company-contact-list svg {
    color: #5b2d91;
  }

  .company-profile-kpis {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 12px;
  }

  .company-profile-kpis article,
  .company-profile-panel {
    border: 1px solid rgba(74, 29, 89, 0.1);
    border-radius: 18px;
    background: linear-gradient(180deg, #fff, #fcfafd);
    box-shadow: 0 14px 34px rgba(31, 18, 49, 0.05);
  }

  .company-profile-kpis article {
    min-height: 104px;
    display: grid;
    align-content: center;
    gap: 7px;
    padding: 16px;
  }

  .company-profile-kpis span {
    color: #756b84;
    font-size: 0.78rem;
    font-weight: 800;
  }

  .company-profile-kpis strong {
    color: #1f1431;
    font-size: 1.25rem;
    line-height: 1.15;
  }

  .company-profile-grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(280px, 0.82fr);
    gap: 14px;
  }

  .company-profile-panel {
    padding: 20px;
  }

  .company-profile-panel-wide {
    grid-column: span 1;
  }

  .company-profile-panel h3 {
    margin: 0 0 12px;
    color: #1f1431;
    font-size: 1.05rem;
  }

  .company-profile-panel p {
    margin: 0;
    color: #625773;
    line-height: 1.58;
  }

  .company-values {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 18px;
  }

  .company-values span {
    padding: 9px 11px;
    border-radius: 999px;
    background: rgba(74, 29, 89, 0.08);
    color: #5b2d91;
    font-size: 0.8rem;
    font-weight: 800;
  }

  .company-team-card {
    display: grid;
    grid-template-columns: 44px minmax(0, 1fr);
    gap: 10px;
    align-items: center;
    margin-bottom: 14px;
  }

  .company-team-card > span {
    width: 44px;
    height: 44px;
    display: grid;
    place-items: center;
    border-radius: 14px;
    background: linear-gradient(135deg, #5b2d91, #8a63d2);
    color: #fff;
    font-weight: 900;
  }

  .company-team-card strong,
  .company-job-card strong {
    display: block;
    color: #1f1431;
  }

  .company-team-card small,
  .company-job-card span,
  .company-job-card small,
  .company-contact-list span {
    color: #6b607c;
  }

  .company-contact-list {
    display: grid;
    gap: 9px;
    font-size: 0.88rem;
  }

  .company-job-card {
    display: grid;
    gap: 7px;
    padding: 16px;
    border-radius: 16px;
    background: rgba(74, 29, 89, 0.06);
  }

  .company-admin-strip {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 10px;
  }

  .company-admin-strip span {
    display: grid;
    gap: 5px;
    padding: 12px;
    border-radius: 14px;
    background: #f8f5fb;
    color: #786c88;
    font-size: 0.78rem;
    font-weight: 800;
  }

  .company-admin-strip b {
    color: #1f1431;
    font-size: 0.92rem;
    overflow-wrap: anywhere;
  }

  .companies-suspend-btn {
    min-height: 46px;
    border-radius: 18px;
    border: 1px solid #d8c8fb;
    padding: 0 16px;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: #e7ddf9;
    color: #2d1856;
    font-size: 0.96rem;
    font-weight: 900;
  }

  .companies-suspend-btn-icon {
    width: 20px;
    height: 20px;
    border-radius: 6px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: #64a9f4;
    color: #ffffff;
    font-size: 12px;
    line-height: 1;
  }

  @media (max-width: 1024px) {
    .companies-toolbar,
    .companies-pagination {
      grid-template-columns: 1fr;
      display: grid;
    }

    .companies-toolbar-actions {
      justify-content: stretch;
    }

    .company-form-grid,
    .company-detail-grid,
    .company-profile-kpis,
    .company-profile-grid,
    .company-admin-strip {
      grid-template-columns: 1fr;
    }

    .company-profile-hero {
      grid-template-columns: 1fr;
      justify-items: start;
    }

    .companies-modal-card--view {
      padding: 20px 18px;
    }

    .companies-modal-title {
      font-size: 1.55rem;
    }

    .companies-modal-email,
    .company-detail-box strong,
    .company-detail-box p,
    .companies-suspend-btn {
      font-size: 1rem;
    }
  }
`;

function formatDate(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function companyInitials(name?: string | null) {
  const parts = (name || "Company").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "CO";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function resolveCompanyLogoUrl(path?: string | null) {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  return construireUrlApi(path.startsWith("/") ? path : `/${path}`);
}

function compactCompanyLocation(company: CompanyProfile) {
  return [company.region, company.gouvernorat, company.delegation, company.addresse].filter(Boolean).join(", ") || "Localisation non renseignee";
}

function companySizeLabel(company: CompanyProfile) {
  return company.taille_entreprise || (typeof company.nbr_employe === "number" ? `${company.nbr_employe} employes` : "Taille non renseignee");
}

function normalizeFilterDate(value: string, maxIsoDate: string) {
  if (!value) return "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return "";
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return "";
  return value > maxIsoDate ? maxIsoDate : value;
}

function toUpdatePayload(form: CompanyFormState) {
  return {
    nom: form.nom.trim(),
    email: form.email.trim(),
    telephone: form.telephone.trim(),
    addresse: form.addresse.trim(),
    nom_entreprise: form.nom_entreprise.trim(),
    patente: form.patente.trim(),
    rne: form.rne.trim(),
    date_fondation: form.date_fondation,
    description: form.description.trim(),
    nbr_employe: Number(form.nbr_employe),
    nbr_employe_handicape: Number(form.nbr_employe_handicape),
    secteur_activite: form.secteur_activite.trim(),
    taille_entreprise: form.taille_entreprise.trim(),
    siret: form.siret.trim(),
    site_web: form.site_web.trim(),
    politique_handicap: form.politique_handicap.trim(),
    contact_rh_nom: form.contact_rh_nom.trim(),
    contact_rh_email: form.contact_rh_email.trim(),
    contact_rh_telephone: form.contact_rh_telephone.trim(),
    profil_publique: form.profil_publique,
  };
}

function normalizeCompany(profile: CompanyProfile): CompanyProfile {
  return {
    ...profile,
    site_web: profile.site_web ?? profile.url_site ?? "",
    url_site: profile.url_site ?? profile.site_web ?? "",
  };
}

function AdminCompaniesPage() {
  const [employers, setEmployers] = useState<EmployerAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [region, setRegion] = useState("");
  const [createdFrom, setCreatedFrom] = useState("");
  const [todayIso] = useState(() => new Date().toISOString().slice(0, 10));
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalEmployers, setTotalEmployers] = useState(0);
  const [isClient, setIsClient] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<CompanyProfile | null>(null);
  const [selectedCompanyCreatedAt, setSelectedCompanyCreatedAt] = useState<string | null>(null);
  const [form, setForm] = useState<CompanyFormState>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [viewError, setViewError] = useState<string | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const normalizedCreatedFrom = useMemo(() => normalizeFilterDate(createdFrom, todayIso), [createdFrom, todayIso]);

  const loadEmployers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        role: "entreprise",
        page: String(page),
        limit: String(ITEMS_PER_PAGE),
      });

      if (status) params.set("statut", status);
      if (search.trim()) params.set("recherche", search.trim());
      if (region.trim()) params.set("region", region.trim());
      if (normalizedCreatedFrom) params.set("dateDebut", normalizedCreatedFrom);

      const response = await authenticatedFetch(construireUrlApi(`/api/admin/utilisateurs?${params.toString()}`));
      const data: EmployersPayload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Impossible de charger les entreprises.");
      }

      const pagination = data.donnees?.pagination;
      setEmployers(Array.isArray(data.donnees?.utilisateurs) ? data.donnees.utilisateurs : []);
      setTotalPages(Math.max(1, pagination?.totalPages ?? 1));
      setTotalEmployers(pagination?.total ?? 0);
    } catch (cause) {
      setEmployers([]);
      setTotalPages(1);
      setTotalEmployers(0);
      setError(cause instanceof Error ? cause.message : "Impossible de charger les entreprises.");
    } finally {
      setLoading(false);
    }
  }, [normalizedCreatedFrom, page, region, search, status]);

  const loadCompanyProfile = useCallback(async (id: string) => {
    const response = await authenticatedFetch(construireUrlApi(`/api/entreprises/profil/${id}`));
    const data: CompanyPayload = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.message || "Impossible de charger le profil de l'entreprise.");
    }

    const raw = data.donnees as CompanyProfile | { entreprise?: CompanyProfile } | undefined;
    if (raw && "entreprise" in raw && raw.entreprise) {
      return normalizeCompany({
        ...(raw.entreprise as CompanyProfile),
        ...(raw as { utilisateur?: EmployerAccount }).utilisateur,
      } as CompanyProfile);
    }

    return normalizeCompany(raw as CompanyProfile);
  }, []);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    void loadEmployers();
  }, [loadEmployers]);

  useEffect(() => {
    setPage(1);
  }, [createdFrom, region, search, status]);

  const employersFiltres = useMemo(() => {
    return employers.filter((employer) => {
      const regionMatch = !region.trim() || [employer.region, employer.gouvernorat, employer.delegation, employer.addresse]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(region.trim().toLowerCase());

      if (!regionMatch) return false;

      const createdAt = new Date(employer.created_at);
      if (Number.isNaN(createdAt.getTime())) return !normalizedCreatedFrom;

      if (normalizedCreatedFrom) {
        const fromDate = new Date(`${normalizedCreatedFrom}T00:00:00`);
        if (createdAt < fromDate) return false;
      }

      return true;
    });
  }, [employers, normalizedCreatedFrom, region]);

  const refreshAfterAction = async () => {
    await loadEmployers();
  };

  const openView = async (employer: EmployerAccount) => {
    setModalMode("view");
    setSelectedCompany(null);
    setSelectedCompanyCreatedAt(employer.created_at || null);
    setViewError(null);
    try {
      setModalLoading(true);
      setFormError(null);
      setSelectedId(employer.id_utilisateur);
      setSelectedCompany(await loadCompanyProfile(employer.id_utilisateur));
    } catch (cause) {
      setViewError(cause instanceof Error ? cause.message : "Impossible de charger le profil de l'entreprise.");
    } finally {
      setModalLoading(false);
    }
  };

  const closeModal = () => {
    setModalMode(null);
    setSelectedId(null);
    setSelectedCompany(null);
    setSelectedCompanyCreatedAt(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setViewError(null);
    setModalLoading(false);
  };

  const submitForm = async () => {
    try {
      setFormError(null);

      if (!form.nom.trim()) throw new Error("Le nom du contact est requis.");
      if (!form.email.trim()) throw new Error("L'email est requis.");
      if (!form.telephone.trim()) throw new Error("Le telephone est requis.");
      if (!form.addresse.trim()) throw new Error("L'adresse est requise.");
      if (!form.nom_entreprise.trim()) throw new Error("Le nom de l'entreprise est requis.");
      if (!form.patente.trim()) throw new Error("La patente est requise.");
      if (!form.rne.trim()) throw new Error("Le RNE est requis.");
      if (!form.date_fondation) throw new Error("La date de fondation est requise.");
      if (!form.description.trim()) throw new Error("La description est requise.");

      setModalLoading(true);
      const payload = toUpdatePayload(form);
      const endpoint = modalMode === "create"
        ? "/api/profil/admin/entreprises"
        : `/api/profil/admin/entreprises/${selectedId}`;
      const method = modalMode === "create" ? "POST" : "PUT";

      const response = await authenticatedFetch(construireUrlApi(endpoint), {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data: CompanyPayload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Impossible d'enregistrer l'entreprise.");
      }

      await refreshAfterAction();
      closeModal();
    } catch (cause) {
      setFormError(cause instanceof Error ? cause.message : "Impossible d'enregistrer l'entreprise.");
    } finally {
      setModalLoading(false);
    }
  };

  const suspendCompany = async (employer: EmployerAccount) => {
    if (employer.statut === "suspendu") return;
    try {
      setActionInProgress(employer.id_utilisateur);
      setError(null);

      const response = await authenticatedFetch(construireUrlApi(`/api/admin/utilisateurs/${employer.id_utilisateur}/statut`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statut: "suspendu" }),
      });
      const data: { message?: string } = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || "Impossible de suspendre l'entreprise.");
      }

      await refreshAfterAction();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Impossible de suspendre l'entreprise.");
    } finally {
      setActionInProgress(null);
    }
  };

  return (
    <main className="page-centree section-page app-theme">
      <style>{styles}</style>

      <section className="companies-page">
        <section className="companies-panel">
          <div className="companies-toolbar">
            <label className="companies-search">
              <Search aria-hidden="true" />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search company name or email..."
                aria-label="Search companies"
              />
            </label>
            <label className="companies-select-wrap">
              <select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Filter companies by status">
                <option value="">All statuses</option>
                <option value="actif">Active</option>
                <option value="en_attente">Pending</option>
                <option value="suspendu">Suspended</option>
                <option value="inactif">Inactive</option>
              </select>
              <span aria-hidden="true">
                <svg viewBox="0 0 20 20" fill="none">
                  <path d="m5 7.5 5 5 5-5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </label>
            <label className="companies-field">
              <input
                type="text"
                value={region}
                onChange={(event) => setRegion(event.target.value)}
                placeholder="Region"
                aria-label="Filter companies by region"
              />
            </label>
            <label className="companies-field">
              <input
                type="date"
                value={createdFrom}
                onChange={(event) => setCreatedFrom(event.target.value)}
                onBlur={() => setCreatedFrom((current) => normalizeFilterDate(current, todayIso))}
                max={todayIso}
                aria-label="Filter companies by creation date from"
              />
            </label>
          </div>

          {error ? <p className="message message-erreur" role="alert">{error}</p> : null}

          <div className="companies-table-wrap">
            <table className="companies-table">
              <colgroup>
                <col style={{ width: "246px" }} />
                <col style={{ width: "166px" }} />
                <col style={{ width: "118px" }} />
                <col style={{ width: "176px" }} />
                <col style={{ width: "112px" }} />
                <col style={{ width: "154px" }} />
              </colgroup>
              <thead>
                <tr>
                  <th>Entreprise</th>
                  <th>Contact</th>
                  <th>Statut</th>
                  <th>Region</th>
                  <th>Creation</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6}>Chargement des entreprises...</td>
                  </tr>
                ) : employersFiltres.length === 0 ? (
                  <tr>
                    <td colSpan={6}>Aucune entreprise ne correspond a ces filtres.</td>
                  </tr>
                ) : (
                  employersFiltres.map((employer) => {
                    const isBusy = actionInProgress === employer.id_utilisateur;
                    const contactValue = employer.telephone?.trim() || employer.email;

                    return (
                      <tr key={employer.id_utilisateur}>
                        <td>
                          <div className="company-cell">
                            <span className="company-icon" aria-hidden="true">
                              <Building2 />
                            </span>
                            <div>
                              <strong className="company-name">{employer.nom_entreprise || employer.nom || "Entreprise"}</strong>
                              <span className="company-email">{employer.email}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="company-contact">
                            <strong>{contactValue || "-"}</strong>
                          </div>
                        </td>
                        <td>
                          <span className={`company-status company-status--${employer.statut}`}>
                            {STATUS_LABELS[employer.statut] || employer.statut}
                          </span>
                        </td>
                        <td
                          className="company-address"
                          title={employer.region || employer.gouvernorat || employer.delegation || employer.addresse || undefined}
                        >
                          {employer.region || employer.gouvernorat || employer.delegation || employer.addresse || "-"}
                        </td>
                        <td className="company-date">{formatDate(employer.created_at)}</td>
                        <td>
                          <div className="companies-actions">
                            <button className="companies-action-btn companies-action-btn--view" onClick={() => void openView(employer)} disabled={isBusy} type="button">
                              <Eye aria-hidden="true" />
                              <span>View</span>
                            </button>
                            <button
                              className="companies-action-btn companies-action-btn--suspend"
                              onClick={() => void suspendCompany(employer)}
                              disabled={isBusy || employer.statut === "suspendu"}
                              type="button"
                            >
                              <Ban aria-hidden="true" />
                              <span>{employer.statut === "suspendu" ? "Suspended" : "Suspend"}</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <footer className="companies-pagination">
            <span>
              Page {page} / {totalPages} - {employersFiltres.length} shown ({totalEmployers} total)
            </span>
            <div className="companies-pagination-controls">
              <Button
                variant="secondary"
                className="companies-pagination-btn"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={page <= 1}
              >
                Precedent
              </Button>
              <Button
                variant="secondary"
                className="companies-pagination-btn"
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                disabled={page >= totalPages}
              >
                Suivant
              </Button>
            </div>
          </footer>
        </section>
      </section>

      {isClient && modalMode ? createPortal(
        <div
          className="companies-modal-overlay"
          role="dialog"
          aria-modal="true"
          onClick={closeModal}
        >
          <Card
            padding="lg"
            className={`companies-modal-card${modalMode === "view" ? " companies-modal-card--view" : ""}`}
            onClick={(event) => event.stopPropagation()}
          >
            {modalMode === "view" ? (
              <div>
                <div className="companies-modal-header">
                  <div>
                    <p className="companies-kicker">Profil entreprise</p>
                    <h2 className="companies-modal-title">{selectedCompany?.nom_entreprise || selectedCompany?.nom || "Entreprise"}</h2>
                    <p className="companies-modal-email">{selectedCompany?.email || "-"}</p>
                  </div>
                  <button className="companies-modal-close" type="button" onClick={closeModal} aria-label="Fermer">
                    <X aria-hidden="true" />
                  </button>
                </div>
                {modalLoading ? <p>Chargement du profil...</p> : null}
                {viewError ? <p className="message message-erreur">{viewError}</p> : null}
                {!modalLoading && !viewError && selectedCompany ? (() => {
                  const companyName = selectedCompany.nom_entreprise || selectedCompany.nom || "Entreprise";
                  const logoUrl = resolveCompanyLogoUrl(selectedCompany.logo_url);
                  const location = compactCompanyLocation(selectedCompany);
                  const activeStatus = selectedCompany.statut_validation || selectedCompany.statut || "en_attente";
                  const website = selectedCompany.site_web || selectedCompany.url_site;
                  const employeeCount = selectedCompany.nbr_employe ?? null;
                  const disabledEmployees = selectedCompany.nbr_employe_handicape ?? null;
                  const accessibilityRatio = employeeCount && disabledEmployees !== null
                    ? Math.round((disabledEmployees / Math.max(employeeCount, 1)) * 100)
                    : null;

                  return (
                    <div className="company-profile-view">
                      <section className="company-profile-hero">
                        <div className="company-profile-logo">
                          {logoUrl ? <img src={logoUrl} alt={`Logo ${companyName}`} /> : <span>{companyInitials(companyName)}</span>}
                        </div>
                        <div>
                          <p className="companies-kicker">Profil entreprise</p>
                          <h3>{companyName}</h3>
                          <div className="company-profile-meta">
                            <span><Building2 size={15} /> {selectedCompany.secteur_activite || "Secteur non renseigne"}</span>
                            <span><MapPin size={15} /> {location}</span>
                            <span><Users size={15} /> {companySizeLabel(selectedCompany)}</span>
                            <span><CheckCircle2 size={15} /> {STATUS_LABELS[activeStatus] || activeStatus}</span>
                          </div>
                        </div>
                      </section>

                      <section className="company-profile-kpis" aria-label="Statistiques entreprise">
                        <article><BriefcaseBusiness size={18} /><span>Offres actives</span><strong>—</strong></article>
                        <article><Users size={18} /><span>Employes</span><strong>{employeeCount ?? "—"}</strong></article>
                        <article><ShieldCheck size={18} /><span>Inclusion</span><strong>{accessibilityRatio === null ? "—" : `${accessibilityRatio}%`}</strong></article>
                        <article><CalendarDays size={18} /><span>Inscrite le</span><strong>{formatDate(selectedCompany.created_at || selectedCompanyCreatedAt)}</strong></article>
                      </section>

                      <section className="company-profile-grid">
                        <article className="company-profile-panel company-profile-panel-wide">
                          <h3>Vue d&apos;ensemble</h3>
                          <p>{selectedCompany.description || "Cette entreprise n'a pas encore ajoute de presentation publique detaillee."}</p>
                          <div className="company-values">
                            <span><ShieldCheck size={16} /> Engagement accessibilite</span>
                            <span><Users size={16} /> Diversite & inclusion</span>
                            <span><BarChart3 size={16} /> Croissance responsable</span>
                          </div>
                        </article>

                        <article className="company-profile-panel">
                          <h3>Engagement handicap</h3>
                          <p>{selectedCompany.politique_handicap || "Politique handicap a completer dans le profil entreprise."}</p>
                        </article>

                        <article className="company-profile-panel">
                          <h3>Equipe recrutement</h3>
                          <div className="company-team-card">
                            <span>{companyInitials(selectedCompany.contact_rh_nom || selectedCompany.nom)}</span>
                            <div>
                              <strong>{selectedCompany.contact_rh_nom || selectedCompany.nom || "Contact RH"}</strong>
                              <small>{selectedCompany.contact_rh_email || selectedCompany.email || "Email non renseigne"}</small>
                            </div>
                          </div>
                          <div className="company-contact-list">
                            <span><Mail size={15} /> {selectedCompany.contact_rh_email || selectedCompany.email || "-"}</span>
                            <span><Phone size={15} /> {selectedCompany.contact_rh_telephone || selectedCompany.telephone || "-"}</span>
                            <span><Globe2 size={15} /> {website || "Site web non renseigne"}</span>
                          </div>
                        </article>

                        <article className="company-profile-panel">
                          <h3>Postes ouverts</h3>
                          <div className="company-job-card">
                            <strong>{selectedCompany.secteur_activite || "Recrutement inclusif"}</strong>
                            <span>{companyName}</span>
                            <small>Les offres actives sont consultables dans l&apos;espace offres.</small>
                          </div>
                        </article>

                        <article className="company-profile-panel company-profile-panel-wide">
                          <h3>Informations administratives</h3>
                          <div className="company-admin-strip">
                            <span>Patente <b>{selectedCompany.patente || "-"}</b></span>
                            <span>RNE <b>{selectedCompany.rne || "-"}</b></span>
                            <span>SIRET <b>{selectedCompany.siret || "-"}</b></span>
                            <span>Profil public <b>{selectedCompany.profil_publique ? "Oui" : "Non"}</b></span>
                          </div>
                        </article>
                      </section>
                    </div>
                  );
                })() : null}
              </div>
            ) : (
              <div>
                <div className="companies-modal-header">
                  <div>
                    <p className="companies-kicker">{modalMode === "create" ? "Nouvelle entreprise" : "Modifier l'entreprise"}</p>
                    <h2 className="companies-modal-title">{modalMode === "create" ? "Creer un compte entreprise" : "Mettre a jour le compte entreprise"}</h2>
                    <p className="texte-secondaire">Renseignez les informations du compte et de l'entreprise dans un seul formulaire.</p>
                  </div>
                  <button className="companies-modal-close" type="button" onClick={closeModal} aria-label="Fermer">
                    <X aria-hidden="true" />
                  </button>
                </div>

                {modalLoading ? (
                  <p>Chargement...</p>
                ) : (
                  <form
                    className="company-form"
                    onSubmit={(event) => {
                      event.preventDefault();
                      void submitForm();
                    }}
                  >
                    {formError ? <p className="message message-erreur" role="alert">{formError}</p> : null}

                    <div className="company-form-grid">
                      <div className="company-form-field">
                        <label htmlFor="company-contact-name">Nom du contact</label>
                        <input id="company-contact-name" value={form.nom} onChange={(event) => setForm((current) => ({ ...current, nom: event.target.value }))} />
                      </div>
                      <div className="company-form-field">
                        <label htmlFor="company-email">Email</label>
                        <input id="company-email" type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} />
                      </div>
                      <div className="company-form-field">
                        <label htmlFor="company-phone">Telephone</label>
                        <input id="company-phone" value={form.telephone} onChange={(event) => setForm((current) => ({ ...current, telephone: event.target.value }))} />
                      </div>
                      <div className="company-form-field">
                        <label htmlFor="company-address">Adresse</label>
                        <input id="company-address" value={form.addresse} onChange={(event) => setForm((current) => ({ ...current, addresse: event.target.value }))} />
                      </div>
                      <div className="company-form-field">
                        <label htmlFor="company-name">Nom de l'entreprise</label>
                        <input id="company-name" value={form.nom_entreprise} onChange={(event) => setForm((current) => ({ ...current, nom_entreprise: event.target.value }))} />
                      </div>
                      <div className="company-form-field">
                        <label htmlFor="company-date">Date de creation</label>
                        <input id="company-date" type="date" value={form.date_fondation} onChange={(event) => setForm((current) => ({ ...current, date_fondation: event.target.value }))} />
                      </div>
                      <div className="company-form-field">
                        <label htmlFor="company-patente">Patente</label>
                        <input id="company-patente" value={form.patente} onChange={(event) => setForm((current) => ({ ...current, patente: event.target.value }))} />
                      </div>
                      <div className="company-form-field">
                        <label htmlFor="company-rne">RNE</label>
                        <input id="company-rne" value={form.rne} onChange={(event) => setForm((current) => ({ ...current, rne: event.target.value }))} />
                      </div>
                      <div className="company-form-field">
                        <label htmlFor="company-sector">Secteur</label>
                        <input id="company-sector" value={form.secteur_activite} onChange={(event) => setForm((current) => ({ ...current, secteur_activite: event.target.value }))} />
                      </div>
                      <div className="company-form-field">
                        <label htmlFor="company-size">Taille de l'entreprise</label>
                        <input id="company-size" value={form.taille_entreprise} onChange={(event) => setForm((current) => ({ ...current, taille_entreprise: event.target.value }))} />
                      </div>
                      <div className="company-form-field">
                        <label htmlFor="company-siret">Siret</label>
                        <input id="company-siret" value={form.siret} onChange={(event) => setForm((current) => ({ ...current, siret: event.target.value }))} />
                      </div>
                      <div className="company-form-field">
                        <label htmlFor="company-site">Site web</label>
                        <input id="company-site" value={form.site_web} onChange={(event) => setForm((current) => ({ ...current, site_web: event.target.value }))} />
                      </div>
                      <div className="company-form-field">
                        <label htmlFor="company-rh-name">Contact RH</label>
                        <input id="company-rh-name" value={form.contact_rh_nom} onChange={(event) => setForm((current) => ({ ...current, contact_rh_nom: event.target.value }))} />
                      </div>
                      <div className="company-form-field">
                        <label htmlFor="company-rh-email">Email RH</label>
                        <input id="company-rh-email" type="email" value={form.contact_rh_email} onChange={(event) => setForm((current) => ({ ...current, contact_rh_email: event.target.value }))} />
                      </div>
                      <div className="company-form-field">
                        <label htmlFor="company-rh-phone">Telephone RH</label>
                        <input id="company-rh-phone" value={form.contact_rh_telephone} onChange={(event) => setForm((current) => ({ ...current, contact_rh_telephone: event.target.value }))} />
                      </div>
                      <div className="company-form-field">
                        <label htmlFor="company-employees">Employes</label>
                        <input id="company-employees" type="number" min="0" value={form.nbr_employe} onChange={(event) => setForm((current) => ({ ...current, nbr_employe: event.target.value }))} />
                      </div>
                      <div className="company-form-field">
                        <label htmlFor="company-employees-handicap">Employes en situation de handicap</label>
                        <input id="company-employees-handicap" type="number" min="0" value={form.nbr_employe_handicape} onChange={(event) => setForm((current) => ({ ...current, nbr_employe_handicape: event.target.value }))} />
                      </div>
                      <div className="company-form-field company-form-field--full">
                        <label htmlFor="company-description">Description</label>
                        <textarea id="company-description" rows={4} value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} />
                      </div>
                      <div className="company-form-field company-form-field--full">
                        <label htmlFor="company-policy">Politique handicap</label>
                        <textarea id="company-policy" rows={4} value={form.politique_handicap} onChange={(event) => setForm((current) => ({ ...current, politique_handicap: event.target.value }))} />
                      </div>
                      <div className="company-form-field">
                        <label htmlFor="company-public">Profil public</label>
                        <select
                          id="company-public"
                          value={form.profil_publique ? "yes" : "no"}
                          onChange={(event) => setForm((current) => ({ ...current, profil_publique: event.target.value === "yes" }))}
                        >
                          <option value="no">Non</option>
                          <option value="yes">Oui</option>
                        </select>
                      </div>
                    </div>

                    <div className="company-form-actions">
                      <Button variant="secondary" type="button" onClick={closeModal}>
                        Annuler
                      </Button>
                      <Button type="submit">{modalMode === "create" ? "Creer l'entreprise" : "Enregistrer les modifications"}</Button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </Card>
        </div>,
        document.body,
      ) : null}
    </main>
  );
}

export default function PageProtegee() {
  return (
    <RouteProtegee rolesAutorises={["admin"]}>
      <AdminCompaniesPage />
    </RouteProtegee>
  );
}
