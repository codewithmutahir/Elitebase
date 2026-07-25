const fs = require("fs");
const path = require("path");
const { Client } = require(path.join(__dirname, ".pg-tmp", "node_modules", "pg"));

const DIRECT_URL = process.env.DIRECT_URL;
if (!DIRECT_URL) {
  console.error("Set DIRECT_URL to the US East session pooler connection string.");
  process.exit(1);
}

const dir = path.join(__dirname, "..", "supabase", "migrations");
const files = fs
  .readdirSync(dir)
  .filter((f) => f.endsWith(".sql"))
  .sort();

// First migration already applied via Supabase MCP
const skipVersions = new Set(["20260528133200"]);
const remaining = files.filter((f) => !skipVersions.has(f.slice(0, 14)));

async function main() {
  const client = new Client({
    connectionString: DIRECT_URL,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  console.log("connected to US East");

  for (const f of remaining) {
    const name = f.replace(/^\d+_/, "").replace(/\.sql$/, "");
    const version = f.slice(0, 14);
    const sql = fs.readFileSync(path.join(dir, f), "utf8");
    process.stdout.write(`Applying ${f} ... `);
    try {
      await client.query("BEGIN");
      await client.query(sql);
      try {
        await client.query(
          `INSERT INTO supabase_migrations.schema_migrations (version, name)
           VALUES ($1, $2)
           ON CONFLICT DO NOTHING`,
          [version, name]
        );
      } catch {
        try {
          await client.query(
            `INSERT INTO supabase_migrations.schema_migrations (version)
             VALUES ($1)
             ON CONFLICT DO NOTHING`,
            [version]
          );
        } catch {
          // migration history table may differ; schema apply still counts
        }
      }
      await client.query("COMMIT");
      console.log("OK");
    } catch (err) {
      await client.query("ROLLBACK");
      console.log("FAIL");
      console.error(err.message);
      process.exitCode = 1;
      await client.end();
      return;
    }
  }

  const tables = await client.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    ORDER BY table_name
  `);
  console.log("public tables:", tables.rows.map((r) => r.table_name).join(", "));
  await client.end();
  console.log("done");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
