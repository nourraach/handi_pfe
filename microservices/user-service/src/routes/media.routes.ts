import { Router } from "express";
import fs from "fs";
import path from "path";
import { ilike, or } from "drizzle-orm";
import { db } from "../db";
import { candidatTable } from "../db/schema";
import { RoleUtilisateur } from "../types/enums";
import { verifierJwt } from "../utils/securite";

const routeur = Router();

const uploadRoot = path.join(__dirname, "..", "..", "public", "uploads", "candidats");

const setInlineHeaders = (res: any, contentType: string | null) => {
  // We can't truly prevent downloads, but we can:
  // - require auth
  // - avoid "attachment" disposition
  // - disable caching
  res.setHeader("Content-Disposition", "inline");
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  if (contentType) res.setHeader("Content-Type", contentType);
};

routeur.get("/candidats/:filename", async (req, res) => {
  const filename = String(req.params.filename || "");
  if (!filename || filename.includes("/") || filename.includes("\\") || filename.includes("..")) {
    return res.status(400).json({ message: "Nom de fichier invalide." });
  }

  const fullPath = path.join(uploadRoot, filename);
  if (!fs.existsSync(fullPath)) {
    return res.status(404).json({ message: "Fichier introuvable." });
  }

  // Find which candidate document this file belongs to.
  const pattern = `%${filename}`;
  const [row] = await db
    .select({
      id_utilisateur: candidatTable.id_utilisateur,
      carte: candidatTable.carte_handicap_url,
      video: candidatTable.video_cv_url,
      cv: candidatTable.cv_url,
      photo: candidatTable.photo_profil_url,
    })
    .from(candidatTable)
    .where(
      or(
        ilike(candidatTable.carte_handicap_url, pattern),
        ilike(candidatTable.video_cv_url, pattern),
        ilike(candidatTable.cv_url, pattern),
        ilike(candidatTable.photo_profil_url, pattern),
      ),
    )
    .limit(1);

  if (!row) {
    return res.status(403).json({ message: "Acces non autorise." });
  }

  const isCarte = typeof row.carte === "string" && row.carte.includes(filename);
  const isVideo = typeof row.video === "string" && row.video.includes(filename);
  const isCv = typeof row.cv === "string" && row.cv.includes(filename);
  const isPhoto = typeof row.photo === "string" && row.photo.includes(filename);

  // Public-ish profile photos: allow without Authorization header
  // (the rest must be accessed via authenticated fetch in the UI).
  if (isPhoto) {
    const ext = path.extname(filename).toLowerCase();
    const contentType =
      ext === ".png"
        ? "image/png"
        : ext === ".jpg" || ext === ".jpeg"
          ? "image/jpeg"
          : ext === ".webp"
            ? "image/webp"
            : null;
    setInlineHeaders(res, contentType);
    return res.sendFile(fullPath);
  }

  const entete = req.headers.authorization;
  if (!entete?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Token d'authentification manquant." });
  }

  // Parse the token only for access checks (we don't support cookie auth in this project).
  let utilisateur: any = null;
  try {
    utilisateur = verifierJwt(entete.replace("Bearer ", "").trim());
  } catch {
    return res.status(401).json({ message: "Token invalide ou expire." });
  }

  const isOwner = utilisateur.role === RoleUtilisateur.CANDIDAT && utilisateur.id_utilisateur === row.id_utilisateur;
  const isAdminLike =
    utilisateur.role === RoleUtilisateur.ADMIN ||
    utilisateur.role === RoleUtilisateur.INSPECTEUR ||
    utilisateur.role === RoleUtilisateur.ANETI;

  // Access policy:
  // - carte handicap: owner or admin-like
  // - video/cv/photo: any authenticated user can view if they have the URL,
  //   but we still gate at least by authentication to avoid public downloads.
  //   (We can tighten this later for enterprise pack / application-based access.)
  if (isCarte && !(isOwner || isAdminLike)) {
    return res.status(403).json({ message: "Acces reserve." });
  }
  if ((isVideo || isCv) && !(isOwner || isAdminLike || utilisateur.role === RoleUtilisateur.ENTREPRISE)) {
    return res.status(403).json({ message: "Acces reserve." });
  }

  const ext = path.extname(filename).toLowerCase();
  const contentType =
    ext === ".pdf"
      ? "application/pdf"
      : ext === ".png"
        ? "image/png"
        : ext === ".jpg" || ext === ".jpeg"
          ? "image/jpeg"
          : ext === ".webp"
            ? "image/webp"
            : ext === ".mp4"
              ? "video/mp4"
              : null;

  setInlineHeaders(res, contentType);
  return res.sendFile(fullPath);
});

export const mediaRoutes = routeur;
