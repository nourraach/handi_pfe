import { config } from "dotenv";
config();

import { db } from "../src/db";
import { 
  utilisateurTable, 
  candidatTable, 
  entrepriseTable, 
  offreEmploiTable,
  candidatureTable,
  entretienTable,
  favorisTable,
  notificationTable
} from "../src/db/schema";
import { eq } from "drizzle-orm";

async function testerProcessusCandidature() {
  console.log("🚀 Test du processus global de candidature");

  try {
    // 1. Créer un candidat de test
    console.log("\n1️⃣ Création d'un candidat de test...");
    
    const [utilisateurCandidat] = await db.insert(utilisateurTable).values({
      nom: "Jean Dupont",
      email: "jean.dupont@test.com",
      mdp: "password123",
      telephone: "0123456789",
      addresse: "123 Rue Test",
      statut: "actif",
      role: "candidat",
      genre: "homme"
    }).returning();

    const [candidat] = await db.insert(candidatTable).values({
      id_utilisateur: utilisateurCandidat.id_utilisateur,
      type_handicap: "moteur",
      num_carte_handicap: "12345",
      date_expiration_carte_handicap: new Date("2025-12-31"),
      niveau_academique: "master",
      description: "Développeur passionné",
      secteur: "informatique",
      type_licence: "permis_b",
      preference_communication: "email",
      age: 28,
      competences: ["JavaScript", "TypeScript", "React"],
      experience: "3 ans d'expérience en développement web",
      cv_url: "https://example.com/cv.pdf"
    }).returning();

    console.log(`✅ Candidat créé: ${candidat.id}`);

    // 2. Créer une entreprise de test
    console.log("\n2️⃣ Création d'une entreprise de test...");
    
    const [utilisateurEntreprise] = await db.insert(utilisateurTable).values({
      nom: "TechCorp",
      email: "rh@techcorp.com",
      mdp: "password123",
      telephone: "0987654321",
      addresse: "456 Avenue Business",
      statut: "actif",
      role: "entreprise",
      genre: "autre"
    }).returning();

    const [entreprise] = await db.insert(entrepriseTable).values({
      id_utilisateur: utilisateurEntreprise.id_utilisateur,
      nom_entreprise: "TechCorp Solutions",
      patente: "PAT123456",
      rne: "RNE789012",
      statut_validation: "valide",
      profil_publique: true,
      date_fondation: new Date("2020-01-01"),
      description: "Entreprise de développement logiciel",
      nbr_employe: 50,
      nbr_employe_handicape: 5,
      secteur_activite: "Informatique",
      contact_rh_nom: "Marie Martin",
      contact_rh_email: "marie.martin@techcorp.com"
    }).returning();

    console.log(`✅ Entreprise créée: ${entreprise.id}`);

    // 3. Créer une offre d'emploi
    console.log("\n3️⃣ Création d'une offre d'emploi...");
    
    const [offre] = await db.insert(offreEmploiTable).values({
      id_entreprise: entreprise.id,
      titre: "Développeur Full Stack",
      description: "Nous recherchons un développeur full stack passionné pour rejoindre notre équipe dynamique.",
      localisation: "Paris",
      type_poste: "cdi",
      salaire_min: "35000",
      salaire_max: "45000",
      competences_requises: "JavaScript, TypeScript, React, Node.js",
      experience_requise: "2-5 ans",
      niveau_etude: "Bac+3",
      accessibilite_handicap: true,
      amenagements_possibles: "Télétravail partiel, aménagement de poste"
    }).returning();

    console.log(`✅ Offre créée: ${offre.id}`);

    // 4. Le candidat postule à l'offre
    console.log("\n4️⃣ Candidature à l'offre...");
    
    const [candidature] = await db.insert(candidatureTable).values({
      id_candidat: candidat.id,
      id_offre: offre.id,
      lettre_motivation: "Je suis très intéressé par ce poste qui correspond parfaitement à mon profil.",
      cv_url: "https://example.com/cv.pdf"
    }).returning();

    console.log(`✅ Candidature créée: ${candidature.id} (statut: ${candidature.statut})`);

    // 5. L'entreprise shortliste le candidat
    console.log("\n5️⃣ Shortlisting du candidat...");
    
    const [candidatureShortlistee] = await db.update(candidatureTable)
      .set({ 
        statut: "shortlisted",
        updated_at: new Date()
      })
      .where(eq(candidatureTable.id, candidature.id))
      .returning();

    console.log(`✅ Candidat shortlisté (statut: ${candidatureShortlistee.statut})`);

    // 6. Planification d'un entretien
    console.log("\n6️⃣ Planification d'un entretien...");
    
    const dateEntretien = new Date();
    dateEntretien.setDate(dateEntretien.getDate() + 7); // Dans 7 jours

    const [entretien] = await db.insert(entretienTable).values({
      id_candidature: candidature.id,
      date_heure: dateEntretien,
      type: "visio",
      lieu_visio: "https://meet.google.com/abc-def-ghi",
      duree_prevue: "1 heure",
      contact_entreprise: "marie.martin@techcorp.com"
    }).returning();

    // Mettre à jour le statut de la candidature
    await db.update(candidatureTable)
      .set({ 
        statut: "interview_scheduled",
        updated_at: new Date()
      })
      .where(eq(candidatureTable.id, candidature.id));

    console.log(`✅ Entretien planifié: ${entretien.id} (${entretien.date_heure})`);

    // 7. Ajout aux favoris (autre offre)
    console.log("\n7️⃣ Test des favoris...");
    
    const [autreFavori] = await db.insert(favorisTable).values({
      id_candidat: candidat.id,
      id_offre: offre.id
    }).returning();

    console.log(`✅ Offre ajoutée aux favoris: ${autreFavori.id}`);

    // 8. Création de notifications
    console.log("\n8️⃣ Test des notifications...");
    
    const [notification] = await db.insert(notificationTable).values({
      id_utilisateur: utilisateurCandidat.id_utilisateur,
      type: "interview_scheduled",
      titre: "Entretien planifié",
      message: `Un entretien a été planifié pour le ${dateEntretien.toLocaleDateString()}`,
      data: JSON.stringify({ 
        id_entretien: entretien.id, 
        offre: offre.titre 
      })
    }).returning();

    console.log(`✅ Notification créée: ${notification.id}`);

    // 9. Vérification des données
    console.log("\n9️⃣ Vérification des données créées...");
    
    const candidatureComplete = await db.query.candidatureTable.findFirst({
      where: eq(candidatureTable.id, candidature.id),
      with: {
        candidat: {
          with: {
            utilisateur: true
          }
        },
        offre: {
          with: {
            entreprise: {
              with: {
                utilisateur: true
              }
            }
          }
        }
      }
    });

    console.log("📊 Résumé du processus:");
    console.log(`   • Candidat: ${candidatureComplete?.candidat.utilisateur.nom}`);
    console.log(`   • Entreprise: ${candidatureComplete?.offre.entreprise.nom_entreprise}`);
    console.log(`   • Offre: ${candidatureComplete?.offre.titre}`);
    console.log(`   • Statut candidature: ${candidatureComplete?.statut}`);
    console.log(`   • Date entretien: ${entretien.date_heure}`);

    console.log("\n✅ Test du processus de candidature terminé avec succès!");

  } catch (error) {
    console.error("❌ Erreur lors du test:", error);
  } finally {
    process.exit(0);
  }
}

testerProcessusCandidature();