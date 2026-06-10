import { NextResponse } from "next/server";
import { mkdirSync, unlinkSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { shortlister, verifierIA } from "@/services/handitalents.service";

function nettoyerNomFichier(value) {
  return String(value || "cv.pdf").replace(/[^\w.\-]/g, "_");
}

export async function POST(request) {
  const iaDisponible = await verifierIA();

  if (!iaDisponible) {
    return NextResponse.json(
      {
        error: "Module IA indisponible",
        message: "Verifiez que le serveur Python tourne sur le port 8000",
        solution: "cd handitalents-ia && uvicorn api.main:app --port 8000 --reload",
      },
      { status: 503 },
    );
  }

  const formData = await request.formData();
  const cvFiles = formData.getAll("cvs");
  const texteOffre = String(formData.get("texte_offre") || "");
  const seuilMin = Number.parseInt(String(formData.get("seuil_min") || "60"), 10);
  const experienceMin = Number.parseInt(String(formData.get("experience_min") || "0"), 10);

  if (!cvFiles.length) {
    return NextResponse.json({ error: "Aucun CV fourni" }, { status: 400 });
  }

  if (!texteOffre.trim()) {
    return NextResponse.json({ error: "Le texte de l offre est requis" }, { status: 400 });
  }

  const dossierTmp = join(tmpdir(), "handitalents");
  const cheminsTmp = [];

  try {
    mkdirSync(dossierTmp, { recursive: true });

    for (const file of cvFiles) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const fichierNettoye = nettoyerNomFichier(file?.name);
      const cheminTmp = join(dossierTmp, `cv_${Date.now()}_${Math.random().toString(36).slice(2)}_${fichierNettoye}`);
      writeFileSync(cheminTmp, buffer);
      cheminsTmp.push(cheminTmp);
    }

    const resultat = await shortlister(
      cheminsTmp,
      texteOffre,
      Number.isNaN(seuilMin) ? 60 : seuilMin,
      Number.isNaN(experienceMin) ? 0 : experienceMin,
    );

    return NextResponse.json(resultat);
  } catch (error) {
    console.error("Erreur HandiTalents shortlister:", error);

    return NextResponse.json(
      {
        error: "Erreur lors de l analyse",
        detail: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 },
    );
  } finally {
    for (const cheminTmp of cheminsTmp) {
      try {
        unlinkSync(cheminTmp);
      } catch {}
    }
  }
}
