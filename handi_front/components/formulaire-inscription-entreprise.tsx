"use client";

import { FormEvent, useState } from "react";
import { construireUrlApi } from "@/lib/config";

const etatInitial = {
  nom: "",
  email: "",
  telephone: "",
  mdp: "",
  addresse: "",
  nom_entreprise: "",
  patente: "",
  rne: "",
  profil_publique: false,
  url_site: "",
  date_fondation: "",
  description: "",
  nbr_employe: "",
  nbr_employe_handicape: "",
};

export function FormulaireInscriptionEntreprise() {
  const [formulaire, setFormulaire] = useState(etatInitial);
  const [message, setMessage] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);

  const soumettre = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setChargement(true);
    setMessage(null);
    setErreur(null);

    // Validation de la date de fondation
    if (formulaire.date_fondation) {
      const dateFondation = new Date(formulaire.date_fondation);
      const aujourdhui = new Date();
      aujourdhui.setHours(0, 0, 0, 0);
      
      if (dateFondation > aujourdhui) {
        setErreur("The founding date cannot be in the future.");
        setChargement(false);
        return;
      }
    }

    try {
      const reponse = await fetch(construireUrlApi("/api/auth/inscription/entreprise"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formulaire,
          nbr_employe: Number(formulaire.nbr_employe),
          nbr_employe_handicape: Number(formulaire.nbr_employe_handicape),
        }),
      });

      const resultat = await reponse.json();

      if (!reponse.ok) {
        throw new Error(resultat.message ?? "Unable to submit request.");
      }

      setMessage(resultat.message);
      setFormulaire(etatInitial);
    } catch (cause) {
      setErreur(cause instanceof Error ? cause.message : "An error occurred.");
    } finally {
      setChargement(false);
    }
  };

  return (
    <form className="bloc-principal" onSubmit={soumettre}>
      <div className="grille-formulaire">
        <Champ label="Name" valeur={formulaire.nom} onChange={(nom) => setFormulaire({ ...formulaire, nom })} />
        <Champ label="Email" type="email" valeur={formulaire.email} onChange={(email) => setFormulaire({ ...formulaire, email })} />
        <Champ label="Phone" valeur={formulaire.telephone} onChange={(telephone) => setFormulaire({ ...formulaire, telephone })} />
        <Champ label="Password" type="password" valeur={formulaire.mdp} onChange={(mdp) => setFormulaire({ ...formulaire, mdp })} />
        <Champ label="Address" valeur={formulaire.addresse} onChange={(addresse) => setFormulaire({ ...formulaire, addresse })} />
        <Champ label="Company Name" valeur={formulaire.nom_entreprise} onChange={(nom_entreprise) => setFormulaire({ ...formulaire, nom_entreprise })} />
        <Champ label="Patent Number" valeur={formulaire.patente} onChange={(patente) => setFormulaire({ ...formulaire, patente })} />
        <Champ label="RNE" valeur={formulaire.rne} onChange={(rne) => setFormulaire({ ...formulaire, rne })} />
        <Champ label="Website URL" type="url" valeur={formulaire.url_site} onChange={(url_site) => setFormulaire({ ...formulaire, url_site })} />
        <Champ 
          label="Founding Date" 
          type="date" 
          valeur={formulaire.date_fondation} 
          onChange={(date_fondation) => setFormulaire({ ...formulaire, date_fondation })}
          max={new Date().toISOString().split('T')[0]}
        />
        <Champ label="Number of Employees" type="number" valeur={formulaire.nbr_employe} onChange={(nbr_employe) => setFormulaire({ ...formulaire, nbr_employe })} />
        <Champ label="Number of Employees with Disabilities" type="number" valeur={formulaire.nbr_employe_handicape} onChange={(nbr_employe_handicape) => setFormulaire({ ...formulaire, nbr_employe_handicape })} />
        <div className="groupe-champ" style={{ gridColumn: "1 / -1" }}>
          <label htmlFor="profil_publique">Public Profile</label>
          <label style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <input
              id="profil_publique"
              type="checkbox"
              checked={formulaire.profil_publique}
              onChange={(event) => setFormulaire({ ...formulaire, profil_publique: event.target.checked })}
            />
            Make profile visible once validations are complete.
          </label>
        </div>
        <div className="groupe-champ" style={{ gridColumn: "1 / -1" }}>
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            className="champ-zone"
            value={formulaire.description}
            onChange={(event) => setFormulaire({ ...formulaire, description: event.target.value })}
          />
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, marginTop: 24, flexWrap: "wrap" }}>
        <button className="bouton-primaire" disabled={chargement} type="submit">
          {chargement ? "Submitting..." : "Submit Application"}
        </button>
      </div>

      {message ? <p className="message message-info">{message}</p> : null}
      {erreur ? <p className="message message-erreur">{erreur}</p> : null}
    </form>
  );
}

function Champ({
  label,
  valeur,
  onChange,
  type = "text",
  min,
  max,
}: {
  label: string;
  valeur: string;
  onChange: (valeur: string) => void;
  type?: string;
  min?: string;
  max?: string;
}) {
  const id = label.toLowerCase().replace(/[^a-z0-9]+/g, "-");

  return (
    <div className="groupe-champ">
      <label htmlFor={id}>{label}</label>
      <input 
        id={id} 
        className="champ" 
        type={type} 
        value={valeur} 
        onChange={(event) => onChange(event.target.value)} 
        required={type !== "url"} 
        min={min}
        max={max}
      />
    </div>
  );
}
