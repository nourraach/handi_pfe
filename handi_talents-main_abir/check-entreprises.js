// Vérifier les entreprises existantes en base
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:abir@localhost:5432/handitalent'
});

async function checkEntreprises() {
  try {
    console.log('🔍 Vérification des entreprises en base...');
    
    const client = await pool.connect();
    
    // Vérifier les entreprises existantes
    const entreprises = await client.query(`
      SELECT e.id, u.nom, u.email, e.nom_entreprise, e.statut_validation
      FROM entreprise e
      JOIN utilisateur u ON e.id_utilisateur = u.id_utilisateur
      LIMIT 5
    `);
    
    console.log('📊 Entreprises trouvées:', entreprises.rows.length);
    
    if (entreprises.rows.length > 0) {
      console.log('🏢 Première entreprise:', entreprises.rows[0]);
      
      // Utiliser la première entreprise pour tester
      const premierEntreprise = entreprises.rows[0];
      console.log('✅ ID à utiliser pour les tests:', premierEntreprise.id);
      
    } else {
      console.log('⚠️ Aucune entreprise trouvée - création d\'une entreprise de test...');
      
      // Créer un utilisateur entreprise de test
      const userResult = await client.query(`
        INSERT INTO utilisateur (nom, email, mdp, telephone, addresse, role, statut)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id_utilisateur
      `, [
        'Entreprise Test',
        'test@entreprise.com',
        'password_hash',
        '0123456789',
        'Adresse test',
        'entreprise',
        'actif'
      ]);
      
      const userId = userResult.rows[0].id_utilisateur;
      console.log('👤 Utilisateur créé avec ID:', userId);
      
      // Créer l'entreprise
      const entrepriseResult = await client.query(`
        INSERT INTO entreprise (id_utilisateur, nom_entreprise, patente, rne, statut_validation, profil_publique, date_fondation, description, nbr_employe, nbr_employe_handicape)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING id
      `, [
        userId,
        'TechCorp Test',
        'PAT123456',
        'RNE789012',
        'valide',
        true,
        new Date('2020-01-01'),
        'Entreprise de test pour les offres d\'emploi',
        50,
        5
      ]);
      
      const entrepriseId = entrepriseResult.rows[0].id;
      console.log('🏢 Entreprise créée avec ID:', entrepriseId);
      console.log('✅ Utilisez cet ID pour les tests:', entrepriseId);
    }
    
    client.release();
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error('📋 Détails:', error);
  } finally {
    await pool.end();
  }
}

checkEntreprises();