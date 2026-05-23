const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function addMissingColumns() {
  console.log('🔧 Ajout des colonnes manquantes aux tables existantes...\n');

  try {
    const client = await pool.connect();
    
    console.log('📊 Vérification et ajout des colonnes pour la table candidat...');
    
    // Ajouter des colonnes à la table candidat si elles n'existent pas
    const candidatColumns = [
      'ALTER TABLE candidat ADD COLUMN IF NOT EXISTS competences JSON',
      'ALTER TABLE candidat ADD COLUMN IF NOT EXISTS experience TEXT',
      'ALTER TABLE candidat ADD COLUMN IF NOT EXISTS formation TEXT',
      'ALTER TABLE candidat ADD COLUMN IF NOT EXISTS handicap TEXT',
      'ALTER TABLE candidat ADD COLUMN IF NOT EXISTS disponibilite VARCHAR(100) DEFAULT \'Immédiate\'',
      'ALTER TABLE candidat ADD COLUMN IF NOT EXISTS salaire_souhaite VARCHAR(100)',
      'ALTER TABLE candidat ADD COLUMN IF NOT EXISTS cv_url TEXT'
    ];
    
    for (const query of candidatColumns) {
      try {
        await client.query(query);
        console.log('✅', query.split('ADD COLUMN IF NOT EXISTS ')[1]);
      } catch (error) {
        if (!error.message.includes('already exists')) {
          console.log('⚠️ Erreur:', error.message);
        }
      }
    }
    
    console.log('\n📊 Vérification et ajout des colonnes pour la table entreprise...');
    
    // Ajouter des colonnes à la table entreprise si elles n'existent pas
    const entrepriseColumns = [
      'ALTER TABLE entreprise ADD COLUMN IF NOT EXISTS secteur_activite VARCHAR(255)',
      'ALTER TABLE entreprise ADD COLUMN IF NOT EXISTS taille_entreprise VARCHAR(100)',
      'ALTER TABLE entreprise ADD COLUMN IF NOT EXISTS description_entreprise TEXT',
      'ALTER TABLE entreprise ADD COLUMN IF NOT EXISTS site_web VARCHAR(255)',
      'ALTER TABLE entreprise ADD COLUMN IF NOT EXISTS politique_handicap TEXT',
      'ALTER TABLE entreprise ADD COLUMN IF NOT EXISTS contact_rh TEXT'
    ];
    
    for (const query of entrepriseColumns) {
      try {
        await client.query(query);
        console.log('✅', query.split('ADD COLUMN IF NOT EXISTS ')[1]);
      } catch (error) {
        if (!error.message.includes('already exists')) {
          console.log('⚠️ Erreur:', error.message);
        }
      }
    }
    
    console.log('\n📊 Vérification et ajout des colonnes pour la table offre_emploi...');
    
    // Ajouter des colonnes à la table offre_emploi si elles n'existent pas
    const offreColumns = [
      'ALTER TABLE offre_emploi ADD COLUMN IF NOT EXISTS candidatures_count INT DEFAULT 0',
      'ALTER TABLE offre_emploi ADD COLUMN IF NOT EXISTS vues_count INT DEFAULT 0'
    ];
    
    for (const query of offreColumns) {
      try {
        await client.query(query);
        console.log('✅', query.split('ADD COLUMN IF NOT EXISTS ')[1]);
      } catch (error) {
        if (!error.message.includes('already exists')) {
          console.log('⚠️ Erreur:', error.message);
        }
      }
    }
    
    // Vérifier les colonnes ajoutées
    console.log('\n📋 Vérification des colonnes dans candidat...');
    const candidatColumnsCheck = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'candidat' 
      AND column_name IN ('competences', 'experience', 'formation', 'handicap', 'disponibilite', 'salaire_souhaite', 'cv_url')
      ORDER BY column_name;
    `);
    
    candidatColumnsCheck.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type}`);
    });
    
    console.log('\n📋 Vérification des colonnes dans entreprise...');
    const entrepriseColumnsCheck = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'entreprise' 
      AND column_name IN ('secteur_activite', 'taille_entreprise', 'description_entreprise', 'site_web', 'politique_handicap', 'contact_rh')
      ORDER BY column_name;
    `);
    
    entrepriseColumnsCheck.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type}`);
    });
    
    console.log('\n📋 Vérification des colonnes dans offre_emploi...');
    const offreColumnsCheck = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'offre_emploi' 
      AND column_name IN ('candidatures_count', 'vues_count')
      ORDER BY column_name;
    `);
    
    offreColumnsCheck.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type}`);
    });
    
    client.release();
    
    console.log('\n🎉 Ajout des colonnes terminé avec succès!');
    console.log('✅ Les tables sont maintenant prêtes pour les APIs de profils');
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'ajout des colonnes:', error.message);
  } finally {
    await pool.end();
  }
}

addMissingColumns().catch(console.error);