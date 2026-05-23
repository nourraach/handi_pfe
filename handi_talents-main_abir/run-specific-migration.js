const fs = require('fs');
const { Client } = require('pg');
require('dotenv').config();

async function runMigration() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  
  try {
    const sql = fs.readFileSync('./drizzle/0006_tiresome_sheva_callister.sql', 'utf8');
    console.log('🚀 Running migration 0006_tiresome_sheva_callister.sql...');
    
    // Split by statement breakpoint and run each statement
    const statements = sql.split('--> statement-breakpoint').filter(s => s.trim());
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim();
      if (statement) {
        try {
          await client.query(statement);
          console.log(`✅ Statement ${i + 1}/${statements.length} executed`);
        } catch (err) {
          if (err.message.includes('already exists') || err.message.includes('duplicate')) {
            console.log(`ℹ️  Statement ${i + 1} skipped (already exists)`);
          } else {
            throw err;
          }
        }
      }
    }
    
    console.log('✅ Migration completed successfully!');
  } finally {
    await client.end();
  }
}

runMigration().catch(console.error);