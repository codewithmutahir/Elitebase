import { Pool } from "pg";
import { config } from "dotenv";

config({ path: ".env.local" });

const pool = new Pool({
  connectionString: process.env.SUPABASE_DATABASE_URL,
  connectionTimeoutMillis: 15000,
});

try {
  const tables = await pool.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name IN ('user', 'session', 'account', 'verification')
    ORDER BY table_name
  `);
  console.log("Better Auth tables:", tables.rows);

  const companies = await pool.query(`
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'companies' AND column_name = 'owner_uid'
  `);
  console.log("companies.owner_uid:", companies.rows);
} catch (error) {
  console.error("DB error:", error.message);
} finally {
  await pool.end();
}
