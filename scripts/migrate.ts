/**
 * Run database migration against Supabase.
 *
 * Usage:
 *   npx tsx scripts/migrate.ts
 *
 * Requires SUPABASE_DB_URL or individual connection env vars.
 */
import { readFileSync } from "fs";
import { join } from "path";
import pg from "pg";

const { Client } = pg;

async function main() {
  const client = new Client({
    host: "44.208.221.186",
    port: 6543,
    database: "postgres",
    user: "postgres.eoflqtcymqwsqaisfksi",
    password: process.env.SUPABASE_DB_PASSWORD,
    ssl: {
      rejectUnauthorized: false,
      servername: "aws-0-us-east-1.pooler.supabase.com",
    },
    connectionTimeoutMillis: 15000,
  });

  console.log("Connecting to database...");
  await client.connect();
  console.log("Connected.");

  const migrationPath = join(__dirname, "..", "supabase", "migrations", "001_initial_schema.sql");
  const sql = readFileSync(migrationPath, "utf-8");

  console.log("Running migration...");
  await client.query(sql);
  console.log("Migration complete — all tables created.");

  await client.end();
}

main().catch((err) => {
  console.error("Migration failed:", err.message);
  process.exit(1);
});
