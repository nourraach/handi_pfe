const { Client } = require('pg');
require('dotenv').config();

async function createComplianceTable() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  
  try {
    // First create the enum if it doesn't exist
    console.log('🔧 Creating compliance_report_status enum...');
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE compliance_report_status AS ENUM('submitted', 'validated', 'rejected');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    console.log('✅ Enum created or already exists');
    
    // Then create the table
    console.log('🔧 Creating compliance_report table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS compliance_report (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        id_entreprise uuid NOT NULL,
        submitted_by_user_id uuid NOT NULL,
        reviewed_by_user_id uuid,
        region text NOT NULL,
        summary text NOT NULL,
        reporting_period_start timestamp NOT NULL,
        reporting_period_end timestamp NOT NULL,
        workforce_total integer DEFAULT 0 NOT NULL,
        disabled_employees integer DEFAULT 0 NOT NULL,
        active_offers integer DEFAULT 0 NOT NULL,
        applications_count integer DEFAULT 0 NOT NULL,
        shortlisted_count integer DEFAULT 0 NOT NULL,
        hired_count integer DEFAULT 0 NOT NULL,
        accommodation_actions text,
        evidence_urls json,
        status compliance_report_status DEFAULT 'submitted' NOT NULL,
        review_comment text,
        last_recommendation text,
        recommendations json,
        submitted_at timestamp DEFAULT now() NOT NULL,
        reviewed_at timestamp,
        created_at timestamp DEFAULT now() NOT NULL,
        updated_at timestamp DEFAULT now() NOT NULL
      );
    `);
    console.log('✅ Table created successfully');
    
    // Add foreign key constraints
    console.log('🔧 Adding foreign key constraints...');
    await client.query(`
      DO $$ BEGIN
        ALTER TABLE compliance_report ADD CONSTRAINT compliance_report_id_entreprise_entreprise_id_fk 
        FOREIGN KEY (id_entreprise) REFERENCES entreprise(id) ON DELETE cascade;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    
    await client.query(`
      DO $$ BEGIN
        ALTER TABLE compliance_report ADD CONSTRAINT compliance_report_submitted_by_user_id_utilisateur_id_utilisateur_fk 
        FOREIGN KEY (submitted_by_user_id) REFERENCES utilisateur(id_utilisateur) ON DELETE restrict;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    
    await client.query(`
      DO $$ BEGIN
        ALTER TABLE compliance_report ADD CONSTRAINT compliance_report_reviewed_by_user_id_utilisateur_id_utilisateur_fk 
        FOREIGN KEY (reviewed_by_user_id) REFERENCES utilisateur(id_utilisateur) ON DELETE set null;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    
    console.log('✅ Foreign key constraints added');
    console.log('🎉 compliance_report table setup completed!');
    
  } finally {
    await client.end();
  }
}

createComplianceTable().catch(console.error);