export type EntretienType = "visio" | "presentiel" | "telephonique";
export type EntretienStatut = "planifie" | "confirme" | "reporte" | "annule" | "termine";

export function formaterDateEntretien(dateString?: string) {
  if (!dateString) {
    return {
      date: "-",
      time: "-",
      shortDate: "-",
      raw: null as Date | null,
    };
  }

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return {
      date: "-",
      time: "-",
      shortDate: "-",
      raw: null as Date | null,
    };
  }

  return {
    date: date.toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    }),
    shortDate: date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }),
    time: date.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    }),
    raw: date,
  };
}

export function getEntretienTypeLabel(type?: EntretienType) {
  switch (type) {
    case "visio":
      return "Visio";
    case "presentiel":
      return "Présentiel";
    case "telephonique":
      return "Téléphone";
    default:
      return "Entretien";
  }
}

export function getEntretienStatutConfig(statut?: EntretienStatut) {
  switch (statut) {
    case "confirme":
      return { label: "Confirmé", className: "message-info" };
    case "reporte":
      return { label: "Reprogrammé", className: "message-neutre" };
    case "annule":
      return { label: "Annulé", className: "message-erreur" };
    case "termine":
      return { label: "Terminé", className: "message-neutre" };
    case "planifie":
    default:
      return { label: "Planifié", className: "message-neutre" };
  }
}

export function extraireDureeMinutes(duree?: string) {
  if (!duree) {
    return 60;
  }

  const match = duree.match(/\d+/);
  if (!match) {
    return 60;
  }

  const valeur = Number.parseInt(match[0], 10);
  if (Number.isNaN(valeur) || valeur <= 0) {
    return 60;
  }

  if (/heure/i.test(duree)) {
    return valeur * 60;
  }

  return valeur;
}

function formaterDateGoogle(date: Date) {
  const iso = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString();
  return iso.replace(/[-:]/g, "").split(".")[0] + "Z";
}

export function construireLienGoogleCalendar({
  titre,
  dateHeure,
  dureeMinutes,
  details,
  location,
}: {
  titre: string;
  dateHeure: string;
  dureeMinutes?: number;
  details?: string;
  location?: string;
}) {
  const debut = new Date(dateHeure);
  if (Number.isNaN(debut.getTime())) {
    return "#";
  }

  const fin = new Date(debut.getTime() + (dureeMinutes || 60) * 60000);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: titre,
    dates: `${formaterDateGoogle(debut)}/${formaterDateGoogle(fin)}`,
    details: details || "",
    location: location || "",
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
