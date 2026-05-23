import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import { roleMiddleware } from "../middleware/role.middleware";
import { RoleUtilisateur } from "../types/enums";
import { CandidatureService } from "../services/candidature.service";

const router = Router();
const service = new CandidatureService();

router.get("/", authMiddleware, roleMiddleware([RoleUtilisateur.ENTREPRISE]), async (req, res, next) => {
  try {
    const candidatures = await service.obtenirCandidaturesEntreprise(req.utilisateur!.id_utilisateur, {});
    const header = [
      "id",
      "offre",
      "candidat",
      "email",
      "telephone",
      "statut",
      "date_postulation",
    ];
    const lines = candidatures.map((c: any) =>
      [
        c.id,
        c.offre?.titre || "",
        c.candidat?.nom || "",
        c.candidat?.email || "",
        c.candidat?.telephone || "",
        c.statut || "",
        c.created_at ? new Date(c.created_at).toISOString() : "",
      ]
        .map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`)
        .join(",")
    );
    const csv = [header.join(","), ...lines].join("\n");
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=candidatures.csv");
    return res.send(csv);
  } catch (err) {
    return next(err);
  }
});

export const entrepriseCandidatureExportRoutes = router;
