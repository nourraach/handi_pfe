const { Client } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

async function testInspecteurLogin() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  
  try {
    const email = 'inspecteur@handitalents.tn';
    const password = 'Inspecteur123!';

    // Récupérer l'utilisateur
    const result = await client.query(`
      SELECT id_utilisateur, nom, email, mdp, role, statut, region, telephone, addresse
      FROM utilisateur 
      WHERE email = $1
    `, [email]);

    if (result.rows.length === 0) {
      console.log('❌ Utilisateur non trouvé');
      return;
    }

    const user = result.rows[0];
    console.log('👤 Utilisateur trouvé :');
    console.log(`   ID: ${user.id_utilisateur}`);
    console.log(`   Nom: ${user.nom}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Rôle: ${user.role}`);
    console.log(`   Statut: ${user.statut}`);
    console.log(`   Région: ${user.region}`);

    // Vérifier le mot de passe
    const isPasswordValid = await bcrypt.compare(password, user.mdp);
    
    if (!isPasswordValid) {
      console.log('❌ Mot de passe incorrect');
      return;
    }

    console.log('✅ Mot de passe correct');

    // Générer un token JWT
    const token = jwt.sign(
      {
        id_utilisateur: user.id_utilisateur,
        email: user.email,
        role: user.role,
        region: user.region,
        nom: user.nom
      },
      process.env.JWT_SECRET || 'votre_secret_jwt_handitalent_2024',
      { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
    );

    console.log('🔑 Token JWT généré avec succès');
    console.log('');
    console.log('📋 Test de connexion API :');
    console.log('   Méthode: POST');
    console.log('   URL: http://localhost:4000/api/auth/connexion');
    console.log('   Body: {');
    console.log(`     "email": "${email}",`);
    console.log(`     "mdp": "${password}"`);
    console.log('   }');
    console.log('');
    console.log('🎯 Endpoints accessibles avec ce token :');
    console.log('   GET /api/supervision/statistics/overview');
    console.log('   GET /api/supervision/pipeline');
    console.log('   GET /api/supervision/reports');
    console.log('   GET /api/supervision/offers');
    console.log('   GET /api/supervision/candidates');
    console.log('   GET /api/supervision/export');

  } catch (error) {
    console.error('❌ Erreur lors du test de connexion:', error.message);
  } finally {
    await client.end();
  }
}

testInspecteurLogin().catch(console.error);