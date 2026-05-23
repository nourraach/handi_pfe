const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:nourraach@localhost:5432/handitalents'
});

async function addRegionColumn() {
  try {
    console.log('🔧 Adding region column to utilisateur table...');
    
    await pool.query(`
      ALTER TABLE utilisateur
      ADD COLUMN IF NOT EXISTS region TEXT;
    `);
    
    console.log('✅ Region column added successfully!');
    
    // Verify the column exists
    const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'utilisateur' AND column_name = 'region';
    `);
    
    if (result.rows.length > 0) {
      console.log('✅ Verified: region column exists');
      console.log(result.rows[0]);
    } else {
      console.log('❌ Warning: region column not found after adding');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

addRegionColumn();
