const { Client } = require('pg');
require('dotenv').config();

async function checkTables() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  
  try {
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    console.log('📋 Tables existantes:');
    result.rows.forEach(row => console.log('  -', row.table_name));
    
    // Check for specific table mentioned in error
    const reportResult = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'compliance_reports'
      );
    `);
    
    console.log('\n🔍 Table compliance_reports existe:', reportResult.rows[0].exists);
    
  } finally {
    await client.end();
  }
}

checkTables().catch(console.error);