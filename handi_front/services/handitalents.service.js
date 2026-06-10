import FormData from "form-data";
import fs from "fs";
import path from "path";

const IA_API_URL = process.env.IA_API_URL || "http://localhost:8000";

async function _fetch(url, options) {
  const { default: fetch } = await import("node-fetch");
  return fetch(url, options);
}

export async function verifierIA() {
  try {
    const response = await _fetch(`${IA_API_URL}/`, {
      signal: AbortSignal.timeout(3000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function analyserCV(cheminCv, texteOffre, experienceMin = 0) {
  const form = new FormData();

  form.append("cv", fs.createReadStream(cheminCv), {
    filename: path.basename(cheminCv),
    contentType: "application/pdf",
  });
  form.append("texte_offre", texteOffre);
  form.append("experience_min", String(experienceMin));

  const response = await _fetch(`${IA_API_URL}/analyser-cv`, {
    method: "POST",
    body: form,
    headers: form.getHeaders(),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`HandiTalents IA erreur ${response.status}: ${detail}`);
  }

  return response.json();
}

export async function shortlister(cheminsCvs, texteOffre, seuilMin = 60, experienceMin = 0) {
  const form = new FormData();

  for (const chemin of cheminsCvs) {
    form.append("cvs", fs.createReadStream(chemin), {
      filename: path.basename(chemin),
      contentType: "application/pdf",
    });
  }

  form.append("texte_offre", texteOffre);
  form.append("seuil_min", String(seuilMin));
  form.append("experience_min", String(experienceMin));

  const response = await _fetch(`${IA_API_URL}/shortlister`, {
    method: "POST",
    body: form,
    headers: form.getHeaders(),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`HandiTalents IA erreur ${response.status}: ${detail}`);
  }

  return response.json();
}

export async function listerOffres() {
  const response = await _fetch(`${IA_API_URL}/offres`);
  if (!response.ok) {
    throw new Error("Impossible de recuperer les offres");
  }
  return response.json();
}
