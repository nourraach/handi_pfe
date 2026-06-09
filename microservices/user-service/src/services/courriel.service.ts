import nodemailer from "nodemailer";
import { env } from "../config/env";

const echapperHtml = (valeur: string) =>
  valeur
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

export class CourrielService {
  private transporteur = env.smtpHost
    ? nodemailer.createTransport({
        host: env.smtpHost,
        port: env.smtpPort,
        secure: env.smtpSecure,
        auth: env.smtpUser ? { user: env.smtpUser, pass: env.smtpPass } : undefined,
        connectionTimeout: 5000,
        greetingTimeout: 5000,
        socketTimeout: 8000,
      })
    : nodemailer.createTransport({
        jsonTransport: true,
      });

  async envoyerCourrielReset(email: string, nom: string, lien: string) {
    const info = await this.transporteur.sendMail({
      from: env.emailFrom,
      to: email,
      subject: "Réinitialisation de mot de passe HandiTalents",
      html: `
        <div style="font-family: Arial, sans-serif; color: #1f2937;">
          <h2>Réinitialisation de mot de passe</h2>
          <p>Bonjour ${nom || "utilisateur"},</p>
          <p>Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le lien ci-dessous :</p>
          <p><a href="${lien}">${lien}</a></p>
          <p>Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>
        </div>
      `,
    });
    return { messageId: info.messageId };
  }

  async envoyerCourrielDefinitionMotDePasse(email: string, nom: string, lien: string) {
    const info = await this.transporteur.sendMail({
      from: env.emailFrom,
      to: email,
      subject: "Finalisez votre compte HandiTalents",
      html: `
        <div style="font-family: Arial, sans-serif; color: #1f2937;">
          <h2>Bienvenue sur HandiTalents</h2>
          <p>Bonjour ${nom || "utilisateur"},</p>
          <p>Votre compte a ete cree par un administrateur.</p>
          <p>Cliquez sur le lien ci-dessous pour definir votre mot de passe en toute securite :</p>
          <p><a href="${lien}">${lien}</a></p>
          <p>Si vous n'etes pas a l'origine de cette creation, vous pouvez ignorer cet email.</p>
        </div>
      `,
    });

    return { messageId: info.messageId };
  }

  async envoyerAlerteTentativesConnexionEntreprise(email: string, nom: string, tentatives: number) {
    const info = await this.transporteur.sendMail({
      from: env.emailFrom,
      to: email,
      subject: "Alerte securite - Tentatives de connexion echouees",
      html: `
        <div style="font-family: Arial, sans-serif; color: #1f2937;">
          <h2>Alerte de securite</h2>
          <p>Bonjour ${nom || "entreprise"},</p>
          <p>Nous avons detecte ${tentatives} tentatives de connexion echouees sur votre compte entreprise.</p>
          <p>Si ces tentatives ne viennent pas de vous, nous vous recommandons de changer votre mot de passe rapidement.</p>
        </div>
      `,
    });
    return { messageId: info.messageId };
  }

  async envoyerCourrielRefusInscription(email: string, nom: string, motifRefus: string) {
    const motifSecurise = echapperHtml(motifRefus);
    const info = await this.transporteur.sendMail({
      from: env.emailFrom,
      to: email,
      subject: "Resultat de votre demande d'inscription HandiTalents",
      html: `
        <div style="font-family: Arial, sans-serif; color: #1f2937;">
          <h2>Demande d'inscription non retenue</h2>
          <p>Bonjour ${nom || "utilisateur"},</p>
          <p>Apres examen de votre demande, nous ne pouvons pas valider votre inscription sur la plateforme pour le moment.</p>
          <p><strong>Motif de refus :</strong></p>
          <p style="background:#f8fafc; border:1px solid #e5e7eb; border-radius:8px; padding:12px; margin:8px 0 16px;">
            ${motifSecurise}
          </p>
          <p>Vous pouvez mettre a jour votre dossier et soumettre une nouvelle demande si necessaire.</p>
          <p>L'equipe HandiTalents.</p>
        </div>
      `,
    });

    return { messageId: info.messageId };
  }
}
