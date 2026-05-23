// Test simple de connexion à la base de données
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:abir@localhost:5432/handitalent'
});

async function testConnection() {
  try {
    console.log('🔌 Test de connexion à PostgreSQL...');
    
    const client = await pool.connect();
    console.log('✅ Connexion réussie!');
    
    // Test de requête simple
    const result = await client.query('SELECT NOW() as current_time');
    console.log('⏰ Heure actuelle:', result.rows[0].current_time);
    
    // Vérifier si la table offre_emploi existe
    const tableCheck = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE '%offre%'
    `);
    
    console.log('📋 Tables trouvées:', tableCheck.rows);
    
    // Compter les offres existantes
    try {
      const countResult = await client.query('SELECT COUNT(*) as total FROM offre_emploi');
      console.log('📊 Nombre d\'offres en base:', countResult.rows[0].total);
    } catch (error) {
      console.log('⚠️ Table offre_emploi n\'existe pas encore:', error.message);
    }
    
    client.release();
    console.log('🎉 Test terminé avec succès!');
    
  } catch (error) {
    console.error('❌ Erreur de connexion:', error.message);
    console.error('📋 Détails:', error);
  } finally {
    await pool.end();
  }
}

testConnection();