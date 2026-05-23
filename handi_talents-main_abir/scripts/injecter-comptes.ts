import "dotenv/config";
import * as bcrypt from "bcrypt";
import { db } from "../src/db";
import { utilisateurTable, candidatTable } from "../src/db/schema";
import { RoleUtilisateur, StatutUtilisateur, GenreUtilisateur } from "../src/types/enums";

async function injecterComptes() {
  try {
    console.log("🚀 Injection des comptes dans la base de données...\n");

    // Données pour l'admin
    const adminEmail = "admin@handitalents.com";
    const adminMotDePasse = "Admin123!";
    const adminMdpHashe = await bcrypt.hash(adminMotDePasse, 10);

    // Données pour le candidat
    const candidatEmail = "candidat@handitalents.com";
    const candidatMotDePasse = "Candidat123!";
    const candidatMdpHashe = await bcrypt.hash(candidatMotDePasse, 10);

    // Créer l'admin
    console.log("👤 Création du compte administrateur...");
    const [admin] = await db
      .insert(utilisateurTable)
      .values({
        nom: "Administrateur Principal",
        email: adminEmail,
        mdp: adminMdpHashe,
        telephone: "71234567",
        addresse: "Avenue Habib Bourguiba, Tunis",
        role: RoleUtilisateur.ADMIN,
        statut: StatutUtilisateur.ACTIF,
        genre: GenreUtilisateur.HOMME,
      })
      .returning()
      .onConflictDoNothing();

    if (admin) {
      console.log("✅ Administrateur créé avec succès!");
    } else {
      console.log("⚠️  Administrateur existe déjà");
    }

    // Créer l'utilisateur candidat
    console.log("\n👤 Création du compte candidat...");
    const [utilisateurCandidat] = await db
      .insert(utilisateurTable)
      .values({
        nom: "Ahmed Ben Ali",
        email: candidatEmail,
        mdp: candidatMdpHashe,
        telephone: "98765432",
        addresse: "Rue de la République, Sfax",
        role: RoleUtilisateur.CANDIDAT,
        statut: StatutUtilisateur.APPROUVE, // Vérifié par l'admin
        genre: GenreUtilisateur.HOMME,
      })
      .returning()
      .onConflictDoNothing();

    if (utilisateurCandidat) {
      console.log("✅ Utilisateur candidat créé avec succès!");
      
      // Créer le profil candidat
      console.log("📋 Création du profil candidat...");
      const [candidat] = await db
        .insert(candidatTable)
        .values({
          id_utilisateur: utilisateurCandidat.id_utilisateur,
          type_handicap: "Handicap moteur",
          num_carte_handicap: "HC123456789",
          date_expiration_carte_handicap: new Date("2026-12-31"),
          niveau_academique: "Licence en Informatique",
          description: "Développeur passionné avec 3 ans d'expérience en développement web. Spécialisé en JavaScript, React et Node.js.",
          secteur: "Technologies de l'information",
          type_licence: "Licence Appliquée",
          preference_communication: "Email et téléphone",
          age: 28,
        })
        .returning();

      console.log("✅ Profil candidat créé avec succès!");
    } else {
      console.log("⚠️  Candidat existe déjà");
    }

    console.log("\n" + "=".repeat(50));
    console.log("📋 INFORMATIONS DES COMPTES CRÉÉS");
    console.log("=".repeat(50));
    
    console.log("\n🔐 COMPTE ADMINISTRATEUR:");
    console.log("📧 Email: " + adminEmail);
    console.log("🔑 Mot de passe: " + adminMotDePasse);
    console.log("👤 Nom: Administrateur Principal");
    console.log("📱 Téléphone: 71234567");
    console.log("📍 Adresse: Avenue Habib Bourguiba, Tunis");
    
    console.log("\n🔐 COMPTE CANDIDAT (VÉRIFIÉ):");
    console.log("📧 Email: " + candidatEmail);
    console.log("🔑 Mot de passe: " + candidatMotDePasse);
    console.log("👤 Nom: Ahmed Ben Ali");
    console.log("📱 Téléphone: 98765432");
    console.log("📍 Adresse: Rue de la République, Sfax");
    console.log("♿ Type handicap: Handicap moteur");
    console.log("🎓 Niveau: Licence en Informatique");
    console.log("💼 Secteur: Technologies de l'information");
    
    console.log("\n⚠️  IMPORTANT: Changez ces mots de passe après la première connexion!");
    console.log("=".repeat(50));
    
    process.exit(0);
  } catch (erreur: any) {
    if (erreur.code === "23505") {
      console.error("❌ Un utilisateur avec cet email existe déjà.");
    } else {
      console.error("❌ Erreur lors de l'injection des comptes:", erreur.message);
      console.error(erreur);
    }
    process.exit(1);
  }
}

injecterComptes();