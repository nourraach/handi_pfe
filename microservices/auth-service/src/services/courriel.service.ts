import nodemailer from "nodemailer";
import { env } from "../config/env";

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
}

