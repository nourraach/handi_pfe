import { Pool } from "pg";

// Database connection pool for API Gateway
// Used for audit logging to centralized audit_logs table
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://postgres:postgres@postgres:5432/handitalents",
});

export { pool };
