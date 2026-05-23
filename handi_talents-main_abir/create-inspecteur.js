const { Client } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function createInspecteur() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  
  try {
    // Données du compte inspecteur
    const inspecteurData = {
      nom: 'Inspecteur Test',
      email: 'inspecteur@handitalents.tn',
      telephone: '+216 20 123 456',
      addresse: 'Tunis, Tunisie',
      region: 'Tunis', // Région obligatoire pour les inspecteurs
      role: 'inspecteur',
      statut: 'actif',
      genre: 'homme',
      mdp: 'Inspecteur123!', // Mot de passe temporaire
    };

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await client.query(
      'SELECT id_utilisateur FROM utilisateur WHERE email = $1',
      [inspecteurData.email]
    );

    if (existingUser.rows.length > 0) {
      console.log('❌ Un utilisateur avec cet email existe déjà');
      return;
    }

    // Hasher le mot de passe
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(inspecteurData.mdp, saltRounds);

    // Insérer l'inspecteur
    const result = await client.query(`
      INSERT INTO utilisateur (
        nom, email, telephone, addresse, region, role, statut, genre, mdp, profil_complete
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id_utilisateur, nom, email, role, statut, region
    `, [
      inspecteurData.nom,
      inspecteurData.email,
      inspecteurData.telephone,
      inspecteurData.addresse,
      inspecteurData.region,
      inspecteurData.role,
      inspecteurData.statut,
      inspecteurData.genre,
      hashedPassword,
      true // profil_complete = true
    ]);

    const newInspecteur = result.rows[0];

    console.log('✅ Compte inspecteur créé avec succès !');
    console.log('📋 Détails du compte :');
    console.log(`   ID: ${newInspecteur.id_utilisateur}`);
    console.log(`   Nom: ${newInspecteur.nom}`);
    console.log(`   Email: ${newInspecteur.email}`);
    console.log(`   Rôle: ${newInspecteur.role}`);
    console.log(`   Statut: ${newInspecteur.statut}`);
    console.log(`   Région: ${newInspecteur.region}`);
    console.log('');
    console.log('🔑 Informations de connexion :');
    console.log(`   Email: ${inspecteurData.email}`);
    console.log(`   Mot de passe: ${inspecteurData.mdp}`);
    console.log('');
    console.log('🌐 Accès aux fonctionnalités :');
    console.log('   - Dashboard de supervision');
    console.log('   - Gestion des rapports de conformité');
    console.log('   - Visualisation du pipeline (région Tunis)');
    console.log('   - Performance des offres (région Tunis)');
    console.log('   - Export de données (filtré par région)');

  } catch (error) {
    console.error('❌ Erreur lors de la création du compte inspecteur:', error.message);
  } finally {
    await client.end();
  }
}

createInspecteur().catch(console.error);