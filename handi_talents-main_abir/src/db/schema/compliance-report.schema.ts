import { integer, json, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { entrepriseTable } from "./entreprise.schema";
import { utilisateurTable } from "./utilisateur.schema";

export const complianceReportStatusEnum = pgEnum("compliance_report_status", ["submitted", "validated", "rejected"]);

export interface ComplianceRecommendation {
  id: string;
  text: string;
  type: "general" | "rejection";
  author_user_id: string;
  author_role: string;
  created_at: string;
}

export const complianceReportTable = pgTable("compliance_report", {
  id: uuid("id").defaultRandom().primaryKey(),
  id_entreprise: uuid("id_entreprise")
    .notNull()
    .references(() => entrepriseTable.id, { onDelete: "cascade" }),
  submitted_by_user_id: uuid("submitted_by_user_id")
    .notNull()
    .references(() => utilisateurTable.id_utilisateur, { onDelete: "restrict" }),
  reviewed_by_user_id: uuid("reviewed_by_user_id").references(() => utilisateurTable.id_utilisateur, { onDelete: "set null" }),
  region: text("region").notNull(),
  summary: text("summary").notNull(),
  reporting_period_start: timestamp("reporting_period_start", { withTimezone: false }).notNull(),
  reporting_period_end: timestamp("reporting_period_end", { withTimezone: false }).notNull(),
  workforce_total: integer("workforce_total").notNull().default(0),
  disabled_employees: integer("disabled_employees").notNull().default(0),
  active_offers: integer("active_offers").notNull().default(0),
  applications_count: integer("applications_count").notNull().default(0),
  shortlisted_count: integer("shortlisted_count").notNull().default(0),
  hired_count: integer("hired_count").notNull().default(0),
  accommodation_actions: text("accommodation_actions"),
  evidence_urls: json("evidence_urls").$type<string[]>(),
  status: complianceReportStatusEnum("status").notNull().default("submitted"),
  review_comment: text("review_comment"),
  last_recommendation: text("last_recommendation"),
  recommendations: json("recommendations").$type<ComplianceRecommendation[]>(),
  submitted_at: timestamp("submitted_at", { withTimezone: false }).defaultNow().notNull(),
  reviewed_at: timestamp("reviewed_at", { withTimezone: false }),
  created_at: timestamp("created_at", { withTimezone: false }).defaultNow().notNull(),
  updated_at: timestamp("updated_at", { withTimezone: false }).defaultNow().notNull(),
});
